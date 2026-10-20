/**
 * The settings screen can be shown inside a modal iframe. The modal, the page
 * and the redirect helper all read these names from here, so the query string
 * and the classes that mark an embedded document are defined exactly once.
 */

export const SETTINGS_PATH = "/settings";
export const EMBED_PARAM = "embed";
export const EMBED_ON = "1";

/** Classes set on <html> and <body> while a page is shown inside the modal. */
export const EMBED_CLASS = "is-embedded";
export const SCROLLING_CLASS = "is-scrolling";

/** True when a `?embed=` value asks for the chrome-free view. */
export function isEmbedded(value: string | null | undefined): boolean {
  return value === EMBED_ON;
}

/** `/settings`, `/settings?tab=x`, optionally carrying the embed flag. */
export function settingsHref(tab?: string, embedded = false): string {
  const query = new URLSearchParams();
  if (tab) query.set("tab", tab);
  if (embedded) query.set(EMBED_PARAM, EMBED_ON);
  const qs = query.toString();
  return qs ? `${SETTINGS_PATH}?${qs}` : SETTINGS_PATH;
}
