/**
 * The quiet second line under a session's name in a list.
 *
 * A session's name is whatever the instructor typed, and it is often "Training: <case title>", which
 * already says the mode and the case. Printing the mode and the case again, as their own columns, said the
 * same thing three times. This returns only what the name does not already say: the mode if the name
 * lacks it, the case if the name lacks it, joined with " · ". Nothing to add returns undefined, so the
 * row stays one line.
 */
export function sessionCaption({
  name,
  caseName,
  mode,
}: {
  name: string;
  caseName?: string | null;
  mode?: string | null;
}): string | undefined {
  const said = name.toLowerCase();
  const parts: string[] = [];
  if (mode && !said.includes(mode.toLowerCase())) {
    parts.push(mode.charAt(0).toUpperCase() + mode.slice(1));
  }
  if (caseName && !said.includes(caseName.toLowerCase())) parts.push(caseName);
  return parts.length > 0 ? parts.join(" · ") : undefined;
}
