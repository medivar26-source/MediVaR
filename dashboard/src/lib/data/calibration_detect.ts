/**
 * Assisted detection of the radio-opaque calibration marker.
 *
 * V1 (PDF p.1): "Calibration markers are automatically detected." This module finds *candidates* — bright,
 * round, well-contrasted blobs of a plausible size — and reports how sure it is. It does not decide the
 * scale: the surgeon looks at the proposed circle and confirms it (or measures by hand). A detection is a
 * suggestion, never a verification.
 *
 * What it can and cannot do (engineering description; not clinically validated):
 *  • Assumes a standard-polarity radiograph (dense = bright), so a metal sphere is a bright disc.
 *  • Finds round blobs (isotropic second moments, circle-like fill ratio) with a clear edge. Overlapping
 *    structures, a marker partly outside the field, or a sphere that merges with bone will be missed.
 *  • Returns "ambiguous" when more than one equally good candidate exists, and "none" rather than guessing.
 *  • Does not know the marker's true size; the caller supplies it (V1: 25 mm).
 *  • Cannot correct for a marker that is not in the plane of the bone (a known, large source of error in
 *    marker-based templating).
 */

export type MarkerCandidate = {
  /** Centre and diameter in the pixels of the image passed in. */
  cx: number;
  cy: number;
  diameterPx: number;
  /** 0-1. How circular and how well-edged the blob is. Not a probability. */
  confidence: number;
};

export type MarkerDetection =
  | { status: "found"; candidate: MarkerCandidate; candidates: MarkerCandidate[] }
  | { status: "ambiguous"; candidates: MarkerCandidate[] }
  | { status: "none"; candidates: MarkerCandidate[] };

export type DetectOptions = {
  /** Smallest / largest marker diameter as a fraction of the shorter image side. */
  minDiameterFraction?: number;
  maxDiameterFraction?: number;
  /** A candidate below this confidence is discarded. */
  minConfidence?: number;
};

const DEFAULTS: Required<DetectOptions> = {
  minDiameterFraction: 0.012,
  maxDiameterFraction: 0.14,
  minConfidence: 0.8,
};

type Gray = Uint8Array | Uint8ClampedArray;

/** Box-downscale by an integer factor so blob finding stays fast on large radiographs. */
function downscale(gray: Gray, w: number, h: number, f: number) {
  if (f <= 1) return { data: gray, w, h };
  const nw = Math.floor(w / f);
  const nh = Math.floor(h / f);
  const out = new Uint8Array(nw * nh);
  for (let y = 0; y < nh; y++) {
    for (let x = 0; x < nw; x++) {
      let sum = 0;
      for (let dy = 0; dy < f; dy++) for (let dx = 0; dx < f; dx++) sum += gray[(y * f + dy) * w + (x * f + dx)];
      out[y * nw + x] = Math.round(sum / (f * f));
    }
  }
  return { data: out, w: nw, h: nh };
}

function percentile(gray: Gray, p: number): number {
  const hist = new Uint32Array(256);
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++;
  const target = Math.floor(gray.length * p);
  let acc = 0;
  for (let v = 0; v < 256; v++) {
    acc += hist[v];
    if (acc > target) return v;
  }
  return 255;
}

type Blob = { area: number; sx: number; sy: number; sxx: number; syy: number; sxy: number; minX: number; maxX: number; minY: number; maxY: number };

