import type { Metadata } from "next";
import { Download, FolderOpen, Play, Plus, Search } from "lucide-react";
import { AppShell, PageHeader, SectionHeader } from "@/components/shell";
import {
  Badge,
  Banner,
  Button,
  Card,
  CardHeader,
  Checkbox,
  Chip,
  EmptyState,
  Input,
  MetricTile,
  ProgressBar,
  Select,
  Skeleton,
  Stepper,
  TBody,
  THead,
  Table,
  Td,
  Th,
  Tr,
  Unit,
} from "@/components/ui";
import { getCurrentUser } from "@/lib/session";
import s from "./kit.module.css";

export const metadata: Metadata = { title: "Component kit" };

const BRAND_SWATCHES = [
  { name: "brand", value: "var(--brand)", hex: "#0F7A46" },
  { name: "brand-hover", value: "var(--brand-hover)", hex: "#0C6339" },
  { name: "brand-surface", value: "var(--brand-surface)", hex: "#E8F3EC" },
  { name: "forest", value: "var(--forest)", hex: "#0D1F18" },
];

const STATUS_SWATCHES = [
  { name: "pass", value: "var(--pass)", hex: "#0B7A5A" },
  { name: "warn", value: "var(--warn)", hex: "#9A6212" },
  { name: "fail", value: "var(--fail)", hex: "#B0322A" },
  { name: "info", value: "var(--info)", hex: "#1F5F8B" },
];

const NEUTRAL_SWATCHES = [
  { name: "ink", value: "var(--ink)", hex: "#0E1512" },
  { name: "text", value: "var(--text)", hex: "#37423C" },
  { name: "text-muted", value: "var(--text-muted)", hex: "#5E6B64" },
  { name: "border", value: "var(--border)", hex: "#DEE4E0" },
  { name: "canvas", value: "var(--canvas)", hex: "#F4F7F5" },
  { name: "surface", value: "var(--surface)", hex: "#FFFFFF" },
];

const RADII = ["--r-xs", "--r-sm", "--r-md", "--r-lg", "--r-xl", "--r-pill"];

const PLANNING_STEPS = [
  { label: "Case history", meta: "45–60 s", state: "done" as const },
  { label: "Imaging review", meta: "1.5–2 min", state: "done" as const },
  { label: "Deformity measurement", meta: "1 min", state: "current" as const },
  { label: "Alignment planning", meta: "1 min", state: "upcoming" as const },
  { label: "Implant selection", meta: "Gated", state: "blocked" as const },
];

