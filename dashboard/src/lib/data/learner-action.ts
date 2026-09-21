import type { CaseCard } from "./cases";
import type { PlanRow } from "./plans";
import type { ReportSummary, SessionSummary } from "../types";
import { PASS_MARK } from "../types";
import { shortDate, titleCase } from "../format";

export type NextActionType =
  | "live_session"
  | "interrupted_session"
  | "continue_plan"
  | "ready_vr"
  | "start_case"
  | "review_report"
  | "none";

export type NextAction = {
  type: NextActionType;
  title: string;
  subtitle: string;
  badge: string;
  badgeTone: "pass" | "warn" | "fail" | "neutral" | "brand";
  actionLabel: string;
  href: string;
};

export type CaseLifecycleStatus =
  | "not_started"
  | "in_planning"
  | "ready_for_vr"
  | "completed"
  | "needs_retry";

export type EnrichedCaseItem = CaseCard & {
  status: CaseLifecycleStatus;
  statusLabel: string;
  associatedPlanId?: string;
};

/**
 * Resolves the primary next action for the learner based on real persisted state.
 *
 * Priority order:
 * 1. Active live simulation in headset
 * 2. Interrupted session that can be resumed
 * 3. In-progress draft plan
 * 4. Plan locked and ready for VR / paired
 * 5. Assigned unattempted case
 * 6. Latest completed assessment report
 * 7. Default fallback to case library
 */
export function resolveNextAction({
  activeSession,
  plans = [],
  cases = [],
  latestReport,
}: {
  activeSession?: {
    state: "live" | "interrupted";
    session: SessionSummary;
    elapsedS: number;
    progress: number;
  };
  plans?: PlanRow[];
  cases?: CaseCard[];
  latestReport?: { session: SessionSummary; report: ReportSummary };
}): NextAction {
  // 1. Live session
  if (activeSession?.state === "live") {
    return {
      type: "live_session",
      title: activeSession.session.caseTitle,
      subtitle: `Simulation in progress · Scene ${activeSession.session.currentScene}`,
      badge: "Live Simulation",
      badgeTone: "pass",
      actionLabel: "Join live session →",
      href: `/sessions/${activeSession.session.id}`,
    };
  }

  // 2. Interrupted session
  if (activeSession?.state === "interrupted") {
    return {
      type: "interrupted_session",
      title: activeSession.session.caseTitle,
      subtitle: `Interrupted session · Left off at scene ${activeSession.session.currentScene}`,
      badge: "Interrupted",
      badgeTone: "warn",
      actionLabel: "Resume session →",
      href: `/sessions/${activeSession.session.id}`,
    };
  }

  // 3. Draft plan in progress
  const draftPlan = plans.find((p) => p.state === "draft");
  if (draftPlan) {
    return {
      type: "continue_plan",
      title: draftPlan.caseTitle,
      subtitle: `Pre-operative plan in progress (${titleCase(draftPlan.difficulty)}) · ${draftPlan.stepsAnswered} of 6 steps answered`,
      badge: "Draft Plan",
      badgeTone: "brand",
      actionLabel: "Continue planning →",
      href: `/plan/${draftPlan.id}`,
    };
  }

  // 4. Plan ready for VR or PIN issued
  const readyPlan = plans.find(
    (p) => p.state === "ready" || p.state === "paired",
  );
  if (readyPlan) {
    return {
      type: "ready_vr",
      title: readyPlan.caseTitle,
      subtitle:
        readyPlan.state === "paired"
          ? "Pairing PIN issued · Ready for headset transfer"
          : "Locked plan sealed · Ready for headset transfer",
      badge: readyPlan.state === "paired" ? "PIN Issued" : "Ready for VR",
      badgeTone: "pass",
      actionLabel: "Review & transfer →",
      href: `/plan/${readyPlan.id}/review`,
    };
  }

  // 5. Assigned unattempted case
  const unattemptedCase = cases.find((c) => c.attempts === 0);
  if (unattemptedCase) {
    return {
      type: "start_case",
      title: unattemptedCase.title,
      subtitle: `${unattemptedCase.pathologyLabel} · ${titleCase(unattemptedCase.side)} knee · ${titleCase(unattemptedCase.difficulty)}`,
      badge: "Assigned Case",
      badgeTone: "neutral",
      actionLabel: "Start planning →",
      href: `/cases/${unattemptedCase.id}`,
    };
  }

  // 6. Latest report review
  if (latestReport) {
    return {
      type: "review_report",
      title: latestReport.session.caseTitle,
      subtitle: `Scored ${latestReport.report.totalScore}/100 · Completed on ${shortDate(latestReport.session.endedAt)}`,
      badge: "Latest Result",
      badgeTone: "pass",
      actionLabel: "Review assessment report →",
      href: `/sessions/${latestReport.session.id}/report`,
    };
  }

  // 7. Fallback
  return {
    type: "none",
    title: "All current training complete",
    subtitle:
      "You have no pending sessions or unfinished plans. Choose a case to begin a new simulation.",
    badge: "Up to date",
    badgeTone: "neutral",
    actionLabel: "Browse case catalogue →",
    href: "/cases",
  };
}

/**
 * Derives the real lifecycle status of a case for the learner.
 */
export function enrichCasesWithStatus(
  cases: CaseCard[],
  plans: PlanRow[] = [],
): EnrichedCaseItem[] {
  const planByCaseId = new Map(plans.map((p) => [p.caseId, p]));

  return cases.map((item) => {
    const plan = planByCaseId.get(item.id);
    const passMark = PASS_MARK[item.difficulty];

    if (item.bestScore !== undefined && item.bestScore >= passMark) {
      return {
        ...item,
        status: "completed",
        statusLabel: "Completed",
        associatedPlanId: plan?.id,
      };
    }

    if (plan?.state === "ready" || plan?.state === "paired") {
      return {
        ...item,
        status: "ready_for_vr",
        statusLabel: "Ready for VR",
        associatedPlanId: plan.id,
      };
    }

    if (plan?.state === "draft") {
      return {
        ...item,
        status: "in_planning",
        statusLabel: "In planning",
        associatedPlanId: plan.id,
      };
    }

    if (item.attempts > 0) {
      return {
        ...item,
        status: "needs_retry",
        statusLabel: "Needs retry",
        associatedPlanId: plan?.id,
      };
    }

    return {
      ...item,
      status: "not_started",
      statusLabel: "Not started",
      associatedPlanId: plan?.id,
    };
  });
}