function blobs(mask: Uint8Array, w: number, h: number): Blob[] {
  const seen = new Uint8Array(mask.length);
  const out: Blob[] = [];
  const stack: number[] = [];
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || seen[start]) continue;
    const b: Blob = { area: 0, sx: 0, sy: 0, sxx: 0, syy: 0, sxy: 0, minX: w, maxX: 0, minY: h, maxY: 0 };
    stack.push(start);
    seen[start] = 1;
    while (stack.length) {
      const i = stack.pop()!;
      const x = i % w;
      const y = (i - x) / w;
      b.area++;
      b.sx += x; b.sy += y; b.sxx += x * x; b.syy += y * y; b.sxy += x * y;
      if (x < b.minX) b.minX = x;
      if (x > b.maxX) b.maxX = x;
      if (y < b.minY) b.minY = y;
      if (y > b.maxY) b.maxY = y;
      if (x > 0 && mask[i - 1] && !seen[i - 1]) { seen[i - 1] = 1; stack.push(i - 1); }
      if (x < w - 1 && mask[i + 1] && !seen[i + 1]) { seen[i + 1] = 1; stack.push(i + 1); }
      if (y > 0 && mask[i - w] && !seen[i - w]) { seen[i - w] = 1; stack.push(i - w); }
      if (y < h - 1 && mask[i + w] && !seen[i + w]) { seen[i + w] = 1; stack.push(i + w); }
    }
    out.push(b);
  }
  return out;
}

/** Bilinear sample of the full-resolution image. */
function sample(gray: Gray, w: number, h: number, x: number, y: number): number {
  const x0 = Math.max(0, Math.min(w - 1, Math.floor(x)));
  const y0 = Math.max(0, Math.min(h - 1, Math.floor(y)));
  const x1 = Math.min(w - 1, x0 + 1);
  const y1 = Math.min(h - 1, y0 + 1);
  const fx = x - x0;
  const fy = y - y0;
  return (
    gray[y0 * w + x0] * (1 - fx) * (1 - fy) +
    gray[y0 * w + x1] * fx * (1 - fy) +
    gray[y1 * w + x0] * (1 - fx) * fy +
    gray[y1 * w + x1] * fx * fy
  );
}

/**
 * Refine a candidate on the full-resolution image: along 48 rays from the centre, find the radius where the
 * intensity falls to halfway between the inside and the surroundings. Returns the mean diameter, the spread
 * of the radii (a round marker has a small spread) and the inside/outside contrast.
 */
function refine(gray: Gray, w: number, h: number, cx: number, cy: number, approxR: number) {
  const inner: number[] = [];
  for (let a = 0; a < 16; a++) {
    const t = (a / 16) * Math.PI * 2;
    inner.push(sample(gray, w, h, cx + Math.cos(t) * approxR * 0.4, cy + Math.sin(t) * approxR * 0.4));
  }
  const inside = inner.reduce((s, v) => s + v, 0) / inner.length;

  const ring: number[] = [];
  for (let a = 0; a < 24; a++) {
    const t = (a / 24) * Math.PI * 2;
    ring.push(sample(gray, w, h, cx + Math.cos(t) * approxR * 1.7, cy + Math.sin(t) * approxR * 1.7));
  }
  const outside = ring.reduce((s, v) => s + v, 0) / ring.length;
  const contrast = inside - outside;
  const half = (inside + outside) / 2;

  const radii: number[] = [];
  for (let a = 0; a < 48; a++) {
    const t = (a / 48) * Math.PI * 2;
    const dx = Math.cos(t);
    const dy = Math.sin(t);
    let found: number | undefined;
    for (let r = approxR * 0.5; r <= approxR * 1.8; r += 0.25) {
      if (sample(gray, w, h, cx + dx * r, cy + dy * r) < half) {
        found = r;
        break;
      }
    }
    if (found !== undefined) radii.push(found);
  }
  if (radii.length < 40) return undefined;
  const mean = radii.reduce((s, v) => s + v, 0) / radii.length;
  const sd = Math.sqrt(radii.reduce((s, v) => s + (v - mean) ** 2, 0) / radii.length);
  return { diameter: mean * 2, spread: sd / mean, contrast };
}

