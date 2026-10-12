"""
Build the calibrated demo scans for the case library.

Why this exists
---------------
A radiograph has no built-in scale: millimetres per pixel comes from something of known size in the picture
(the V1 standard is a 25 mm radio-opaque sphere beside the bone). The earlier seed data claimed
"25 mm = 94.7 px" (0.264 mm/px) for EVERY scan, including full-leg films where the same pixels cover three
times the distance, and none of those scans actually contained a marker.

This script makes each demo scan self-consistent:

  * the generated synthetic scans carry no scanner pixel size, so a scale is chosen from anatomy (the
    reference bone sizes in `BASIS` below) and a 25 mm sphere is drawn into the picture at exactly that size;
  * the real demo full-leg film (`flap.jpg`) already has a printed 10 cm ruler, so it is left untouched and
    its scale is measured from the ruler (125 px = 100 mm);
  * the marker's pixel diameter is MEASURED back from the saved JPEG, and that measurement, not the
    intended number, is what goes into the manifest the seed script reads.

The result is written to dashboard/public/scans/ and backend/scripts/scan_manifest.json.
These are synthetic demo images (the UI labels them "DEMO / SYNTHETIC - Not for clinical use").

Needs Pillow and numpy (not part of the backend requirements):  pip install pillow numpy
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

HERE = Path(__file__).resolve().parent
PUBLIC = HERE.parent.parent / "dashboard" / "public"
OUT = PUBLIC / "scans"
MANIFEST = HERE / "scan_manifest.json"

MARKER_MM = 25.0
SS = 8  # supersampling for an accurate edge

# name -> (source file, mm per px, marker centre (x, y) in the FINAL image, flip left-right first, basis)
SCANS: dict[str, dict] = {
    "varus_flap": dict(
        src="synth_varus_flap.jpg", mm_per_px=0.84, centre=(596, 800), flip=False,
        basis="Hip centre to ankle centre is about 915 px; for a 68-year-old man (about 770 mm) that is 0.84 mm/px.",
    ),
    "varus_klat": dict(
        src="synth_varus_klat.jpg", mm_per_px=0.29, centre=(900, 760), flip=False,
        basis="Distal femoral condyle depth is about 200 px; a size-4 femoral component spans 58.4 mm, so 0.29 mm/px.",
    ),
    "valgus_flap": dict(
        src="synth_valgus_flap.jpg", mm_per_px=0.84, centre=(900, 800), flip=False,
        basis="Hip centre to ankle centre is about 870 px for an adult leg of about 730 mm, so 0.84 mm/px.",
    ),
    "valgus_klat": dict(
        src="synth_valgus_klat.jpg", mm_per_px=0.26, centre=(900, 800), flip=False,
        basis="Distal femoral condyle depth is about 220 px; a size-3 femoral component spans 56.2 mm, so 0.26 mm/px.",
    ),
    # Lateral of the opposite knee: the same plate mirrored, so anterior is on the left of the image.
    "mild_klat": dict(
        src="synth_valgus_klat.jpg", mm_per_px=0.26, centre=(110, 820), flip=True,
        basis="As valgus_klat (mirrored plate): condyle depth about 220 px for a 56-58 mm femur, so 0.26 mm/px.",
    ),
}

# The real demo film. Its 10 cm ruler (top edge y=968 to bottom tick y=1093) is 125 px long.
RULER_FILM = dict(
    name="mild_flap", src="flap.jpg", ruler_mm=100.0, ruler_px=125.0,
    basis="Printed 10 cm ruler on the film measures 125 px (y 968 to 1093): 100 mm / 125 px = 0.800 mm/px.",
)


def draw_marker(img: Image.Image, cx: float, cy: float, diameter_px: float) -> Image.Image:
    """A radio-opaque sphere: a bright disc, brightest in the middle, with a faint halo and a '25 mm' caption."""
    w, h = img.size
    layer = Image.new("L", (w * SS, h * SS), 0)
    d = ImageDraw.Draw(layer)
    r = diameter_px / 2 * SS
    d.ellipse([cx * SS - r, cy * SS - r, cx * SS + r, cy * SS + r], fill=255)
    layer = layer.resize((w, h), Image.LANCZOS)
    # a very slight dome shading, kept bright so the edge stays crisp and the disc reads as a dense sphere
    yy, xx = np.mgrid[0:h, 0:w]
    rr = np.hypot(xx + 0.5 - cx, yy + 0.5 - cy) / (diameter_px / 2)
    shade = np.clip(255 - 28 * rr**2, 0, 255)
    base = np.array(img.convert("L")).astype(np.float32)
    a = np.array(layer).astype(np.float32) / 255.0
    out = base * (1 - a) + shade * a
    res = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "L")

    # caption, to the right (or left when there is no room), small and not touching the disc
    try:
        font = ImageFont.truetype("arial.ttf", max(10, int(diameter_px * 0.28)))
    except OSError:
        font = ImageFont.load_default()
    label = "25 mm"
    tw = ImageDraw.Draw(res).textlength(label, font=font)
    tx = cx + diameter_px / 2 + 8
    if tx + tw > w - 4:
        tx = cx - diameter_px / 2 - 8 - tw
    ImageDraw.Draw(res).text((tx, cy - font.size * 0.55), label, fill=190, font=font)
    return res


def measure_marker(path: Path, cx: float, cy: float, approx_d: float) -> tuple[float, float, float]:
    """Diameter of the disc measured from the saved file, along 72 rays to the half-way level. -> (d, cx, cy)."""
    g = np.array(Image.open(path).convert("L")).astype(np.float32)
    h, w = g.shape

    def sample(x: float, y: float) -> float:
        x0, y0 = int(np.clip(np.floor(x), 0, w - 2)), int(np.clip(np.floor(y), 0, h - 2))
        fx, fy = x - x0, y - y0
        return (g[y0, x0] * (1 - fx) * (1 - fy) + g[y0, x0 + 1] * fx * (1 - fy)
                + g[y0 + 1, x0] * (1 - fx) * fy + g[y0 + 1, x0 + 1] * fx * fy)

    r0 = approx_d / 2
    angles = np.linspace(0, 2 * np.pi, 72, endpoint=False)
    inside = np.mean([sample(cx + np.cos(t) * r0 * 0.4, cy + np.sin(t) * r0 * 0.4) for t in angles])
    # the caption sits outside the disc on one side, so judge the surroundings on the side facing away from it
    outside = np.median([sample(cx + np.cos(t) * r0 * 1.7, cy + np.sin(t) * r0 * 1.7) for t in angles])
    half = (inside + outside) / 2
    radii = []
    for t in angles:
        dx, dy = np.cos(t), np.sin(t)
        for r in np.arange(r0 * 0.5, r0 * 1.8, 0.05):
            if sample(cx + dx * r, cy + dy * r) < half:
                radii.append(r)
                break
    return float(np.mean(radii) * 2), cx, cy


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, dict] = {}

    for name, s in SCANS.items():
        src = Image.open(PUBLIC / s["src"]).convert("L")
        if s["flip"]:
            src = ImageOps.mirror(src)
        diameter = MARKER_MM / s["mm_per_px"]
        cx, cy = s["centre"]
        composed = draw_marker(src, cx, cy, diameter)
        dest = OUT / f"{name}.jpg"
        composed.save(dest, quality=93, subsampling=0)
        d, mx, my = measure_marker(dest, cx, cy, diameter)
        scale = round(MARKER_MM / d, 5)
        w, h = composed.size
        manifest[name] = dict(
            file=f"scans/{name}.jpg", width_px=w, height_px=h,
            marker_type="sphere_25mm", marker_mm=MARKER_MM,
            marker_px=round(d, 2), marker_centre_px=[round(mx, 1), round(my, 1)],
            mm_per_px=scale, basis=s["basis"], embedded_marker=True, mirrored=s["flip"],
        )
        print(f"{name:12s} {w}x{h}  intended {s['mm_per_px']:.3f}  measured marker {d:.2f}px -> {scale:.5f} mm/px")

    r = RULER_FILM
    dest = OUT / f"{r['name']}.jpg"
    shutil.copyfile(PUBLIC / r["src"], dest)
    w, h = Image.open(dest).size
    manifest[r["name"]] = dict(
        file=f"scans/{r['name']}.jpg", width_px=w, height_px=h,
        marker_type="ruler_100mm", marker_mm=r["ruler_mm"], marker_px=r["ruler_px"],
        marker_centre_px=[588, 1030], mm_per_px=round(r["ruler_mm"] / r["ruler_px"], 5),
        basis=r["basis"], embedded_marker=True, mirrored=False,
    )
    print(f"{r['name']:12s} {w}x{h}  ruler {r['ruler_px']}px = {r['ruler_mm']}mm -> {manifest[r['name']]['mm_per_px']:.5f} mm/px")

    MANIFEST.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print("wrote", MANIFEST)


if __name__ == "__main__":
    main()
