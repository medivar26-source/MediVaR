import { Banner } from "./Banner";

/**
 * Says so, on the screens whose numbers are not yet read from saved records.
 *
 * Plans, sessions, reports, performance and activity are served from sample
 * data until the backend stores them. A screen that looks finished but is not
 * connected is a quiet lie, so it carries this note until it is.
 */
export function DemoDataNote() {
  return (
    <Banner tone="info" title="Preview data">
      This screen is not connected to saved records yet, so the figures shown
      are sample data and will not persist.
    </Banner>
  );
}
