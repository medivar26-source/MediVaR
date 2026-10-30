/**
 * Draw a built film as a radiograph.
 *
 * Instead of painting shapes, the film is built the way an X-ray is formed: every tissue absorbs in
 * proportion to the length of the path the beam takes through it, and the film shows what gets through.
 *
 *   - Bone is treated as a tube. From each bone's silhouette we know how far every pixel is from the edge,
 *     which gives the chord length through a round bone. A thin dense cortex wraps a lighter medullary core,
 *     so a shaft reads as two bright walls with a darker canal, and an epiphysis as a thin bright shell
 *     around textured cancellous bone. The cortex is thick on the shaft and thin at the joint.
 *   - Cancellous bone carries a trabecular texture: crossing bundles that run along the stress lines.
 *   - Soft tissue is a thick round limb, so the leg is brightest in the middle and fades to the skin line,
 *     with muscle on top. A little scatter hazes the dark gaps.
 *   - Transmission is exp(-absorption); the display is windowed like a digital radiograph (mild edge
 *     enhancement, vignette), then detector blur and quantum noise.
 *
 * The geometry (outlines, calibration sphere, landmarks) is untouched: only how it is drawn changed.
 * The calibration sphere and the burned-in labels are added last, so their size is exact.
 */

import sharp from "sharp";
import type { BoneLayer, Film, Layer } from "./anatomy";
import type { P } from "./geometry";

const f1 = (v: number) => v.toFixed(1);

/** A small seeded random generator, so the same case always renders the same grain. */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
}
function gaussian(rand: () => number): number {
  // Box-Muller
  const u = Math.max(1e-9, rand());
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* ------------------------------------------------------------------------------------------------ */
/* Small image-processing toolbox (float arrays)                                                      */
/* ------------------------------------------------------------------------------------------------ */

type Region = { x0: number; y0: number; w: number; h: number };

function blurAxis(src: Float32Array, w: number, h: number, sigma: number, horizontal: boolean): Float32Array {
  if (sigma < 0.3) return src;
  const r = Math.max(1, Math.ceil(sigma * 3));
  const kernel = new Float32Array(2 * r + 1);
  let sum = 0;
  for (let i = -r; i <= r; i++) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel[i + r] = v;
    sum += v;
  }
  for (let i = 0; i < kernel.length; i++) kernel[i] /= sum;
  const out = new Float32Array(src.length);
  if (horizontal) {
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        let acc = 0;
        for (let i = -r; i <= r; i++) {
          const xx = Math.min(w - 1, Math.max(0, x + i));
          acc += src[row + xx] * kernel[i + r];
        }
        out[row + x] = acc;
      }
    }
  } else {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let acc = 0;
        for (let i = -r; i <= r; i++) {
          const yy = Math.min(h - 1, Math.max(0, y + i));
          acc += src[yy * w + x] * kernel[i + r];
        }
        out[y * w + x] = acc;
      }
    }
  }
  return out;
}

function blurXY(src: Float32Array, w: number, h: number, sx: number, sy: number): Float32Array {
  return blurAxis(blurAxis(src, w, h, sx, true), w, h, sy, false);
}

/** Blur with a large sigma by working on a reduced copy. */
function blurBig(src: Float32Array, w: number, h: number, sigma: number): Float32Array {
  if (sigma <= 6) return blurXY(src, w, h, sigma, sigma);
  const f = Math.max(2, Math.floor(sigma / 3));
  const sw = Math.ceil(w / f);
  const sh = Math.ceil(h / f);
  const small = new Float32Array(sw * sh);
  const cnt = new Float32Array(sw * sh);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = Math.floor(y / f) * sw + Math.floor(x / f);
      small[i] += src[y * w + x];
      cnt[i]++;
    }
  }
  for (let i = 0; i < small.length; i++) small[i] /= Math.max(1, cnt[i]);
  const b = blurXY(small, sw, sh, sigma / f, sigma / f);
  return upsample(b, sw, sh, w, h, f);
}

function upsample(small: Float32Array, sw: number, sh: number, w: number, h: number, f: number): Float32Array {
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const fy = Math.min(sh - 1, Math.max(0, (y + 0.5) / f - 0.5));
    const y0 = Math.floor(fy);
    const y1 = Math.min(sh - 1, y0 + 1);
    const ty = fy - y0;
    for (let x = 0; x < w; x++) {
      const fx = Math.min(sw - 1, Math.max(0, (x + 0.5) / f - 0.5));
      const x0 = Math.floor(fx);
      const x1 = Math.min(sw - 1, x0 + 1);
      const tx = fx - x0;
      out[y * w + x] =
        small[y0 * sw + x0] * (1 - tx) * (1 - ty) + small[y0 * sw + x1] * tx * (1 - ty) +
        small[y1 * sw + x0] * (1 - tx) * ty + small[y1 * sw + x1] * tx * ty;
    }
  }
  return out;
}

