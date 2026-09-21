import { useCallback, useMemo, useState } from "react";
import { ClinicalRatings, SkillDomain, useApp } from "@/context/AppContext";
import { getGameById } from "@/data/games";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, Legend } from "recharts";
import { analyzeMonthlyPlanWeekOutcome } from "@/lib/personalization";
import { masteryStatus } from "@/lib/science";
import TraceInspector from "./TraceInspector";
import InsightDashboard from "./InsightDashboard";

interface ResultWithInsights {
  independenceRate?: number;
  trace?: import("@/lib/gameAnalytics").SessionTrace;
}
import { GameIcon, PersonIcon } from "@/components/icons/AppIcon";

const domainLabels: Record<SkillDomain, string> = {
  social: "Social",
  communication: "Communication",
  attention: "Attention",
  motor: "Motor",
  sequencing: "Sequencing",
  "emotional-regulation": "Emotional Reg.",
  "daily-living": "Daily Living",
  academic: "Academic",
};

const clinicalRatingLabels: Array<{ key: keyof ClinicalRatings; label: string }> = [
  { key: "communicationSupport", label: "Communication" },
  { key: "regulationSupport", label: "Regulation" },
  { key: "transitionSupport", label: "Transitions" },
  { key: "promptDependence", label: "Prompting" },
  { key: "reinforcementResponse", label: "Reinforcement" },
];