export default async function KitPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user} searchHint='Try searching "badge"'>
      <PageHeader
        eyebrow="Design foundation"
        title="Component kit"
        lede="Every token and primitive the twenty screens are built from. Nothing here reads a literal value — it all comes from tokens.css."
        actions={<Button variant="secondary" icon={Download}>Export tokens</Button>}
      />

      {/* ---------- colour ---------- */}
      <SectionHeader title="Colour" />
      <Card>
        <CardHeader
          title="Brand — interactive only"
          subtitle="Buttons, active navigation, links, focus rings. Never a status."
        />
        <div className={s.swatches}>
          {BRAND_SWATCHES.map((c) => (
            <div className={s.swatch} key={c.name}>
              <div className={s.chipColor} style={{ background: c.value }} />
              <span className={s.swatchName}>{c.name}</span>
              <span className={s.swatchMeta}>{c.hex}</span>
            </div>
          ))}
        </div>

        <div style={{ height: "var(--s-7)" }} />

        <CardHeader
          title="Status — verdicts only"
          subtitle="Badges, bars, row tints. Never an interactive control."
        />
        <div className={s.swatches}>
          {STATUS_SWATCHES.map((c) => (
            <div className={s.swatch} key={c.name}>
              <div className={s.chipColor} style={{ background: c.value }} />
              <span className={s.swatchName}>{c.name}</span>
              <span className={s.swatchMeta}>{c.hex}</span>
            </div>
          ))}
        </div>

        <div style={{ height: "var(--s-7)" }} />

        <CardHeader title="Neutrals" subtitle="Warm-cast greys that sit under green without going blue." />
        <div className={s.swatches}>
          {NEUTRAL_SWATCHES.map((c) => (
            <div className={s.swatch} key={c.name}>
              <div className={s.chipColor} style={{ background: c.value }} />
              <span className={s.swatchName}>{c.name}</span>
              <span className={s.swatchMeta}>{c.hex}</span>
            </div>
          ))}
        </div>

        <div style={{ height: "var(--s-5)" }} />
        <p className={s.note}>
          <strong>The two greens never swap jobs.</strong> Brand{" "}
          <code>#0F7A46</code> is a deep forest and appears only on things you
          can press. Pass <code>#0B7A5A</code> is a cooler emerald and appears
          only on verdicts. Both clear 5:1 against white. That separation, plus
          the rule that every status also carries an icon and a text label, is
          what stops a Pass badge reading as a brand chip.
        </p>
      </Card>

      {/* ---------- type ---------- */}
      <SectionHeader title="Typography" />
      <Card>
        <div className={s.specimen}>
          <span className={`${s.specimenSample} ${s.display}`}>92 / 100</span>
          <span className={s.specimenMeta}>Figtree 700 · 44/1.05</span>
        </div>
        <div className={s.specimen}>
          <h1 className={s.specimenSample}>Surgical case report</h1>
          <span className={s.specimenMeta}>Figtree 700 · 32/1.15</span>
        </div>
        <div className={s.specimen}>
          <h2 className={s.specimenSample}>Alignment &amp; position</h2>
          <span className={s.specimenMeta}>Figtree 700 · 22/1.25</span>
        </div>
        <div className={s.specimen}>
          <h3 className={s.specimenSample}>Category breakdown</h3>
          <span className={s.specimenMeta}>Figtree 700 · 17/1.35</span>
        </div>
        <div className={s.specimen}>
          <p className={s.specimenSample}>
            Cut depth 11.4 mm exceeds the 8 mm target by 3.4 mm. Reduce depth or
            reposition the jig.
          </p>
          <span className={s.specimenMeta}>Inter 400 · 15/1.55</span>
        </div>
        <div className={s.specimen}>
          <span className={`${s.specimenSample} ${s.overline}`}>
            Pre-operative phase
          </span>
          <span className={s.specimenMeta}>Inter 700 · 11 · 0.11em</span>
        </div>
      </Card>

      {/* ---------- shape ---------- */}
      <SectionHeader title="Radius" />
      <Card>
        <div className={s.radii}>
          {RADII.map((token) => (
            <div
              key={token}
              className={s.radiusBox}
              style={{ borderRadius: `var(${token})` }}
            >
              {token.replace("--r-", "")}
            </div>
          ))}
        </div>
        <div style={{ height: "var(--s-5)" }} />
        <p className={s.note}>
          Curved language, as directed. This supersedes{" "}
          the agreed scale, which locks radii at 2px and 4px and
          forbids pill shapes — that clause needs updating.
        </p>
      </Card>

      {/* ---------- buttons ---------- */}
      <SectionHeader title="Buttons" />
      <Card>
        <div className={s.row}>
          <Button variant="primary" size="lg" icon={Play}>
            Start procedure
          </Button>
          <Button variant="primary">Save plan</Button>
          <Button variant="secondary">Cancel</Button>
          <Button variant="tonal">Configure</Button>
          <Button variant="ghost">View all</Button>
          <Button variant="danger">Discard session</Button>
        </div>
        <div style={{ height: "var(--s-5)" }} />
        <div className={s.row}>
          <Button size="sm">Small</Button>
          <Button variant="primary" loading>
            Saving
          </Button>
          <Button disabled>Disabled</Button>
          <Button icon={Plus} aria-label="Add case" />
          <Button variant="secondary" icon={Search} aria-label="Search" />
        </div>
        <div style={{ height: "var(--s-5)" }} />
        <p className={s.note}>
          One primary action per screen. Every control is at least 44px tall,
          meeting the touch-target minimum, and shows a visible focus ring on
          keyboard navigation.
        </p>
      </Card>

      {/* ---------- status ---------- */}
      <SectionHeader title="Status &amp; filters" />
      <div className={s.grid2}>
        <Card>
          <CardHeader title="Badges" subtitle="Verdicts. Icon + label, always." />
          <div className={s.row}>
            <Badge status="pass">In range</Badge>
            <Badge status="warn">Borderline</Badge>
            <Badge status="fail">Out of range</Badge>
            <Badge status="neutral">Pending</Badge>
            <Badge status="active">Live</Badge>
          </div>
        </Card>
        <Card>
          <CardHeader title="Chips" subtitle="Filters and metadata. Never a verdict." />
          <div className={s.row}>
            <Chip selected>Osteoarthritis</Chip>
            <Chip>Right</Chip>
            <Chip icon={FolderOpen} count={8}>
              Cases
            </Chip>
            <Chip tone="muted">CR · Cemented</Chip>
          </div>
        </Card>
      </div>

      {/* ---------- metrics ---------- */}
      <SectionHeader title="Metric tiles" />
      <div className={s.grid4}>
        <MetricTile
          label="Hip–knee–ankle"
          value="172.8"
          unit="°"
          status={<Badge status="fail">Outside 178–182°</Badge>}
          hint="Mechanical axis measured on the full-length standing radiograph."
        />
        <MetricTile
          label="Tibial slope"
          value="3.2"
          unit="°"
          status={<Badge status="pass">In range</Badge>}
        />
        <MetricTile
          label="Overall score"
          value="92"
          unit="/ 100"
          status={<Badge status="pass">Passed</Badge>}
        />
        <MetricTile
          label="Critical errors"
          value="1"
          status={<Badge status="warn">−5 points</Badge>}
        />
      </div>
      <div style={{ height: "var(--s-5)" }} />
      <p className={s.note}>
        The value stays <strong>ink</strong> in every state — only the badge is
        coloured. A wall of tiles then reads as calm data rather than an alarm
        panel.
      </p>

      {/* ---------- progress ---------- */}
      <SectionHeader title="Progress" />
      <Card>
        <div className={s.stack}>
          <ProgressBar
            label="Overall score"
            valueLabel="92 / 100"
            value={92}
            tone="pass"
            size="lg"
            threshold={70}
            thresholdLabel="Marker shows the Intermediate pass mark of 70."
          />
          <ProgressBar label="Bone cuts & alignment" valueLabel="22 / 25" value={88} tone="warn" />
          <ProgressBar label="Procedure progress" valueLabel="Part 6 of 11" value={57} />
        </div>
      </Card>

      {/* ---------- table ---------- */}
      <SectionHeader title="Table" />
      <Card padding="none">
        <Table label="Alignment and position, planned versus achieved" bare>
          <THead>
            <Tr>
              <Th>Parameter</Th>
              <Th numeric>Planned</Th>
              <Th numeric>Achieved</Th>
              <Th>Acceptable</Th>
              <Th>Status</Th>
            </Tr>
          </THead>
          <TBody>
            <Tr>
              <Td head>Posterior tibial slope</Td>
              <Td numeric>3.0<Unit>°</Unit></Td>
              <Td numeric>3.2<Unit>°</Unit></Td>
              <Td>0°–7°</Td>
              <Td><Badge status="pass">Pass</Badge></Td>
            </Tr>
            <Tr>
              <Td head>HKA (mechanical axis)</Td>
              <Td numeric>0.0<Unit>°</Unit></Td>
              <Td numeric>1.2<Unit>° var</Unit></Td>
              <Td>±3°</Td>
              <Td><Badge status="pass">Pass</Badge></Td>
            </Tr>
            <Tr state="warn">
              <Td head>Distal femur — medial/lateral</Td>
              <Td numeric>≤1.0<Unit>mm</Unit></Td>
              <Td numeric>1.4<Unit>mm</Unit></Td>
              <Td>≤2 mm caution</Td>
              <Td><Badge status="warn">Borderline</Badge></Td>
            </Tr>
            <Tr state="fail">
              <Td head>Anterior notch depth</Td>
              <Td numeric>0<Unit>mm</Unit></Td>
              <Td numeric>1.2<Unit>mm</Unit></Td>
              <Td>No notching</Td>
              <Td><Badge status="fail">Critical</Badge></Td>
            </Tr>
          </TBody>
        </Table>
      </Card>
      <div style={{ height: "var(--s-5)" }} />
      <p className={s.note}>
        Planned and achieved sit adjacent so the eye compares without travel.
        Numeric columns are right-aligned with tabular figures; units live in
        their own muted span so the digits themselves stay in line.
      </p>

      {/* ---------- forms ---------- */}
      <SectionHeader title="Forms" />
      <Card>
        <div className={s.grid3}>
          <Input
            label="Case name"
            placeholder="Varus OA, right knee"
            helper="Shown on the report header."
          />
          <Select label="Difficulty" defaultValue="intermediate" required>
            <option value="beginner">Beginner — pass mark 60</option>
            <option value="intermediate">Intermediate — pass mark 70</option>
            <option value="expert">Expert — pass mark 80</option>
          </Select>
          <Input
            label="Insert thickness"
            defaultValue="14 mm"
            error="A 14 mm insert overstuffs a 19 mm gap by 3 mm. Choose 10 mm, or increase the distal femoral resection."
          />
        </div>
        <div style={{ height: "var(--s-5)" }} />
        <Checkbox
          label="Medial tightness acknowledged"
          helper="8.2° varus with a contracted medial sleeve. Staged release will be required."
          defaultChecked
        />
        <Checkbox
          label="Patellar maltracking"
          helper="Mild patellofemoral change on skyline. Track after trialling."
        />
      </Card>

      {/* ---------- banners ---------- */}
      <SectionHeader title="Banners" />
      <div className={s.stack}>
        <Banner
          tone="brand"
          title="A session is running now"
          action={<Button size="sm" variant="primary">Watch progress</Button>}
        >
          Case 1 — Varus OA · Part 6 Balancing &amp; trialling · 9 min 14 s elapsed.
        </Banner>
        <Banner tone="pass" title="Connection test passed">
          The dashboard rendered in 84 ms and the headset reported in 1.2 s.
        </Banner>
        <Banner
          tone="warn"
          title="You are offline"
          action={<Button size="sm">Retry</Button>}
        >
          Read-only data stays visible. Write actions are disabled until the connection returns.
        </Banner>
        <Banner tone="fail" title="Anterior notching detected">
          Your anterior femoral cut notched the cortex by 1.2 mm. Size up or shift the block anteriorly before committing to the cut.
        </Banner>
      </div>

      {/* ---------- stepper ---------- */}
      <SectionHeader title="Stepper" />
      <div className={s.grid2}>
        <Card>
          <CardHeader title="Vertical — planning" />
          <Stepper steps={PLANNING_STEPS} label="Pre-operative planning steps" />
        </Card>
        <Card>
          <CardHeader title="Horizontal — operative parts" />
          <Stepper
            orientation="horizontal"
            label="Operative parts"
            steps={[
              { label: "P0", state: "done" },
              { label: "P1", state: "done" },
              { label: "P2", state: "done" },
              { label: "Balancing", state: "current" },
              { label: "P7", state: "upcoming" },
              { label: "P9", state: "upcoming" },
            ]}
          />
        </Card>
      </div>

      {/* ---------- states ---------- */}
      <SectionHeader title="Empty &amp; loading" />
      <div className={s.grid2}>
        <EmptyState
          icon={FolderOpen}
          title="No sessions yet"
          action={<Button variant="primary">Start simulation</Button>}
        >
          Plan a case and send it to the headset. Your first report will appear
          here.
        </EmptyState>
        <Card>
          <div className={s.stack}>
            <Skeleton width="42%" height="20px" />
            <Skeleton width="88%" />
            <Skeleton width="66%" />
            <div style={{ height: "var(--s-2)" }} />
            <div className={s.grid2}>
              <Skeleton block height="76px" />
              <Skeleton block height="76px" />
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