export function detectMarkerCandidates(gray: Gray, width: number, height: number, options: DetectOptions = {}): MarkerCandidate[] {
  const o = { ...DEFAULTS, ...options };
  if (width < 32 || height < 32 || gray.length < width * height) return [];

  const shorter = Math.min(width, height);
  const factor = Math.max(1, Math.round(Math.max(width, height) / 640));
  const small = downscale(gray, width, height, factor);

  const minD = shorter * o.minDiameterFraction;
  const maxD = shorter * o.maxDiameterFraction;
  const candidates: MarkerCandidate[] = [];

  for (const p of [0.995, 0.985, 0.97]) {
    const cut = percentile(small.data, p);
    if (cut < 80) continue; // nothing in this image is bright enough to be a dense marker
    const mask = new Uint8Array(small.data.length);
    for (let i = 0; i < mask.length; i++) mask[i] = small.data[i] >= cut ? 1 : 0;

    for (const b of blobs(mask, small.w, small.h)) {
      const bw = (b.maxX - b.minX + 1) * factor;
      const bh = (b.maxY - b.minY + 1) * factor;
      const eqD = Math.sqrt((4 * b.area * factor * factor) / Math.PI);
      if (eqD < minD || eqD > maxD) continue;

      // Isotropy of the blob: a disc has equal second moments in every direction.
      const mx = b.sx / b.area;
      const my = b.sy / b.area;
      const cxx = b.sxx / b.area - mx * mx;
      const cyy = b.syy / b.area - my * my;
      const cxy = b.sxy / b.area - mx * my;
      const tr = cxx + cyy;
      const det = cxx * cyy - cxy * cxy;
      const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
      const l1 = tr / 2 + disc;
      const l2 = tr / 2 - disc;
      const isotropy = l1 > 0 ? Math.sqrt(Math.max(0, l2) / l1) : 0;
      const fill = (b.area * factor * factor) / (bw * bh);
      if (isotropy < 0.82 || fill < 0.66 || fill > 0.9) continue;

      const cx = (mx + 0.5) * factor;
      const cy = (my + 0.5) * factor;
      const r = refine(gray, width, height, cx, cy, eqD / 2);
      if (!r || r.contrast < 25 || r.spread > 0.09) continue;
      if (r.diameter < minD || r.diameter > maxD) continue;

      const roundness = Math.max(0, 1 - r.spread / 0.09);
      const shape = Math.max(0, 1 - Math.abs(fill - Math.PI / 4) / 0.12);
      const edge = Math.min(1, r.contrast / 80);
      const confidence = 0.4 * roundness + 0.2 * shape + 0.2 * Math.min(1, isotropy) + 0.2 * edge;
      if (confidence < o.minConfidence) continue;
      candidates.push({ cx, cy, diameterPx: Number(r.diameter.toFixed(2)), confidence: Number(confidence.toFixed(3)) });
    }
  }

  // Merge the same blob found at different thresholds, keeping the most confident.
  candidates.sort((a, b) => b.confidence - a.confidence);
  const merged: MarkerCandidate[] = [];
  for (const c of candidates) {
    if (!merged.some((m) => Math.hypot(m.cx - c.cx, m.cy - c.cy) < Math.max(m.diameterPx, c.diameterPx) * 0.6)) merged.push(c);
  }
  return merged.slice(0, 5);
}

/** One call: a clear single candidate is "found"; several comparable ones are "ambiguous"; none is "none". */
export function detectCalibrationMarker(gray: Gray, width: number, height: number, options: DetectOptions = {}): MarkerDetection {
  const candidates = detectMarkerCandidates(gray, width, height, options);
  if (candidates.length === 0) return { status: "none", candidates };
  const [best, second] = candidates;
  if (second && second.confidence >= best.confidence - 0.08) return { status: "ambiguous", candidates };
  return { status: "found", candidate: best, candidates };
}

/** The scale a detected marker implies, if its real size is `markerMm`. A proposal, not a measurement. */
export function scaleFromDetection(candidate: MarkerCandidate, markerMm: number): number | undefined {
  return markerMm > 0 && candidate.diameterPx > 0 ? markerMm / candidate.diameterPx : undefined;
}
