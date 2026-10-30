/**
 * One place for how everything drawn over a scan looks, so the implant, its handles, the bone-edge markers,
 * the gap readouts and the guides all share the same thin, flat, clinical style.
 *
 * Colour roles: blue is the implant, green is a gap or an axis, yellow is a boundary or alignment reference,
 * orange is a saw cut. Strokes are hairlines (they do not scale with zoom); nothing here has a shadow,
 * a gradient or a bevel.
 */

/** The implant: a light, see-through blue so the scan stays readable underneath. */
export const IMPLANT_BLUE = "#3b82f6";
export const IMPLANT_FILL = "rgba(96, 165, 250, 0.3)";
export const IMPLANT_FILL_INSERT = "rgba(255, 255, 255, 0.14)";
/** The single outline: blue-white, thin. */
export const IMPLANT_LINE = "#c7dcff";
/** Internal lines that show useful geometry (keel, pegs, insert), kept quieter than the outline. */
export const IMPLANT_LINE_SOFT = "rgba(219, 234, 254, 0.5)";

/** Stroke widths in screen pixels (used with vector-effect: non-scaling-stroke). */
export const LINE_OUTLINE = 1.1;
export const LINE_DETAIL = 0.7;
export const LINE_GUIDE = 1;

/** Alignment and boundary references (the bone edges, the cut level, the template's box). */
export const GUIDE_YELLOW = "#facc15";
/** Gap readouts and axes. */
export const GAP_GREEN = "#22c55e";

/** Small solid panels for labels: dark enough to read on any scan, flat, with a hairline edge. */
export const LABEL_BG = "rgba(15, 23, 42, 0.78)";
export const LABEL_EDGE = "rgba(219, 234, 254, 0.28)";
