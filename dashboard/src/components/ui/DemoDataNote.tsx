import { Banner } from "./Banner";

/**
 * Says so, on the screens whose numbers are not yet read from saved records.
 *
 * A screen that looks finished but is not connected is a quiet lie, so it carries
 * this note until it is. Say which figures are sample data (and which are live) so
 * the reader knows what to trust; with no arguments it gives the general statement.
 */
export function DemoDataNote({ sample, live }: { sample?: string; live?: string }) {
  return (
    <Banner tone="info" title="Preview data">
      {sample ? (
        <>
          Sample data: {sample}. It is illustrative and will not persist.
          {live ? <> Live: {live}.</> : null}
        </>
      ) : (
        <>
          This screen is not connected to saved records yet, so the figures shown
          are sample data and will not persist.
        </>
      )}
    </Banner>
  );
}
