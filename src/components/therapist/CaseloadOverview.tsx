import { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { analyzeMonthlyPlanWeekOutcome, getPersonalizationSummary } from "@/lib/personalization";

export default function CaseloadOverview() {
  const { children, assignments } = useApp();

  const summary = useMemo(
    () =>
      children.map((child) => {
        const childAssignments = assignments.filter((assignment) => assignment.childId === child.id);
        const pendingReview = childAssignments.filter((assignment) => assignment.therapistApproval === "pending").length;
        const monthlyReviews = childAssignments
          .filter((assignment) => assignment.monthlyPlan)
          .map((assignment) => analyzeMonthlyPlanWeekOutcome(assignment))
          .filter(Boolean);
        const stepBackCount = monthlyReviews.filter((review) => review?.recommendation === "step-back").length;
        const advanceCount = monthlyReviews.filter((review) => review?.recommendation === "advance").length;
        const inProgress = childAssignments.filter((assignment) => assignment.status === "in-progress").length;
        const personalization = getPersonalizationSummary(child, assignments);

        const alert = pendingReview > 0
          ? "Needs review"
          : stepBackCount > 0
            ? "High support trend"
            : advanceCount > 0
              ? "Ready to advance"
              : inProgress > 0
                ? "Active this week"
                : "Stable";

        return {
          child,
          pendingReview,
          stepBackCount,
          advanceCount,
          inProgress,
          completedGames: personalization.completedGamesCount,
          recommendedDifficulty: personalization.recommendedDifficulty,
          alert,
          activeGoals: child.therapyGoals.filter((goal) => goal.status === "active"),
        };
      }),
    [assignments, children]
  );

  const totals = useMemo(
    () => ({
      children: children.length,
      needsReview: summary.filter((entry) => entry.pendingReview > 0).length,
      readyToAdvance: summary.filter((entry) => entry.advanceCount > 0).length,
      highSupport: summary.filter((entry) => entry.stepBackCount > 0).length,
    }),
    [children.length, summary]
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-lg font-bold text-foreground">Caseload Overview</h2>
        <p className="mt-1 text-sm text-muted-foreground">Quick triage for who needs review, who is progressing, and who may need more support.</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Children" value={`${totals.children}`} />
        <SummaryCard label="Needs Review" value={`${totals.needsReview}`} />
        <SummaryCard label="Ready to Advance" value={`${totals.readyToAdvance}`} />
        <SummaryCard label="High Support Trend" value={`${totals.highSupport}`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {summary.map((entry) => (
          <div key={entry.child.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{entry.child.avatar}</span>
                <div>
                  <p className="font-display font-bold text-foreground">{entry.child.name}</p>
                  <p className="text-xs text-muted-foreground">Recommended difficulty: {entry.recommendedDifficulty}</p>
                </div>
              </div>
              <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                entry.alert === "Needs review"
                  ? "bg-amber-100 text-amber-800"
                  : entry.alert === "High support trend"
                    ? "bg-destructive/10 text-destructive"
                    : entry.alert === "Ready to advance"
                      ? "bg-secondary/20 text-foreground"
                      : "bg-muted text-muted-foreground"
              }`}>
                {entry.alert}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <p>Pending approvals: {entry.pendingReview}</p>
              <p>In progress: {entry.inProgress}</p>
              <p>Advance signals: {entry.advanceCount}</p>
              <p>Step-back signals: {entry.stepBackCount}</p>
            </div>

            <div className="mt-3 rounded-xl bg-muted p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Active goals</p>
              <div className="mt-2 space-y-1">
                {entry.activeGoals.length > 0 ? entry.activeGoals.slice(0, 3).map((goal) => (
                  <p key={goal.id} className="text-xs text-foreground">
                    {goal.title} ({goal.domain})
                  </p>
                )) : <p className="text-xs text-muted-foreground">No active goals yet</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted p-4 text-center">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
