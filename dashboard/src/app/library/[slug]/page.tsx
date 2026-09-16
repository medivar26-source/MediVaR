import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell, PageHeader, SectionHeader } from "@/components/shell";
import {
  Badge,
  Button,
  Chip,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  Unit,
} from "@/components/ui";
import { getLibraryDoc } from "@/lib/data/support";
import { clock, titleCase } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import p from "../../panels.module.css";

export const metadata: Metadata = { title: "Library" };

/**
 * One page per reference, each rendered entirely from catalogue rows.
 *
 * An unknown slug redirects rather than 404s, the same ruling
 * `/performance/[skill]` made — a library address somebody typed or an old link
 * should land in the library, not on an error.
 */
export default async function LibraryDocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const doc = await getLibraryDoc(slug);

  if (!doc) redirect("/library");

  return (
    <AppShell user={user} searchHint='Try searching "library"'>
      <PageHeader
        eyebrow={titleCase(doc.entry.kind)}
        title={doc.entry.title}
        lede={doc.entry.summary}
        actions={
          <Button href="/library" variant="secondary">
            All resources
          </Button>
        }
      />

      <p className={p.panelSub} style={{ marginBottom: "var(--s-6)" }}>
        Rendered from <strong>{doc.entry.derivedFrom}</strong>. Every figure on
        this page is the one the product enforces, read from the same rows.
      </p>

      {doc.slug === "tkr-walkthrough" &&
        doc.parts.map((part) => (
          <section key={part.part} aria-label={`Part ${part.part}`}>
            <SectionHeader title={`${part.part} · ${part.name}`} />
            {part.variantNote && (
              <p className={p.panelSub} style={{ marginBottom: "var(--s-3)" }}>
                {part.variantNote}
              </p>
            )}
            <Table label={`Scenes in part ${part.part}`}>
              <THead>
                <Tr>
                  <Th>Scene</Th>
                  <Th>Name</Th>
                  <Th>Category</Th>
                  <Th numeric>Par</Th>
                  <Th numeric>Maximum</Th>
                  <Th>Applies</Th>
                </Tr>
              </THead>
              <TBody>
                {part.scenes.map((scene) => (
                  <Tr key={scene.scene}>
                    <Td head>{scene.scene}</Td>
                    <Td>
                      {scene.name}
                      {scene.isCritical && (
                        <>
                          {" "}
                          <Badge status="fail">Critical</Badge>
                        </>
                      )}
                    </Td>
                    <Td>{scene.category ? titleCase(scene.category.replace(/_/g, " ")) : "—"}</Td>
                    <Td numeric>
                      {clock(scene.parTimeS)}
                      <Unit> mm:ss</Unit>
                    </Td>
                    <Td numeric>{clock(scene.maxTimeS)}</Td>
                    <Td>
                      {scene.requiresDesign
                        ? `${scene.requiresDesign} only`
                        : scene.requiresFixation
                          ? `${titleCase(scene.requiresFixation)} only`
                          : scene.requiresPatella
                            ? "Patella resurfaced"
                            : "Always"}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </section>
        ))}

      {doc.slug === "preoperative-planning" && (
        <>
          {doc.steps.map((step) => (
            <section key={step.step} aria-label={`Step ${step.step}`}>
              <SectionHeader title={`${step.step} · ${step.title}`} />
              <div className={p.panel}>
                <div className={p.panelHead}>
                  <div>
                    <p className={p.panelSub}>{step.budgetLabel}</p>
                  </div>
                  <div className={p.rowAside}>
                    <Chip tone="muted">Par {clock(step.parTimeS)}</Chip>
                    <Chip tone="muted">Max {clock(step.maxTimeS)}</Chip>
                  </div>
                </div>

                {step.fields.length === 0 ? (
                  <p className={p.panelSub}>
                    This step is answered with measurements rather than from a
                    list, so there is nothing to enumerate here.
                  </p>
                ) : (
                  step.fields.map((field) => (
                    <div key={field.field}>
                      <p className={p.rowTitle}>
                        {titleCase(field.field.replace(/_/g, " "))}
                      </p>
                      <div className={p.rows}>
                        {field.options.map((option) => (
                          <div key={option.label} className={p.row}>
                            <div className={p.rowBody}>
                              <p className={p.rowTitle}>{option.label}</p>
                              {option.detail && (
                                <p className={p.rowDetail}>{option.detail}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          ))}

          <p className={p.note}>
            The lists above are the ones the planning screens offer, from{" "}
            <strong>plan_step_options</strong>. Whether an answer is right is
            decided on the server, against
            ground truth no client role can read — so this page can tell you what
            the choices are and never which one is correct.
          </p>
        </>
      )}

      {doc.slug === "scoring" && (
        <>
          <SectionHeader title="Categories" />
          <Table label="Report categories">
            <THead>
              <Tr>
                <Th>Category</Th>
                <Th numeric>Marks</Th>
                <Th numeric>Scenes</Th>
              </Tr>
            </THead>
            <TBody>
              {doc.categories.map((category) => (
                <Tr key={category.key}>
                  <Td head>{category.label}</Td>
                  <Td numeric>{category.max}</Td>
                  <Td numeric>{category.scenes}</Td>
                </Tr>
              ))}
              <Tr>
                <Td head>Total</Td>
                <Td numeric>{doc.total}</Td>
                <Td numeric />
              </Tr>
            </TBody>
          </Table>

          <SectionHeader title="The formula" />
          <div className={p.even}>
            <section className={p.panel} aria-label="How a category is scored">
              <p className={p.panelTitle}>How a category is scored</p>
              <div className={p.prose}>
                <p>
                  Each scene outcome is worth 1.00 for a pass, 0.50 for
                  borderline and 0.00 for a fail. A scene that was never reached
                  scores zero rather than nothing — averaging only over what was
                  attempted would score a walkout at 100.
                </p>
                <p>
                  Timing is 1.0 at or under par, 0.0 at or over the maximum, and
                  linear between. A category is{" "}
                  <strong>marks × (0.9 × accuracy + 0.1 × timing)</strong>, so a
                  slow accurate learner always outscores a fast inaccurate one —
                  at that weighting it is arithmetically guaranteed.
                </p>
              </div>
            </section>

            <section className={p.panel} aria-label="Pass marks and the cap">
              <p className={p.panelTitle}>Passing</p>
              <div className={p.rows}>
                {doc.passMarks.map((mark) => (
                  <div key={mark.difficulty} className={p.row}>
                    <div className={p.rowBody}>
                      <p className={p.rowTitle}>{titleCase(mark.difficulty)}</p>
                    </div>
                    <div className={p.rowAside}>
                      <Chip tone="muted">{mark.mark} / 100</Chip>
                    </div>
                  </div>
                ))}
              </div>
              <p className={p.note}>
                Three or more critical errors cap the total at 59 and fail the
                session. The categories are still shown in full — a learner needs
                to see that they cut accurately <em>and</em> that the session
                ended anyway.
              </p>
            </section>
          </div>
        </>
      )}

      {doc.slug === "tolerances" && (
        <>
          <SectionHeader title="What difficulty does to a band" />
          <div className={p.thirds}>
            {doc.bands.map((band) => (
              <section
                key={band.difficulty}
                className={p.panel}
                aria-label={titleCase(band.difficulty)}
              >
                <p className={p.panelTitle}>{titleCase(band.difficulty)}</p>
                <p className={p.panelSub}>
                  Every authored tolerance band ×{band.factor}
                  {band.factor === 1
                    ? " — the value as authored."
                    : band.factor > 1
                      ? " — wider, so a reading further from target still passes."
                      : " — narrower, so the same reading may not."}
                </p>
              </section>
            ))}
          </div>

          <SectionHeader title="Time bands, per scene" />
          <Table label="Scene time bands">
            <THead>
              <Tr>
                <Th>Scene</Th>
                <Th>Name</Th>
                <Th numeric>Par</Th>
                <Th numeric>Maximum</Th>
              </Tr>
            </THead>
            <TBody>
              {doc.scenes.map((scene) => (
                <Tr key={scene.scene}>
                  <Td head>{scene.scene}</Td>
                  <Td>{scene.name}</Td>
                  <Td numeric>{clock(scene.parTimeS)}</Td>
                  <Td numeric>{clock(scene.maxTimeS)}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>

          <p className={p.note}>
            The per-parameter tolerances — how many degrees off a cut may be —
            are stored per case in ground truth, which no client role can read.
            That is deliberate: a learner who could read the tolerances for
            the case in front of them would be reading the answer.
          </p>
        </>
      )}

      {doc.slug === "implant-variants" && (
        <>
          <div className={p.even}>
            <section className={p.panel} aria-label="Implant design">
              <p className={p.panelTitle}>CR and PS</p>
              <p className={p.panelSub}>
                Scenes that run only for one design. Everything else runs for
                both.
              </p>
              <div className={p.rows}>
                <div className={p.row}>
                  <div className={p.rowBody}>
                    <p className={p.rowTitle}>Cruciate-retaining only</p>
                    <p className={p.rowDetail}>
                      {doc.design.CR.join(" · ") || "None"}
                    </p>
                  </div>
                </div>
                <div className={p.row}>
                  <div className={p.rowBody}>
                    <p className={p.rowTitle}>Posterior-stabilised only</p>
                    <p className={p.rowDetail}>
                      {doc.design.PS.join(" · ") || "None"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className={p.panel} aria-label="Fixation">
              <p className={p.panelTitle}>Cemented and cementless</p>
              <p className={p.panelSub}>
                Scenes that depend on how the components are fixed.
              </p>
              <div className={p.rows}>
                <div className={p.row}>
                  <div className={p.rowBody}>
                    <p className={p.rowTitle}>Cemented only</p>
                    <p className={p.rowDetail}>
                      {doc.fixation.cemented.join(" · ") || "None"}
                    </p>
                  </div>
                </div>
                <div className={p.row}>
                  <div className={p.rowBody}>
                    <p className={p.rowTitle}>Cementless only</p>
                    <p className={p.rowDetail}>
                      {doc.fixation.cementless.join(" · ") || "None"}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <section className={p.panel} aria-label="Patella">
            <p className={p.panelTitle}>Patellar resurfacing</p>
            <p className={p.panelSub}>
              Decided intra-operatively at scene 9.1 from the cartilage grade,
              not planned in advance.
            </p>
            <p className={p.rowDetail}>
              {doc.patella.join(" · ") || "No scene depends on it"}
            </p>
            <p className={p.note}>
              {doc.always} scenes run in every configuration. The running order a
              headset is handed is built from these same three columns, so this
              page cannot disagree with what it performs.
            </p>
          </section>
        </>
      )}
    </AppShell>
  );
}