/** Exact Euclidean distance (pixels) from each inside pixel to the nearest outside pixel (Felzenszwalb). */
function edt(inside: Uint8Array, w: number, h: number): Float32Array {
  const INF = 1e12;
  const d = new Float32Array(w * h);
  for (let i = 0; i < d.length; i++) d[i] = inside[i] ? INF : 0;
  const n = Math.max(w, h);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  const f = new Float64Array(n);
  const pass = (len: number, get: (i: number) => number, set: (i: number, val: number) => void) => {
    for (let i = 0; i < len; i++) f[i] = get(i);
    let k = 0;
    v[0] = 0;
    z[0] = -INF;
    z[1] = INF;
    for (let q = 1; q < len; q++) {
      let s: number;
      for (;;) {
        const p = v[k];
        s = (f[q] + q * q - (f[p] + p * p)) / (2 * q - 2 * p);
        if (s <= z[k] && k > 0) k--;
        else break;
      }
      if (s <= z[k]) { v[k] = q; z[k] = -INF; z[k + 1] = INF; continue; }
      k++;
      v[k] = q;
      z[k] = s;
      z[k + 1] = INF;
    }
    k = 0;
    for (let q = 0; q < len; q++) {
      while (z[k + 1] < q) k++;
      const p = v[k];
      set(q, (q - p) * (q - p) + f[p]);
    }
  };
  for (let x = 0; x < w; x++) pass(h, (i) => d[i * w + x], (i, val) => { d[i * w + x] = val; });
  for (let y = 0; y < h; y++) pass(w, (i) => d[y * w + i], (i, val) => { d[y * w + i] = val; });
  for (let i = 0; i < d.length; i++) d[i] = inside[i] ? Math.sqrt(d[i]) : 0;
  return d;
}

/**
 * The local radius of a bone (or limb): the largest distance-to-edge nearby, taken on a coarse grid and
 * smoothed, so a round bone has one radius across its whole width.
 */
function localRadius(dMm: Float32Array, w: number, h: number, mmPerPx: number, windowMm: number, smoothMm: number): Float32Array {
  const cellMm = Math.max(2, windowMm / 8);
  const f = Math.max(1, Math.round(cellMm / mmPerPx));
  const sw = Math.ceil(w / f);
  const sh = Math.ceil(h / f);
  const cell = new Float32Array(sw * sh);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = Math.floor(y / f) * sw + Math.floor(x / f);
      const v = dMm[y * w + x];
      if (v > cell[i]) cell[i] = v;
    }
  }
  const rad = Math.max(1, Math.ceil(windowMm / (f * mmPerPx)));
  const tmp = new Float32Array(sw * sh);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      let m = 0;
      for (let i = -rad; i <= rad; i++) {
        const xx = x + i;
        if (xx >= 0 && xx < sw) m = Math.max(m, cell[y * sw + xx]);
      }
      tmp[y * sw + x] = m;
    }
  }
  const mx = new Float32Array(sw * sh);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      let m = 0;
      for (let i = -rad; i <= rad; i++) {
        const yy = y + i;
        if (yy >= 0 && yy < sh) m = Math.max(m, tmp[yy * sw + x]);
      }
      mx[y * sw + x] = m;
    }
  }
  const sm = blurXY(mx, sw, sh, Math.max(0.6, smoothMm / (f * mmPerPx)), Math.max(0.6, smoothMm / (f * mmPerPx)));
  return upsample(sm, sw, sh, w, h, f);
}

function stdOf(a: Float32Array): number {
  let s = 0;
  let s2 = 0;
  for (let i = 0; i < a.length; i++) { s += a[i]; s2 += a[i] * a[i]; }
  const m = s / a.length;
  return Math.sqrt(Math.max(1e-12, s2 / a.length - m * m));
}

