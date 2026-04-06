import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { getGameById } from "@/data/games";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

export default function HomeworkReview() {
  const { assignments, children, removeGameFromAssignment } = useApp();
  const [selectedChildId, setSelectedChildId] = useState<string>("all");
  const [filterType, setFilterType] = useState<"all" | "homework" | "classwork">("all");
  const [generating, setGenerating] = useState(false);

  const getChild = (id: string) => children.find((c) => c.id === id);

  const filteredAssignments = useMemo(
    () =>
      assignments.filter((a) => {
        if (selectedChildId !== "all" && a.childId !== selectedChildId) return false;
        if (filterType !== "all" && a.type !== filterType) return false;
        return true;
      }),
    [assignments, filterType, selectedChildId]
  );

  const allResults = useMemo(() => filteredAssignments.flatMap((a) => a.results), [filteredAssignments]);

  // Clinical metrics
  const avgScore = allResults.length > 0 ? Math.round(allResults.reduce((s, r) => s + r.score, 0) / allResults.length) : 0;
  const avgAttention = allResults.filter((r) => r.attentionSpan != null).length > 0
    ? Math.round(allResults.filter((r) => r.attentionSpan != null).reduce((s, r) => s + (r.attentionSpan || 0), 0) / allResults.filter((r) => r.attentionSpan != null).length)
    : null;
  const avgPrompts = allResults.filter((r) => r.promptsNeeded != null).length > 0
    ? (allResults.filter((r) => r.promptsNeeded != null).reduce((s, r) => s + (r.promptsNeeded || 0), 0) / allResults.filter((r) => r.promptsNeeded != null).length).toFixed(1)
    : null;
  const avgEmotionReg = allResults.filter((r) => r.emotionalRegulation != null).length > 0
    ? Math.round(allResults.filter((r) => r.emotionalRegulation != null).reduce((s, r) => s + (r.emotionalRegulation || 0), 0) / allResults.filter((r) => r.emotionalRegulation != null).length)
    : null;
  const avgComm = allResults.filter((r) => r.communicationAttempts != null).length > 0
    ? Math.round(allResults.filter((r) => r.communicationAttempts != null).reduce((s, r) => s + (r.communicationAttempts || 0), 0) / allResults.filter((r) => r.communicationAttempts != null).length)
    : null;
  const totalFrustration = allResults.reduce((s, r) => s + (r.frustrationEvents || 0), 0);
  const avgIndependence = allResults.filter((r) => r.independenceLevel != null).length > 0
    ? Math.round(allResults.filter((r) => r.independenceLevel != null).reduce((s, r) => s + (r.independenceLevel || 0), 0) / allResults.filter((r) => r.independenceLevel != null).length)
    : null;
  const totalPlayTime = Math.round(allResults.reduce((s, r) => s + r.durationSeconds, 0) / 60);

  // Chart data
  const chartData = useMemo(
    () =>
      children.map((c) => {
        const childResults = filteredAssignments.filter((a) => a.childId === c.id).flatMap((a) => a.results);
        const avg = childResults.length > 0 ? Math.round(childResults.reduce((s, r) => s + r.score, 0) / childResults.length) : 0;
        const total = childResults.length;
        return { name: c.name, avgScore: avg, totalGames: total };
      }),
    [children, filteredAssignments]
  );

  // Radar data for clinical domains
  const radarData = useMemo(
    () => [
      { domain: "Task Score", value: avgScore },
      { domain: "Attention", value: avgAttention || 0 },
      { domain: "Emotion Reg.", value: avgEmotionReg ? avgEmotionReg * 10 : 0 },
      { domain: "Communication", value: avgComm ? avgComm * 5 : 0 },
      { domain: "Independence", value: avgIndependence ? avgIndependence * 10 : 0 },
      { domain: "Transition", value: allResults.filter((r) => r.transitionEase != null).length > 0 ? Math.round(allResults.filter((r) => r.transitionEase != null).reduce((s, r) => s + (r.transitionEase || 0), 0) / allResults.filter((r) => r.transitionEase != null).length) * 10 : 0 },
    ],
    [allResults, avgAttention, avgComm, avgEmotionReg, avgIndependence, avgScore]
  );

  // Generate PDF report
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
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
    setGenerating(false);
  };

  const handleFilterTypeChange = (value: string) => {
    if (value === "all" || value === "homework" || value === "classwork") {
      setFilterType(value);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="font-display text-lg font-bold text-foreground">📊 Clinical Progress Report</h2>
        <div className="flex gap-2 flex-wrap">
          <select value={selectedChildId} onChange={(e) => setSelectedChildId(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground">
            <option value="all">All Children</option>
            {children.map((c) => <option key={c.id} value={c.id}>{c.avatar} {c.name}</option>)}
          </select>
          <select value={filterType} onChange={(e) => handleFilterTypeChange(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground">
            <option value="all">All Types</option>
            <option value="homework">📝 Homework</option>
            <option value="classwork">🏥 Classwork</option>
          </select>
          <button onClick={handleGeneratePDF} disabled={generating} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold touch-target disabled:opacity-50">
            {generating ? "⏳ Generating..." : "📄 Export PDF"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-muted rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{avgScore}</p>
          <p className="text-xs text-muted-foreground">Avg Score</p>
        </div>
        <div className="bg-muted rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{totalPlayTime}m</p>
          <p className="text-xs text-muted-foreground">Total Play Time</p>
        </div>
        <div className="bg-muted rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{allResults.length}</p>
          <p className="text-xs text-muted-foreground">Games Completed</p>
        </div>
        <div className="bg-muted rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{filteredAssignments.length}</p>
          <p className="text-xs text-muted-foreground">Assignments</p>
        </div>
      </div>

      {/* Clinical Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {avgAttention != null && (
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-foreground">{avgAttention}/10</p>
            <p className="text-[10px] text-muted-foreground">Attention Span</p>
          </div>
        )}
        {avgPrompts != null && (
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-foreground">{avgPrompts}</p>
            <p className="text-[10px] text-muted-foreground">Avg Prompts Needed</p>
          </div>
        )}
        {avgEmotionReg != null && (
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-foreground">{avgEmotionReg}/10</p>
            <p className="text-[10px] text-muted-foreground">Emotional Regulation</p>
          </div>
        )}
        {avgComm != null && (
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-foreground">{avgComm}</p>
            <p className="text-[10px] text-muted-foreground">Communication Attempts</p>
          </div>
        )}
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-foreground">{totalFrustration}</p>
          <p className="text-[10px] text-muted-foreground">Frustration Events</p>
        </div>
        {avgIndependence != null && (
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-foreground">{avgIndependence}/10</p>
            <p className="text-[10px] text-muted-foreground">Independence Level</p>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-muted rounded-xl p-4">
          <h3 className="font-display font-semibold text-foreground mb-3">Scores by Child</h3>
          <ResponsiveContainer width="100%" height={200}>
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

        <div className="bg-muted rounded-xl p-4">
          <h3 className="font-display font-semibold text-foreground mb-3">Clinical Domain Profile</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="domain" fontSize={10} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} />
              <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Assignment list */}
      <h3 className="font-display font-semibold text-foreground mb-3">Assignment Details</h3>
      <div className="space-y-3">
        {filteredAssignments.map((a) => {
          const child = getChild(a.childId);
          const progress = a.gameIds.length > 0 ? Math.round((a.completedGames.length / a.gameIds.length) * 100) : 0;

          return (
            <div key={a.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{child?.avatar}</span>
                  <span className="font-display font-bold text-foreground">{child?.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    a.type === "classwork" ? "bg-accent/20 text-foreground" : "bg-primary/10 text-foreground"
                  }`}>
                    {a.type === "classwork" ? "🏥 Classwork" : "📝 Homework"}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    a.status === "completed" ? "bg-secondary/20 text-foreground" : a.status === "in-progress" ? "bg-accent/20 text-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {a.status}
                  </span>
                  {a.mode === "multiplayer" && <span className="text-xs bg-primary/10 text-foreground px-2 py-0.5 rounded-full font-semibold">👥 Multiplayer</span>}
                </div>
                <span className="text-xs text-muted-foreground">Due: {a.dueDate}</span>
              </div>

              <div className="w-full bg-muted rounded-full h-2 mb-2">
                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>

              <div className="flex gap-2 flex-wrap mb-2">
                {a.gameIds.map((gid) => {
                  const game = getGameById(gid);
                  const done = a.completedGames.includes(gid);
                  return (
                    <div key={gid} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${done ? "bg-secondary/30 text-foreground" : "bg-muted text-muted-foreground"}`}>
                      <span className={done ? "line-through" : ""}>
                        {game?.emoji} {game?.name || gid}
                      </span>
                      <button
                        onClick={() => removeGameFromAssignment(a.id, gid)}
                        className="rounded-full px-1 text-[10px] font-bold text-muted-foreground transition hover:bg-black/5 hover:text-foreground"
                        title="Remove game from assignment"
                      >
                        X
                      </button>
                    </div>
                  );
                })}
              </div>

              {a.notes && <p className="text-xs text-muted-foreground italic">📝 {a.notes}</p>}

              {a.results.length > 0 && (
                <div className="mt-2 grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
                  <div className="bg-muted rounded-lg p-2 text-center">
                    <p className="font-bold text-foreground">{Math.round(a.results.reduce((s, r) => s + r.score, 0) / a.results.length)}</p>
                    <p className="text-muted-foreground">Avg Score</p>
                  </div>
                  <div className="bg-muted rounded-lg p-2 text-center">
                    <p className="font-bold text-foreground">{a.results.reduce((s, r) => s + r.interactions, 0)}</p>
                    <p className="text-muted-foreground">Interactions</p>
                  </div>
                  <div className="bg-muted rounded-lg p-2 text-center">
                    <p className="font-bold text-foreground">{Math.round(a.results.reduce((s, r) => s + r.durationSeconds, 0) / 60)}m</p>
                    <p className="text-muted-foreground">Play Time</p>
                  </div>
                  {a.results.some((r) => r.attentionSpan != null) && (
                    <div className="bg-muted rounded-lg p-2 text-center">
                      <p className="font-bold text-foreground">{Math.round(a.results.filter((r) => r.attentionSpan != null).reduce((s, r) => s + (r.attentionSpan || 0), 0) / a.results.filter((r) => r.attentionSpan != null).length)}/10</p>
                      <p className="text-muted-foreground">Attention</p>
                    </div>
                  )}
                  {a.results.some((r) => r.emotionalRegulation != null) && (
                    <div className="bg-muted rounded-lg p-2 text-center">
                      <p className="font-bold text-foreground">{Math.round(a.results.filter((r) => r.emotionalRegulation != null).reduce((s, r) => s + (r.emotionalRegulation || 0), 0) / a.results.filter((r) => r.emotionalRegulation != null).length)}/10</p>
                      <p className="text-muted-foreground">Emot. Reg.</p>
                    </div>
                  )}
                  {a.results.some((r) => r.promptsNeeded != null) && (
                    <div className="bg-muted rounded-lg p-2 text-center">
                      <p className="font-bold text-foreground">{(a.results.filter((r) => r.promptsNeeded != null).reduce((s, r) => s + (r.promptsNeeded || 0), 0) / a.results.filter((r) => r.promptsNeeded != null).length).toFixed(1)}</p>
                      <p className="text-muted-foreground">Prompts</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