export default function HomeworkReview() {
  const { assignments, children, removeGameFromAssignment, approveAssignment, updateGoalStatus } = useApp();
  const [selectedChildId, setSelectedChildId] = useState<string>("all");
  const [filterType, setFilterType] = useState<"all" | "homework" | "classwork">("all");
  const [reviewMode, setReviewMode] = useState<"quick" | "detailed">("quick");
  const [generating, setGenerating] = useState(false);
  const [openReviewKey, setOpenReviewKey] = useState<string | null>(null);

  const getChild = useCallback((id: string) => children.find((entry) => entry.id === id), [children]);
  const selectedChildren = useMemo(
    () => selectedChildId === "all" ? children : children.filter((child) => child.id === selectedChildId),
    [children, selectedChildId]
  );

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredAssignments = useMemo(
    () =>
      assignments.filter((assignment) => {
        if (selectedChildId !== "all" && assignment.childId !== selectedChildId) return false;
        if (filterType !== "all" && assignment.type !== filterType) return false;
        const latest = assignment.results.map((r) => r.completedAt).sort().pop() || assignment.dueDate;
        if (dateFrom && latest < dateFrom) return false;
        if (dateTo && latest > dateTo) return false;
        return true;
      }),
    [assignments, dateFrom, dateTo, filterType, selectedChildId]
  );

  const allResults = useMemo(() => filteredAssignments.flatMap((assignment) => assignment.results), [filteredAssignments]);
  const needsReviewAssignments = useMemo(
    () =>
      filteredAssignments.filter((assignment) =>
        assignment.therapistApproval === "pending" ||
        assignment.results.some((result) => result.completedSuccessfully === false || (result.accuracy ?? result.score) < (result.masteryThreshold ?? 70))
      ),
    [filteredAssignments]
  );
  const avgScore = allResults.length > 0 ? Math.round(allResults.reduce((sum, result) => sum + result.score, 0) / allResults.length) : 0;
  const avgAttention = allResults.filter((result) => result.attentionSpan != null).length > 0
    ? Math.round(allResults.filter((result) => result.attentionSpan != null).reduce((sum, result) => sum + (result.attentionSpan || 0), 0) / allResults.filter((result) => result.attentionSpan != null).length)
    : null;
  const avgPrompts = allResults.filter((result) => result.promptsNeeded != null).length > 0
    ? (allResults.filter((result) => result.promptsNeeded != null).reduce((sum, result) => sum + (result.promptsNeeded || 0), 0) / allResults.filter((result) => result.promptsNeeded != null).length).toFixed(1)
    : null;
  const avgEmotionReg = allResults.filter((result) => result.emotionalRegulation != null).length > 0
    ? Math.round(allResults.filter((result) => result.emotionalRegulation != null).reduce((sum, result) => sum + (result.emotionalRegulation || 0), 0) / allResults.filter((result) => result.emotionalRegulation != null).length)
    : null;
  const avgComm = allResults.filter((result) => result.communicationAttempts != null).length > 0
    ? Math.round(allResults.filter((result) => result.communicationAttempts != null).reduce((sum, result) => sum + (result.communicationAttempts || 0), 0) / allResults.filter((result) => result.communicationAttempts != null).length)
    : null;
  const totalFrustration = allResults.reduce((sum, result) => sum + (result.frustrationEvents || 0), 0);
  const avgIndependence = allResults.filter((result) => result.independenceLevel != null).length > 0
    ? Math.round(allResults.filter((result) => result.independenceLevel != null).reduce((sum, result) => sum + (result.independenceLevel || 0), 0) / allResults.filter((result) => result.independenceLevel != null).length)
    : null;
  const totalPlayTime = Math.round(allResults.reduce((sum, result) => sum + result.durationSeconds, 0) / 60);

  const chartData = useMemo(
    () =>
      children.map((child) => {
        const childResults = filteredAssignments.filter((assignment) => assignment.childId === child.id).flatMap((assignment) => assignment.results);
        const childAvg = childResults.length > 0 ? Math.round(childResults.reduce((sum, result) => sum + result.score, 0) / childResults.length) : 0;
        return { name: child.name, avgScore: childAvg, totalGames: childResults.length };
      }),
    [children, filteredAssignments]
  );

  const radarData = useMemo(
    () => [
      { domain: "Task Score", value: avgScore },
      { domain: "Attention", value: avgAttention || 0 },
      { domain: "Emotion Reg.", value: avgEmotionReg ? avgEmotionReg * 10 : 0 },
      { domain: "Communication", value: avgComm ? avgComm * 5 : 0 },
      { domain: "Independence", value: avgIndependence ? avgIndependence * 10 : 0 },
      {
        domain: "Transition",
        value: allResults.filter((result) => result.transitionEase != null).length > 0
          ? Math.round(allResults.filter((result) => result.transitionEase != null).reduce((sum, result) => sum + (result.transitionEase || 0), 0) / allResults.filter((result) => result.transitionEase != null).length) * 10
          : 0,
      },
    ],
    [allResults, avgAttention, avgComm, avgEmotionReg, avgIndependence, avgScore]
  );

  const skillDomainData = useMemo(
    () =>
      (Object.keys(domainLabels) as SkillDomain[]).map((domain) => {
        const average = selectedChildren.length > 0
          ? Math.round(selectedChildren.reduce((sum, child) => sum + (child.skillProfile[domain] || 0), 0) / selectedChildren.length)
          : 0;
        return { domain: domainLabels[domain], value: average };
      }),
    [selectedChildren]
  );

  const goalProgressData = useMemo(
    () =>
      selectedChildren
        .flatMap((child) => child.therapyGoals.map((goal) => ({
          childId: child.id,
          childName: child.name,
          id: goal.id,
          title: goal.title,
          domain: goal.domain,
          status: goal.status,
          target: goal.targetLevel,
          current: child.skillProfile[goal.domain] || 0,
        })))
        .slice(0, 8),
    [selectedChildren]
  );

  const selectedChild = selectedChildId === "all" ? null : getChild(selectedChildId);
  const clinicalScaleSummary = useMemo(
    () =>
      selectedChildren.map((child) => {
        const history = child.personalizationProfile.clinicalRatingHistory;
        const baseline = history[0] || { ...child.personalizationProfile.clinicalRatings, recordedAt: new Date().toISOString() };
        const current = child.personalizationProfile.clinicalRatings;
        return {
          child,
          baseline,
          current,
          averageChange:
            Math.round(
              (
                Object.values(current).reduce((sum, value) => sum + value, 0) -
                Object.keys(current).reduce((sum, key) => sum + baseline[key as keyof ClinicalRatings], 0)
              ) / Object.keys(current).length
            ),
        };
      }),
    [selectedChildren]
  );

  const clinicalTrendData = useMemo(() => {
    if (!selectedChild) return [];
    return selectedChild.personalizationProfile.clinicalRatingHistory.map((entry, index) => ({
      visit: `V${index + 1}`,
      recordedAt: entry.recordedAt,
      communication: entry.communicationSupport,
      regulation: entry.regulationSupport,
      transitions: entry.transitionSupport,
      prompting: entry.promptDependence,
      reinforcement: entry.reinforcementResponse,
    }));
  }, [selectedChild]);
  const monthlyPlanReviews = useMemo(
    () =>
      filteredAssignments
        .filter((assignment) => assignment.monthlyPlan)
        .map((assignment) => ({
          assignment,
          child: getChild(assignment.childId),
          review: analyzeMonthlyPlanWeekOutcome(assignment),
        })),
    [filteredAssignments, getChild]
  );

  const handleGeneratePDF = async () => {
    setGenerating(true);
    try {
      const { generateReport } = await import("@/utils/reportGenerator");
      const childName = selectedChildId === "all" ? "All Children" : getChild(selectedChildId)?.name || "Child";
      generateReport({
        childName,
        filterType,
        assignments: filteredAssignments,
        children,
        allResults,
        metrics: { avgScore, avgAttention, avgPrompts, avgEmotionReg, avgComm, totalFrustration, avgIndependence, totalPlayTime },
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
    }
    setGenerating(false);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-foreground">Clinical Progress Report</h2>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-lg bg-muted p-1">
            <button onClick={() => setReviewMode("quick")} className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${reviewMode === "quick" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              Quick Review
            </button>
            <button onClick={() => setReviewMode("detailed")} className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${reviewMode === "detailed" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              Detailed Review
            </button>
          </div>
          <select value={selectedChildId} onChange={(event) => setSelectedChildId(event.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground">
            <option value="all">All Children</option>
            {children.map((child) => <option key={child.id} value={child.id}>{child.avatar} {child.name}</option>)}
          </select>
          <select value={filterType} onChange={(event) => setFilterType(event.target.value as typeof filterType)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground">
            <option value="all">All Types</option>
            <option value="homework">Homework</option>
            <option value="classwork">Classwork</option>
          </select>
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} aria-label="From date" className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground" />
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} aria-label="To date" className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground" />
          <button onClick={handleGeneratePDF} disabled={generating} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground touch-target disabled:opacity-50">
            {generating ? "Generating..." : "Export PDF"}
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-muted p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{avgScore}</p>
          <p className="text-xs text-muted-foreground">Avg Score</p>
        </div>
        <div className="rounded-xl bg-muted p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{totalPlayTime}m</p>
          <p className="text-xs text-muted-foreground">Play Time</p>
        </div>
        <div className="rounded-xl bg-muted p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{allResults.length}</p>
          <p className="text-xs text-muted-foreground">Games Completed</p>
        </div>
        <div className="rounded-xl bg-muted p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{goalProgressData.filter((goal) => goal.status === "achieved").length}/{goalProgressData.length}</p>
          <p className="text-xs text-muted-foreground">Goals Achieved</p>
        </div>
      </div>

      {reviewMode === "quick" ? (
        <>
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div className="rounded-xl bg-muted p-4">
              <h3 className="mb-3 font-display font-semibold text-foreground">Needs Attention</h3>
              <div className="space-y-3">
                {(needsReviewAssignments.length > 0 ? needsReviewAssignments : filteredAssignments).slice(0, 5).map((assignment) => {
                  const child = getChild(assignment.childId);
                  const review = assignment.monthlyPlan ? analyzeMonthlyPlanWeekOutcome(assignment) : null;
                  const reviewableResult = assignment.results.find((result) => result.completedSuccessfully === false || (result.accuracy ?? result.score) < (result.masteryThreshold ?? 70)) || assignment.results[0];
                  const reviewKey = reviewableResult ? `${assignment.id}-${reviewableResult.gameId}` : null;
                  return (
                    <div key={`quick-${assignment.id}`} className="rounded-xl border border-border bg-card p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{child?.name} · {assignment.type}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {assignment.therapistApproval} · {assignment.difficulty} · due {assignment.dueDate}
                          </p>
                          {review ? <p className="mt-1 text-xs text-foreground">{review.summary}</p> : null}
                        </div>
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-foreground">
                          {assignment.status}
                        </span>
                      </div>
                      {reviewableResult && reviewKey ? (
                        <div className="mt-3 rounded-xl bg-muted p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-foreground">
                              Review attempt: {getGameById(reviewableResult.gameId)?.name || reviewableResult.gameId}
                            </p>
                            <button onClick={() => setOpenReviewKey(openReviewKey === reviewKey ? null : reviewKey)} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                              {openReviewKey === reviewKey ? "Hide review" : "Open review"}
                            </button>
                          </div>
                          {openReviewKey === reviewKey ? <AttemptReview result={reviewableResult} /> : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl bg-muted p-4">
              <h3 className="mb-3 font-display font-semibold text-foreground">Quick Snapshot</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>{filteredAssignments.filter((assignment) => assignment.therapistApproval === "pending").length} assignments still need therapist review.</p>
                <p>{goalProgressData.filter((goal) => goal.status === "achieved").length} of {goalProgressData.length} visible goals are achieved.</p>
                <p>{skillDomainData.slice(0, 3).map((entry) => `${entry.domain} ${entry.value}%`).join(" · ")}</p>
                <p>{monthlyPlanReviews.filter(({ review }) => review?.recommendation === "step-back").length} monthly-plan weeks are signaling a step back.</p>
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-xl bg-muted p-4">
            <h3 className="mb-3 font-display font-semibold text-foreground">Quick Assignment Review</h3>
            <div className="space-y-3">
              {filteredAssignments.slice(0, 8).map((assignment) => {
                const child = getChild(assignment.childId);
                const progress = assignment.gameIds.length > 0 ? Math.round((assignment.completedGames.length / assignment.gameIds.length) * 100) : 0;

                return (
                  <div key={`quick-list-${assignment.id}`} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{child?.name} · {assignment.type}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {assignment.skillFocus.map((domain) => domain.replace("-", " ")).join(", ")} · {assignment.difficulty}
                        </p>
                      </div>
                      <span className="rounded-full bg-accent/20 px-2 py-1 text-xs font-semibold text-foreground">{progress}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : null}

      {reviewMode === "detailed" ? (
      <>
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-xl bg-muted p-4">
          <h3 className="mb-3 font-display font-semibold text-foreground">Approval Workflow</h3>
          <div className="space-y-3">
            {filteredAssignments.slice(0, 5).map((assignment) => (
              <div key={assignment.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{getChild(assignment.childId)?.name} · {assignment.type}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {assignment.therapistApproval} · {assignment.difficulty} · {assignment.skillFocus.map((domain) => domain.replace("-", " ")).join(", ")}
                    </p>
                  </div>
                  {assignment.therapistApproval === "pending" ? (
                    <div className="flex gap-2">
                      <button onClick={() => approveAssignment(assignment.id, "approved")} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Approve</button>
                      <button onClick={() => approveAssignment(assignment.id, "adjusted", assignment.difficulty === "hard" ? "medium" : "hard")} className="rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold text-foreground">Adjust</button>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-primary">{assignment.approvedBy || "therapist"}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-muted p-4">
          <h3 className="mb-3 font-display font-semibold text-foreground">Clinical Snapshot</h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>{filteredAssignments.filter((assignment) => assignment.therapistApproval === "pending").length} assignments still need therapist review before progression.</p>
            <p>{goalProgressData.filter((goal) => goal.status === "achieved").length} of {goalProgressData.length} visible goals are currently achieved.</p>
            <p>{skillDomainData.slice(0, 3).map((entry) => `${entry.domain} ${entry.value}%`).join(" · ")}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {avgAttention != null ? <MetricCard label="Attention" value={`${avgAttention}/10`} /> : null}
        {avgPrompts != null ? <MetricCard label="Prompts" value={avgPrompts} /> : null}
        {avgEmotionReg != null ? <MetricCard label="Emotion Reg." value={`${avgEmotionReg}/10`} /> : null}
        {avgComm != null ? <MetricCard label="Communication" value={`${avgComm}`} /> : null}
        <MetricCard label="Frustration" value={`${totalFrustration}`} />
        {avgIndependence != null ? <MetricCard label="Independence" value={`${avgIndependence}/10`} /> : null}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-muted p-4">
          <h3 className="mb-3 font-display font-semibold text-foreground">Scores by Child</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis domain={[0, 100]} fontSize={12} />
              <Tooltip />
              <Bar dataKey="avgScore" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Avg Score" />
              <Bar dataKey="totalGames" fill="hsl(var(--secondary))" radius={[6, 6, 0, 0]} name="Games Played" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-muted p-4">
          <h3 className="mb-3 font-display font-semibold text-foreground">Clinical Domain Profile</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="domain" fontSize={10} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} />
              <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-muted p-4">
          <h3 className="mb-3 font-display font-semibold text-foreground">Skill Domain Mastery</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={skillDomainData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" domain={[0, 100]} fontSize={12} />
              <YAxis type="category" dataKey="domain" width={110} fontSize={11} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-muted p-4">
          <h3 className="mb-3 font-display font-semibold text-foreground">Therapy Goal Progress</h3>
          <div className="space-y-3">
            {goalProgressData.map((goal) => (
              <div key={goal.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{goal.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{goal.childName} · {domainLabels[goal.domain]} · target {goal.target}%</p>
                  </div>
                  <div className="flex gap-2">
                    {goal.status !== "achieved" ? (
                      <button onClick={() => updateGoalStatus(goal.childId, goal.id, "achieved")} className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground">
                        Mark Achieved
                      </button>
                    ) : null}
                    {goal.status === "achieved" ? (
                      <button onClick={() => updateGoalStatus(goal.childId, goal.id, "active")} className="rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold text-foreground">
                        Reopen
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(goal.current, 100)}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Current score {goal.current}% · status {goal.status}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl bg-muted p-4">
        <h3 className="mb-3 font-display font-semibold text-foreground">Clinical Profile Summary</h3>
        <p className="mb-3 text-xs text-muted-foreground">Clinical scales use a 1 to 5 support-need scale. Lower scores indicate more independence and easier regulation.</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {clinicalScaleSummary.map(({ child, baseline, current, averageChange }) => (
            <div key={child.id} className="rounded-xl border border-border bg-card p-4">
              <p className="inline-flex items-center gap-2 font-semibold text-foreground">
                <PersonIcon label={child.name} avatar={child.avatar} size="sm" />
                {child.name}
              </p>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <p>Communication: {child.personalizationProfile.communicationLevel}</p>
                <p>Reinforcement: {child.personalizationProfile.reinforcementType.replace(/-/g, " ")}</p>
                <p>Prompt level: {child.personalizationProfile.promptLevel.replace(/-/g, " ")}</p>
                <p>Transition difficulty: {child.personalizationProfile.transitionDifficulty}</p>
              </div>
              <div className="mt-3 rounded-lg bg-muted p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Tracked clinical scales</p>
                <div className="mt-2 space-y-1 text-xs text-foreground">
                  {clinicalRatingLabels.map(({ key, label }) => {
                    const delta = current[key] - baseline[key];
                    const trend = delta < 0 ? "improving" : delta > 0 ? "needs support" : "steady";
                    const signedDelta = delta > 0 ? `+${delta}` : `${delta}`;
                    return (
                      <p key={`${child.id}-${key}`}>
                        {label}: {baseline[key]}/5 to {current[key]}/5 ({signedDelta}, {trend})
                      </p>
                    );
                  })}
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  {child.personalizationProfile.clinicalRatingHistory.length} data point{child.personalizationProfile.clinicalRatingHistory.length === 1 ? "" : "s"} recorded.
                  Avg change: {averageChange > 0 ? `+${averageChange}` : averageChange}/5
                </p>
              </div>
              <ProfileLine label="Triggers" values={child.personalizationProfile.triggerPatterns} />
              <ProfileLine label="Regulation" values={child.personalizationProfile.regulationSupports} />
            </div>
          ))}
        </div>
      </div>

      {selectedChild ? (
        <div className="mb-6 rounded-xl bg-muted p-4">
          <h3 className="mb-3 font-display font-semibold text-foreground">Clinical Scales Over Time</h3>
          <p className="mb-3 text-xs text-muted-foreground">{selectedChild.name}'s baseline and therapist updates across communication, regulation, transitions, prompting, and reinforcement support.</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={clinicalTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="visit" fontSize={12} />
              <YAxis domain={[1, 5]} allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="communication" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="regulation" stroke="#0f766e" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="transitions" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="prompting" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="reinforcement" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      {monthlyPlanReviews.length > 0 ? (
        <div className="mb-6 rounded-xl bg-muted p-4">
          <h3 className="mb-3 font-display font-semibold text-foreground">Monthly Plan Outcome Review</h3>
          <div className="space-y-3">
            {monthlyPlanReviews.map(({ assignment, child, review }) => (
              <div key={`review-${assignment.id}`} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {child?.name} - Week {assignment.monthlyPlan?.weekNumber}: {assignment.monthlyPlan?.objective}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Planned {assignment.monthlyPlan?.progressionDecision} with {assignment.monthlyPlan?.supportLevel} support.
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                    review?.recommendation === "advance"
                      ? "bg-secondary/20 text-foreground"
                      : review?.recommendation === "step-back"
                        ? "bg-destructive/10 text-destructive"
                        : review?.recommendation === "review"
                          ? "bg-primary/10 text-foreground"
                          : "bg-amber-100 text-amber-800"
                  }`}>
                    {review ? `Auto: ${review.recommendation}` : "Waiting for outcomes"}
                  </span>
                </div>

                {review ? (
                  <>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground md:grid-cols-5">
                      <p>Completion: {review.metrics.completionRate}%</p>
                      <p>Score: {review.metrics.averageScore}%</p>
                      <p>Prompts: {review.metrics.averagePrompts ?? "-"}</p>
                      <p>Regulation: {review.metrics.averageRegulation ?? "-"}/10</p>
                      <p>Frustration: {review.metrics.totalFrustration}</p>
                    </div>
                    <p className="mt-3 text-sm text-foreground">{review.summary}</p>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {review.reasons.map((reason) => (
                        <p key={`${assignment.id}-${reason}`}>- {reason}</p>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">Complete at least one game in this week to unlock an outcome-based recommendation.</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <h3 className="mb-3 font-display font-semibold text-foreground">Assignment Details</h3>
      <div className="space-y-3">
        {filteredAssignments.map((assignment) => {
          const child = getChild(assignment.childId);
          const progress = assignment.gameIds.length > 0 ? Math.round((assignment.completedGames.length / assignment.gameIds.length) * 100) : 0;

          return (
            <div key={assignment.id} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  {child ? <PersonIcon label={child.name} avatar={child.avatar} size="sm" /> : null}
                  <span className="font-display font-bold text-foreground">{child?.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${assignment.type === "classwork" ? "bg-accent/20 text-foreground" : "bg-primary/10 text-foreground"}`}>{assignment.type}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${assignment.status === "completed" ? "bg-secondary/20 text-foreground" : assignment.status === "in-progress" ? "bg-accent/20 text-foreground" : "bg-muted text-muted-foreground"}`}>{assignment.status}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${assignment.therapistApproval === "approved" ? "bg-secondary/20 text-foreground" : assignment.therapistApproval === "adjusted" ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground"}`}>{assignment.therapistApproval}</span>
                </div>
                <span className="text-xs text-muted-foreground">Due: {assignment.dueDate}</span>
              </div>

              <div className="mb-2 h-2 w-full rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>

              <div className="mb-2 flex flex-wrap gap-2">
                {assignment.gameIds.map((gameId) => {
                  const game = getGameById(gameId);
                  const done = assignment.completedGames.includes(gameId);

                  return (
                    <div key={gameId} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${done ? "bg-secondary/30 text-foreground" : "bg-muted text-muted-foreground"}`}>
                      <GameIcon game={game} size="sm" />
                      <span className={done ? "line-through" : ""}>{game?.name || gameId}</span>
                      <button onClick={() => removeGameFromAssignment(assignment.id, gameId)} className="rounded-full px-1 text-[10px] font-bold text-muted-foreground transition hover:bg-black/5 hover:text-foreground" title="Remove game from assignment">
                        X
                      </button>
                    </div>
                  );
                })}
              </div>

              {assignment.notes ? <p className="text-xs italic text-muted-foreground">{assignment.notes}</p> : null}
              <p className="mt-1 text-xs text-muted-foreground">Skill focus: {assignment.skillFocus.map((domain) => domain.replace("-", " ")).join(", ")}</p>

              {assignment.results.length > 0 ? (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-xs sm:grid-cols-6">
                    <MetricTile label="Avg Score" value={`${Math.round(assignment.results.reduce((sum, result) => sum + result.score, 0) / assignment.results.length)}`} />
                    <MetricTile label="Accuracy" value={`${Math.round(assignment.results.reduce((sum, result) => sum + (result.accuracy ?? result.score), 0) / assignment.results.length)}%`} />
                    <MetricTile label="Errors" value={`${assignment.results.reduce((sum, result) => sum + (result.errors || 0), 0)}`} />
                    <MetricTile label="Trials" value={`${assignment.results.reduce((sum, result) => sum + (result.trials || 0), 0)}`} />
                    <MetricTile label="Interactions" value={`${assignment.results.reduce((sum, result) => sum + result.interactions, 0)}`} />
                    <MetricTile label="Play Time" value={`${Math.round(assignment.results.reduce((sum, result) => sum + result.durationSeconds, 0) / 60)}m`} />
                  </div>
                  <InsightDashboard
                    childId={assignment.childId}
                    results={assignment.results.map((result) => ({
                      completedAt: result.completedAt,
                      score: result.score,
                      independenceRate: (result as ResultWithInsights).independenceRate,
                    }))}
                    traces={assignment.results
                      .map((result) => (result as ResultWithInsights).trace)
                      .filter((trace): trace is import("@/lib/gameAnalytics").SessionTrace => Boolean(trace))}
                  />
                  {assignment.results.length >= 2 ? (
                    <div className="mt-3 rounded-xl border border-border bg-card p-3">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Progress across sessions</p>
                      <ResponsiveContainer width="100%" height={140}>
                        <LineChart data={assignment.results.map((result) => ({
                          name: result.completedAt.slice(5),
                          Score: result.score,
                          Independence: result.independenceRate ?? null,
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                          <Line type="monotone" dataKey="Score" stroke="#4daace" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="Independence" connectNulls stroke="#66be84" strokeWidth={2} dot={{ r: 3 }} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : null}
                  {assignment.results.map((result) => {
                    const reviewKey = `${assignment.id}-${result.gameId}`;
                    const childOutcomes = assignments
                      .filter((a) => a.childId === assignment.childId)
                      .flatMap((a) => a.results)
                      .filter((r) => r.gameId === result.gameId)
                      .sort((left, right) => left.completedAt.localeCompare(right.completedAt))
                      .map((r) => r.completedSuccessfully !== false);
                    const mastery = masteryStatus(childOutcomes);
                    return (
                      <div key={reviewKey} className="rounded-xl border border-border bg-muted p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-foreground">{getGameById(result.gameId)?.name || result.gameId}</p>
                          <button onClick={() => setOpenReviewKey(openReviewKey === reviewKey ? null : reviewKey)} className="rounded-lg bg-card px-3 py-1.5 text-xs font-semibold text-foreground">
                            {openReviewKey === reviewKey ? "Hide what happened" : "See what happened"}
                          </button>
                        </div>
                        {openReviewKey === reviewKey ? <AttemptReview result={result} mastery={mastery} /> : null}
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          Score {result.score} · accuracy {result.accuracy ?? result.score}% · errors {result.errors ?? 0}
                          {result.independenceRate != null ? ` · independence ${result.independenceRate}%` : ""}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      </>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted p-2 text-center">
      <p className="font-bold text-foreground">{value}</p>
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
}

function AttemptReview({ result, mastery = "new" }: { result: {
  score: number;
  durationSeconds: number;
  interactions: number;
  completedSuccessfully?: boolean;
  trials?: number;
  correctTrials?: number;
  errors?: number;
  accuracy?: number;
  masteryThreshold?: number;
  promptsNeeded?: number;
  attemptsBySkill?: Record<string, number>;
  observations?: string[];
  trace?: import("@/lib/gameAnalytics").SessionTrace;
  insights?: import("@/lib/gameAnalytics").Insight[];
  independenceRate?: number;
  medianLatencyMs?: number;
}; mastery?: import("@/lib/science").MasteryStatus }) {
  const [tab, setTab] = useState<"overview" | "evidence" | "notes">("overview");
  const success = result.completedSuccessfully !== false;
  const outcomeLabel =
    mastery === "mastered"
      ? "Mastered ★"
      : mastery === "generalizing" && success
        ? "Goal met"
        : success
          ? "Passed"
          : "Retry";
  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "evidence" as const, label: "Replay & maps" },
    { key: "notes" as const, label: "Skill notes" },
  ];

  return (
    <div className="mt-3 rounded-xl border border-border bg-card p-3">
      <div className="mb-3 flex gap-1 rounded-full bg-muted p-1">
        {tabs.map((entry) => (
          <button
            key={entry.key}
            onClick={() => setTab(entry.key)}
            aria-pressed={tab === entry.key}
            className={`touch-target flex-1 rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
              tab === entry.key ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            <MetricTile label="Outcome" value={outcomeLabel} />
            <MetricTile label="Sessions toward mastery" value={`${mastery === "mastered" ? "3 of 3" : "building"}`} />
            <MetricTile label="Score" value={`${result.score}`} />
            <MetricTile label="Accuracy" value={`${result.accuracy ?? result.score}%`} />
            <MetricTile label="Errors" value={`${result.errors ?? 0}`} />
            <MetricTile label="Independence" value={`${result.independenceRate ?? result.accuracy ?? result.score}%`} />
            <MetricTile label="Prompts" value={`${result.promptsNeeded ?? 0}`} />
            {typeof result.medianLatencyMs === "number" && result.medianLatencyMs > 0 ? (
              <MetricTile label="Median speed" value={result.medianLatencyMs < 1000 ? `${result.medianLatencyMs}ms` : `${(result.medianLatencyMs / 1000).toFixed(1)}s`} />
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            Duration {Math.round(result.durationSeconds / 60)}m · interactions {result.interactions} · mastery target {result.masteryThreshold ?? 70}%
          </p>
          {result.insights && result.insights.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {result.insights.map((insight) => (
                <span
                  key={insight.label}
                  title={insight.detail}
                  className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
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
        </>
      ) : null}

      {tab === "evidence" ? (
        result.trace ? (
          <TraceInspector trace={result.trace} />
        ) : (
          <p className="py-3 text-sm text-muted-foreground">
            Trial-level replay wasn't recorded for this session. Newer sessions include full replay, maps, and speed charts automatically.
          </p>
        )
      ) : null}

      {tab === "notes" ? (
        <>
          <p className="text-xs text-muted-foreground">
            Duration {Math.round(result.durationSeconds / 60)}m · mastery target {result.masteryThreshold ?? 70}%
            {result.promptsNeeded != null ? ` · prompts used ${result.promptsNeeded}` : ""}
          </p>
          {result.attemptsBySkill ? (
            <div className="mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Skill evidence</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {Object.entries(result.attemptsBySkill).map(([skill, value]) => (
                  <span key={skill} className="rounded-full bg-muted px-2 py-1 text-[10px] text-foreground">{skill.replace(/-/g, " ")}: {value}</span>
                ))}
              </div>
            </div>
          ) : null}
          {result.observations && result.observations.length > 0 ? (
            <div className="mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Observed during play</p>
              <div className="mt-1 space-y-1 text-xs text-foreground">
                {result.observations.map((observation) => <p key={observation}>- {observation}</p>)}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function ProfileLine({ label, values }: { label: string; values: string[] }) {
  if (values.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-xs text-foreground">{values.join(", ")}</p>
    </div>
  );
}