/** Unit-variance noise with the given correlation lengths (mm) along x and y. */
function noiseField(w: number, h: number, mmPerPx: number, lxMm: number, lyMm: number, rand: () => number): Float32Array {
  const n = new Float32Array(w * h);
  for (let i = 0; i < n.length; i++) n[i] = gaussian(rand);
  const b = blurXY(n, w, h, lxMm / mmPerPx, lyMm / mmPerPx);
  const s = stdOf(b);
  for (let i = 0; i < b.length; i++) b[i] /= s;
  return b;
}

/* ------------------------------------------------------------------------------------------------ */
/* Rasterising layers                                                                                 */
/* ------------------------------------------------------------------------------------------------ */

function bboxOf(paths: P[][], k: number, W: number, H: number, padPx: number): Region | null {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const pts of paths) for (const p of pts) {
    x0 = Math.min(x0, p.x / k); y0 = Math.min(y0, p.y / k); x1 = Math.max(x1, p.x / k); y1 = Math.max(y1, p.y / k);
  }
  if (!isFinite(x0)) return null;
  const rx0 = Math.max(0, Math.floor(x0 - padPx));
  const ry0 = Math.max(0, Math.floor(y0 - padPx));
  const rx1 = Math.min(W, Math.ceil(x1 + padPx));
  const ry1 = Math.min(H, Math.ceil(y1 + padPx));
  if (rx1 <= rx0 || ry1 <= ry0) return null;
  return { x0: rx0, y0: ry0, w: rx1 - rx0, h: ry1 - ry0 };
}

const poly = (pts: P[], k: number) => `M${pts.map((p) => `${f1(p.x / k)} ${f1(p.y / k)}`).join("L")}Z`;

