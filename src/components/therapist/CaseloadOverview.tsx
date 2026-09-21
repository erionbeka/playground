import { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { analyzeMonthlyPlanWeekOutcome, getPersonalizationSummary } from "@/lib/personalization";
import { getLatestMood, getMoodEmoji } from "@/lib/mood";
import { getRecentChildEvents } from "@/lib/sessionEvents";
import { learningCurve } from "@/lib/science";
import { domainSummary, weakestDomains } from "@/lib/childModel";
import type { GameResult, HomeworkAssignment } from "@/context/AppContext";
import type { Insight } from "@/lib/gameAnalytics";
import Sparkline from "./Sparkline";
import { PersonIcon } from "@/components/icons/AppIcon";

interface ResultWithInsights extends GameResult {
  insights?: Insight[];
  independenceRate?: number;
}

function buildChildAnalytics(childAssignments: HomeworkAssignment[]) {
  const results = childAssignments
    .flatMap((assignment) => assignment.results)
    .sort((left, right) => left.completedAt.localeCompare(right.completedAt));

  const history = results.slice(-10).map((result) => ({
    endedAt: result.completedAt,
    score: result.score,
    independenceRate: (result as ResultWithInsights).independenceRate ?? undefined,
  }));

  const latestInsights: Insight[] = (() => {
    for (let index = results.length - 1; index >= 0; index -= 1) {
      const insights = (results[index] as ResultWithInsights).insights;
      if (insights && insights.length) return insights;
    }
    return [];
  })();

  return { history, latestInsights, sessionCount: results.length };
}

export default function CaseloadOverview() {
  const { children, assignments, session, therapistUsers } = useApp();
  const myTherapistId = session?.role === "therapist" ? session.userId : null;
  const therapistName = (id?: string) => therapistUsers.find((t) => t.id === id)?.name;

  const summary = useMemo(
    () =>
      children
        .map((child) => {
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
        const latestMood = getLatestMood(child.id);
        const analytics = buildChildAnalytics(childAssignments);
        const breaks = getRecentChildEvents(child.id, "breathing_break", 14).length;
        const quits = getRecentChildEvents(child.id, "quit_mid_game", 14).length;

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
          latestMood,
          analytics,
          breaks,
          quits,
          isMine: myTherapistId ? child.assignedTherapistId === myTherapistId : true,
          assignedToName: therapistName(child.assignedTherapistId) || null,
        };
      })
        .sort((left, right) => Number(right.isMine) - Number(left.isMine)),
    [assignments, children, myTherapistId, therapistUsers]
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
        <p className="mt-1 text-sm text-muted-foreground">Who needs attention today.</p>
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
                <PersonIcon label={entry.child.name} avatar={entry.child.avatar} size="md" />
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
            {session?.role === "therapist" ? (
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {entry.isMine ? "● On your caseload" : entry.assignedToName ? `Assigned to ${entry.assignedToName}` : "Unassigned"}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
              {entry.pendingReview > 0 ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">Review {entry.pendingReview}</span>
              ) : null}
              <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">Active {entry.inProgress}</span>
              {entry.advanceCount > 0 ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">Advance {entry.advanceCount}</span>
              ) : null}
              {entry.latestMood ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground" title="Latest feelings check-in">
                  {getMoodEmoji(entry.latestMood.mood)}
                </span>
              ) : null}
            </div>

            <div className="mt-3 rounded-xl bg-muted p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Score trend · last {Math.min(10, entry.analytics.sessionCount)} sessions
                </p>
                <Sparkline values={entry.analytics.history.map((point) => point.score)} />
              </div>
              {(() => {
                const curve = learningCurve(entry.analytics.history);
                if (!curve.regression || curve.tone === "info") return null;
                return (
                  <p className={`mt-2 rounded-lg px-2 py-1 text-[11px] font-semibold ${curve.tone === "good" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
                    {curve.tone === "good" ? "▲" : "▼"} {curve.slopeLabel}
                  </p>
                );
              })()}
              {(() => {
                const focus = weakestDomains(entry.child.id, 1)[0];
                if (!focus) return null;
                return (
                  <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                    Model focus domain: <span className="font-semibold capitalize text-foreground">{String(focus).replace(/-/g, " ")}</span>
                  </p>
                );
              })()}

              {entry.analytics.latestInsights.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {entry.analytics.latestInsights.slice(0, 3).map((insight) => (
                    <span
                      key={insight.label}
                      title={insight.detail}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        insight.tone === "good"
                          ? "bg-emerald-100 text-emerald-800"
                          : insight.tone === "watch"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-sky-100 text-sky-800"
                      }`}
                    >
                      {insight.label}
                    </span>
                  ))}
                </div>
              ) : null}

              {(entry.breaks > 0 || entry.quits > 0) ? (
                <p className="mt-2 text-[10px] font-medium text-muted-foreground">
                  Regulation signals (14d): {entry.breaks} calm break{entry.breaks === 1 ? "" : "s"}
                  {entry.quits > 0 ? ` · ${entry.quits} early exit${entry.quits === 1 ? "" : "s"}` : ""}
                </p>
              ) : null}
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