async function rasterise(region: Region, shapes: string): Promise<Float32Array> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${region.w}" height="${region.h}" viewBox="${region.x0} ${region.y0} ${region.w} ${region.h}"><rect x="${region.x0}" y="${region.y0}" width="${region.w}" height="${region.h}" fill="#000"/>${shapes}</svg>`;
  const { data, info } = await sharp(Buffer.from(svg), { limitInputPixels: false, density: 72 })
    .resize(region.w, region.h, { fit: "fill" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const out = new Float32Array(region.w * region.h);
  for (let i = 0; i < out.length; i++) out[i] = data[i * info.channels] / 255;
  return out;
}

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/* ------------------------------------------------------------------------------------------------ */
/* The film                                                                                           */
/* ------------------------------------------------------------------------------------------------ */

// How strongly each tissue absorbs. Tuned so soft tissue sits at about a third of the way up the grey
// scale, a cancellous epiphysis around the middle, and a shaft wall near white.
const SOFT_K = 1.55;
const BONE_K = 0.072;

export async function renderFilm(film: Film, file: string, seed: number): Promise<{ widthPx: number; heightPx: number }> {
  const k = film.mmPerPx;
  const W = Math.round(film.widthMm / k);
  const H = Math.round(film.heightMm / k);
  const rand = rng(seed * 7919 + W);
  const absorb = new Float32Array(W * H); // soft-tissue path
  const bone = new Float32Array(W * H); // bone path (equivalent mm of cortex)
  const dark = new Float32Array(W * H); // how much the medullary canal thins the bone (0..1)

  const tall = (paths: P[][]) => {
    let y0 = Infinity, y1 = -Infinity;
    for (const pts of paths) for (const p of pts) { y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
    return y1 - y0;
  };

  for (const layer of film.layers as Layer[]) {
    if (layer.kind === "bone") await addBone(layer);
    else if (layer.kind === "soft") await addSoft(layer);
    else if (layer.kind === "shade") await addShade(layer);
    else if (layer.kind === "stroke") await addStroke(layer);
  }

  async function addBone(layer: BoneLayer) {
    const region = bboxOf(layer.parts, k, W, H, 12 / k);
    if (!region) return;
    const { w, h } = region;
    const shapes = layer.parts
      .map((p, i) =>
        i === 0 && layer.holes?.length
          ? `<path d="${poly(p, k)}${layer.holes.map((hh) => poly(hh, k)).join("")}" fill="#fff" fill-rule="evenodd"/>`
          : `<path d="${poly(p, k)}" fill="#fff"/>`,
      )
      .join("");
    const cov = await rasterise(region, shapes);
    const inside = new Uint8Array(w * h);
    for (let i = 0; i < inside.length; i++) inside[i] = cov[i] > 0.5 ? 1 : 0;
    const dPx = edt(inside, w, h);
    const d = new Float32Array(w * h);
    for (let i = 0; i < d.length; i++) d[i] = inside[i] ? Math.max(0.15, (dPx[i] - 0.5 + (cov[i] - 0.5) * 0.0) * k) : 0;
    const rLoc = localRadius(d, w, h, k, 26, 5);

    // Trabecular texture: bundles along the stress lines (vertical, and crossing arcs) plus fine mottling.
    const nV = noiseField(w, h, k, 0.9, 4.6, rand);
    const nH = noiseField(w, h, k, 4, 1.0, rand);
    const nF = noiseField(w, h, k, 1.6, 1.6, rand);
    const nC = noiseField(w, h, k, 6, 6, rand);

    const rhoC = 0.62 + 0.38 * Math.min(1, layer.rim);
    const rhoM = layer.base * 0.3;
    const cScale = layer.cortexMm / 2.4;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const D = d[i];
        if (D <= 0) continue;
        const R = Math.max(rLoc[i], D, 2.5);
        const xAx = R - D; // distance from the bone's axis
        const Ltot = 2 * Math.sqrt(Math.max(0, R * R - xAx * xAx));
        // Cortex: thick on a slim shaft, thin where the bone flares into a joint.
        const cBase = R <= 17 ? 0.3 * R : Math.max(1.0, 6.1 * Math.pow(17 / R, 3));
        const c = Math.max(0.8, cBase * cScale);
        const r = R - c;
        const Lin = r > 0 ? 2 * Math.sqrt(Math.max(0, r * r - xAx * xAx)) : 0;
        const Lc = Math.max(0, Ltot - Lin);
        // Cancellous texture is strongest in the wide ends and fades along the slim shaft.
        const wide = smooth(15, 28, R);
        const tex =
          1 + layer.texture * 2.6 * wide * (0.6 * nV[i] + 0.45 * nH[i] + 0.25 * nF[i] + 0.4 * nC[i]) +
          layer.texture * 0.9 * (1 - wide) * nF[i];
        const cortexWave = 1 + 0.12 * nC[i];
        const eq = rhoC * Lc * cortexWave + rhoM * Lin * Math.max(0.15, tex);
        // Soft anti-aliased silhouette
        const edge = Math.min(1, D / (0.45 * k + 0.2));
        bone[(region.y0 + y) * W + (region.x0 + x)] += eq * (0.35 + 0.65 * edge);
      }
    }
  }

  async function addSoft(layer: Extract<Layer, { kind: "soft" }>) {
    const region = bboxOf([layer.path], k, W, H, 8 / k);
    if (!region) return;
    const { w, h } = region;
    const cov = await rasterise(region, `<path d="${poly(layer.path, k)}" fill="#fff"/>`);
    const big = tall([layer.path]) > 250;
    let field: Float32Array;
    if (big) {
      // A limb is a thick round object: absorption follows the chord through it.
      const inside = new Uint8Array(w * h);
      for (let i = 0; i < inside.length; i++) inside[i] = cov[i] > 0.5 ? 1 : 0;
      const dPx = edt(inside, w, h);
      const d = new Float32Array(w * h);
      for (let i = 0; i < d.length; i++) d[i] = inside[i] ? (dPx[i] - 0.5) * k : 0;
      const rLoc = localRadius(d, w, h, k, 90, 30);
      field = new Float32Array(w * h);
      for (let i = 0; i < field.length; i++) {
        const D = d[i];
        if (D <= 0) continue;
        const R = Math.max(rLoc[i], D, 6);
        const x = R - D;
        // Chord through an elliptical limb, normalised so the thickest part counts as 1.
        field[i] = Math.sqrt(Math.max(0, 1 - (x * x) / (R * R))) ** 0.85;
      }
    } else {
      field = cov;
    }
    const sig = Math.max(0.5, layer.blurMm / k);
    const blurred = sig > 6 ? blurBig(field, w, h, sig) : blurXY(field, w, h, sig, sig);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) absorb[(region.y0 + y) * W + region.x0 + x] += SOFT_K * layer.opacity * blurred[y * w + x];
  }

  async function addShade(layer: Extract<Layer, { kind: "shade" }>) {
    const region = bboxOf([layer.path], k, W, H, 6 / k + 6 * (layer.blurMm / k));
    if (!region) return;
    const { w, h } = region;
    const cov = await rasterise(region, `<path d="${poly(layer.path, k)}" fill="#fff"/>`);
    const sig = Math.max(0.5, layer.blurMm / k);
    const b = blurXY(cov, w, h, sig, sig);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const v = b[y * w + x];
        const gi = (region.y0 + y) * W + region.x0 + x;
        if (layer.tone === "dark") dark[gi] = Math.min(1, dark[gi] + v * layer.opacity * 2.9);
        else bone[gi] += v * layer.opacity * 14;
      }
    }
  }

  async function addStroke(layer: Extract<Layer, { kind: "stroke" }>) {
    const pad = 6 / k + layer.widthMm / k;
    const region = bboxOf([layer.path], k, W, H, pad);
    if (!region) return;
    const { w, h } = region;
    const d = `M${layer.path.map((p) => `${f1(p.x / k)} ${f1(p.y / k)}`).join("L")}`;
    const cov = await rasterise(region, `<path d="${d}" fill="none" stroke="#fff" stroke-width="${f1(layer.widthMm / k)}" stroke-linecap="round"/>`);
    const sig = Math.max(0.5, layer.blurMm / k);
    const b = blurXY(cov, w, h, sig, sig);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) bone[(region.y0 + y) * W + region.x0 + x] += b[y * w + x] * layer.opacity * 9;
  }

  // Combine: canals thin the bone path; add scatter; convert to transmitted dose and then to grey.
  const total = new Float32Array(W * H);
  for (let i = 0; i < total.length; i++) total[i] = absorb[i] + BONE_K * bone[i] * (1 - dark[i] * 0.85);
  const scatterField = blurBig(total, W, H, 22);
  const lowFreq = noiseField(W, H, k, 40, 40, rand);
  const v = new Float32Array(W * H);
  const cx = W / 2;
  const cy = H / 2;
  for (let i = 0; i < v.length; i++) {
    const x = i % W;
    const y = (i / W) | 0;
    const a = total[i] + 0.1 * scatterField[i] + 0.012 * lowFreq[i];
    const vig = 1 - 0.1 * (((x - cx) / cx) ** 2 * 0.6 + ((y - cy) / cy) ** 2 * 0.25);
    v[i] = (1 - Math.exp(-a)) * vig;
  }

  // Digital edge enhancement (unsharp mask), as a PACS applies to knee films.
  const soft6 = blurBig(v, W, H, 5 / k * 0.45);
  const out = new Float32Array(W * H);
  for (let i = 0; i < out.length; i++) out[i] = v[i] + 0.55 * (v[i] - soft6[i]);

  // Add the calibration sphere and the burned-in labels, so their size is exact.
  await burnIn(out);

  // Detector blur, then quantum noise (a little stronger where fewer photons arrive: the bright parts).
  const blurred = blurXY(out, W, H, 0.2 / k, 0.2 / k);
  const fine = new Float32Array(W * H);
  for (let i = 0; i < fine.length; i++) fine[i] = gaussian(rand);
  const mottled = blurXY(fine, W, H, 0.9, 0.9);
  const mottleStd = stdOf(mottled);
  const bytes = new Uint8Array(W * H);
  for (let i = 0; i < bytes.length; i++) {
    const g = blurred[i];
    const sigma = 0.009 + 0.012 * Math.max(0, g);
    const n = sigma * (0.6 * fine[i] + 0.8 * (mottled[i] / mottleStd));
    const val = 0.012 + (g + n) * 0.985;
    bytes[i] = Math.max(0, Math.min(255, Math.round(255 * Math.pow(Math.max(0, val), 0.95))));
  }

  await sharp(Buffer.from(bytes), { raw: { width: W, height: H, channels: 1 } })
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toFile(file);
  return { widthPx: W, heightPx: H };

  async function burnIn(img: Float32Array) {
    const labels: string[] = [];
    for (const l of film.labels) {
      const size = l.sizeMm / k;
      const x = l.at.x / k;
      const y = l.at.y / k;
      const weight = l.bold ? "700" : "400";
      if (l.boxed) {
        const bw = size * 0.95;
        const bx = l.anchor === "start" ? x - size * 0.22 : l.anchor === "end" ? x - bw + size * 0.22 : x - bw / 2;
        labels.push(`<rect x="${f1(bx)}" y="${f1(y - size * 0.95)}" width="${f1(bw)}" height="${f1(size * 1.18)}" rx="${f1(size * 0.08)}" fill="none" stroke="#fff" stroke-opacity="${l.opacity}" stroke-width="${f1(size * 0.07)}"/>`);
      }
      const tx = l.boxed && l.anchor !== "middle" ? (l.anchor === "start" ? x + size * 0.12 : x - size * 0.12) : x;
      labels.push(`<text x="${f1(tx)}" y="${f1(y)}" font-family="Arial, Helvetica, sans-serif" font-size="${f1(size)}" font-weight="${weight}" fill="#fff" fill-opacity="${l.opacity}" text-anchor="${l.anchor}">${l.text}</text>`);
    }
    const whole: Region = { x0: 0, y0: 0, w: W, h: H };
    const text = await rasterise(whole, labels.join(""));
    for (let i = 0; i < img.length; i++) img[i] = Math.max(img[i], text[i] * 0.9);

    // The sphere: a dense ball, brightest in the middle, exactly 25 mm across.
    const m = film.marker;
    const r = m.diameterMm / 2 / k;
    const cxm = m.centre.x / k;
    const cym = m.centre.y / k;
    const region = bboxOf([[{ x: m.centre.x - m.diameterMm, y: m.centre.y - m.diameterMm }, { x: m.centre.x + m.diameterMm, y: m.centre.y + m.diameterMm }]], k, W, H, 4);
    if (!region) return;
    const disc = await rasterise(region, `<circle cx="${cxm.toFixed(3)}" cy="${cym.toFixed(3)}" r="${r.toFixed(3)}" fill="#fff"/>`);
    for (let y = 0; y < region.h; y++) {
      for (let x = 0; x < region.w; x++) {
        const c = disc[y * region.w + x];
        if (c <= 0) continue;
        const px = region.x0 + x + 0.5 - cxm;
        const py = region.y0 + y + 0.5 - cym;
        const rr = Math.min(1, Math.hypot(px, py) / r);
        // limb darkening of a sphere: a steel ball is thinner towards its edge
        const shade = 0.97 - 0.14 * rr * rr - 0.05 * Math.max(0, (rr - 0.85) / 0.15);
        const gi = (region.y0 + y) * W + region.x0 + x;
        img[gi] = img[gi] * (1 - c) + shade * c;
      }
    }
  }
}

/** The saved image as one byte per pixel, for measuring it the way the planner does. */
export async function readGrey(file: string): Promise<{ gray: Uint8Array; width: number; height: number }> {
  const { data, info } = await sharp(file).greyscale().raw().toBuffer({ resolveWithObject: true });
  const gray = new Uint8Array(info.width * info.height);
  for (let i = 0; i < gray.length; i++) gray[i] = data[i * info.channels];
  return { gray, width: info.width, height: info.height };
}

/**
 * Diameter of the sphere measured back from the saved file: along 120 rays from the known centre, where
 * the brightness crosses half-way between the disc and its surroundings.
 */
export function measureDisc(img: { gray: Uint8Array; width: number; height: number }, cx: number, cy: number, approxD: number): number {
  const { gray, width, height } = img;
  const sample = (x: number, y: number) => {
    const x0 = Math.max(0, Math.min(width - 2, Math.floor(x)));
    const y0 = Math.max(0, Math.min(height - 2, Math.floor(y)));
    const fx = x - x0;
    const fy = y - y0;
    const g = (xx: number, yy: number) => gray[yy * width + xx];
    return g(x0, y0) * (1 - fx) * (1 - fy) + g(x0 + 1, y0) * fx * (1 - fy) + g(x0, y0 + 1) * (1 - fx) * fy + g(x0 + 1, y0 + 1) * fx * fy;
  };
  const r0 = approxD / 2;
  const radii: number[] = [];
  for (let i = 0; i < 120; i++) {
    const t = (2 * Math.PI * i) / 120;
    const dx = Math.cos(t);
    const dy = Math.sin(t);
    const inside = sample(cx + dx * r0 * 0.6, cy + dy * r0 * 0.6);
    const outside = sample(cx + dx * r0 * 1.35, cy + dy * r0 * 1.35);
    const half = (inside + outside) / 2;
    let prev = sample(cx + dx * r0 * 0.8, cy + dy * r0 * 0.8);
    for (let rr = r0 * 0.8 + 0.05; rr < r0 * 1.25; rr += 0.05) {
      const v = sample(cx + dx * rr, cy + dy * rr);
      if (v < half) {
        radii.push(rr - 0.05 * ((half - v) / Math.max(1e-6, prev - v)));
        break;
      }
      prev = v;
    }
  }
  radii.sort((a, b) => a - b);
  const trimmed = radii.slice(Math.floor(radii.length * 0.1), Math.ceil(radii.length * 0.9));
  return (2 * trimmed.reduce((s, v) => s + v, 0)) / trimmed.length;
}
