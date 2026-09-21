import { useEffect, useMemo, useState } from "react";
import { SkillDomain, useApp } from "@/context/AppContext";
import { allGames, categoryMeta, GameCategory, Difficulty } from "@/data/games";
import { motion, AnimatePresence } from "framer-motion";
import { buildMonthlyPlan, getPersonalizationSummary } from "@/lib/personalization";
import { getGameSkillDomains } from "@/lib/skills";
import { getTunables } from "@/lib/tunables";
import { buildSessionPlan } from "@/lib/sessionPlan";
import { GameIcon } from "@/components/icons/AppIcon";

const categories = Object.entries(categoryMeta) as [GameCategory, typeof categoryMeta[GameCategory]][];
type CatalogPathway = "recommended" | "goal-based" | "recent-success" | "needs-generalization" | "all";

const relationshipLabels: Record<string, string> = {
  parent: "Parent",
  sibling: "Sibling",
  grandparent: "Grandparent",
  "aunt-uncle": "Aunt/Uncle",
  other: "Other",
};

export default function AssignHomework() {
  const { children, assignments, createAssignment, approveAssignment } = useApp();
  const [childId, setChildId] = useState(children[0]?.id || "");
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [mode, setMode] = useState<"single" | "shared">("shared");
  const [planType, setPlanType] = useState<"single" | "monthly">("single");
  const [supportLevel, setSupportLevel] = useState<"high" | "moderate" | "light">("moderate");
  const [notes, setNotes] = useState("");
  const [assignedFamilyMemberId, setAssignedFamilyMemberId] = useState<string>("");
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toISOString().slice(0, 10);
  });
  const [filterCategory, setFilterCategory] = useState<GameCategory | "all">("all");
  const [catalogPathway, setCatalogPathway] = useState<CatalogPathway>("recommended");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tuning, setTuning] = useState<Record<string, Record<string, unknown>>>({});
  const [tunedGameId, setTunedGameId] = useState<string | null>(null);
  const sessionPlan = useMemo(() => {
    const child = children.find((entry) => entry.id === childId);
    if (!child) return null;
    return buildSessionPlan(child, assignments);
  }, [assignments, childId, children]);

  const selectedChild = children.find((child) => child.id === childId);
  const activeGoalDomains = useMemo<SkillDomain[]>(
    () => Array.from(new Set((selectedChild?.therapyGoals || []).filter((goal) => goal.status === "active").map((goal) => goal.domain))),
    [selectedChild]
  );
  const availableGames = useMemo(
    () => allGames.filter((game) => (mode === "shared" ? game.supportsShared : true)),
    [mode]
  );
  const personalization = useMemo(
    () => (selectedChild ? getPersonalizationSummary(selectedChild, assignments, availableGames) : null),
    [assignments, availableGames, selectedChild]
  );

  const personalizedOrder = useMemo(
    () => personalization?.recommendedGames.map((game) => game.id) || availableGames.map((game) => game.id),
    [availableGames, personalization]
  );

  const pathwayGames = useMemo(() => {
    const recommendedIds = new Set(personalization?.recommendedGames.slice(0, 18).map((game) => game.id) || []);
    const masteredIds = new Set(personalization?.masteredGameIds || []);
    const activeGoalDomainsSet = new Set(activeGoalDomains);
    const challengeCategories = new Set(personalization?.nextChallengeCategories || []);

    switch (catalogPathway) {
      case "recommended":
        return availableGames.filter((game) => recommendedIds.has(game.id));
      case "goal-based":
        return availableGames.filter((game) => getGameSkillDomains(game.id).some((domain) => activeGoalDomainsSet.has(domain)));
      case "recent-success":
        return availableGames.filter((game) => masteredIds.has(game.id));
      case "needs-generalization":
        return availableGames.filter((game) => challengeCategories.has(game.category) || !masteredIds.has(game.id));
      default:
        return availableGames;
    }
  }, [activeGoalDomains, availableGames, catalogPathway, personalization]);

  const filteredGames = useMemo(() => {
    const source = filterCategory === "all"
      ? pathwayGames
      : pathwayGames.filter((game) => game.category === filterCategory);

    return [...source].sort(
      (left, right) => personalizedOrder.indexOf(left.id) - personalizedOrder.indexOf(right.id)
    );
  }, [filterCategory, pathwayGames, personalizedOrder]);

  const categoryCounts = useMemo(
    () =>
      categories.reduce<Record<string, number>>((counts, [key]) => {
        counts[key] = pathwayGames.filter((game) => game.category === key).length;
        return counts;
      }, {}),
    [pathwayGames]
  );

  useEffect(() => {
    setSelectedGames((current) => current.filter((gameId) => availableGames.some((game) => game.id === gameId)));
  }, [availableGames]);

  useEffect(() => {
    if (personalization) {
      setDifficulty(personalization.recommendedDifficulty);
    }
  }, [personalization]);

  const selectedSkillFocus = useMemo<SkillDomain[]>(() => {
    const fromGames = Array.from(new Set(selectedGames.flatMap((gameId) => getGameSkillDomains(gameId))));
    if (fromGames.length > 0) return fromGames;
    if (activeGoalDomains.length > 0) return activeGoalDomains;
    return ["attention"];
  }, [activeGoalDomains, selectedGames]);

  const pendingApprovals = useMemo(
    () => assignments.filter((assignment) => assignment.childId === childId && assignment.type === "homework" && assignment.therapistApproval === "pending"),
    [assignments, childId]
  );
  const monthlyPlanPreview = useMemo(
    () => (
      selectedChild && personalization
        ? buildMonthlyPlan(selectedChild, assignments, selectedGames, personalization.recommendedGames, selectedSkillFocus, difficulty, mode)
        : []
    ),
    [assignments, difficulty, mode, personalization, selectedChild, selectedGames, selectedSkillFocus]
  );

  const toggleGame = (gameId: string) => {
    setSelectedGames((current) => (
      current.includes(gameId)
        ? current.filter((entry) => entry !== gameId)
        : [...current, gameId]
    ));
  };

  const applyPersonalizedPlan = () => {
    if (!personalization) return;

    const rotatedCategories = new Set(personalization.rotationCategories);
    const suggestedGames = personalization.recommendedGames
      .filter((game) =>
        game.difficulty === personalization.recommendedDifficulty ||
        rotatedCategories.has(game.category) ||
        personalization.preferredCategories.includes(game.category)
      )
      .slice(0, 5)
      .map((game) => game.id);

    setSelectedGames(suggestedGames);
    setDifficulty(personalization.recommendedDifficulty);
    setFilterCategory("all");
    setCatalogPathway("recommended");
    if (!notes.trim()) {
      setNotes(`Progressive plan focused on ${personalization.progressionStage} stage goals.`);
    }
  };

  const handleAssign = () => {
    if (!childId || selectedGames.length === 0 || !personalization) return;

    const createHomework = (
      assignmentDueDate: string,
      weekNumber?: number,
      weekDifficulty: Difficulty = difficulty,
      weekGames: string[] = selectedGames,
      monthlyPlanWeek?: NonNullable<ReturnType<typeof buildMonthlyPlan>[number]>
    ) => {
      const stageLabel = weekNumber ? `Week ${weekNumber} - ${weekDifficulty}` : `Stage - ${weekDifficulty}`;
      const assignmentNotes = monthlyPlanWeek
        ? [
            `${stageLabel}`,
            monthlyPlanWeek.objective,
            `Support level: ${monthlyPlanWeek.supportLevel}`,
            `Decision: ${monthlyPlanWeek.progressionDecision}`,
            notes,
          ].filter(Boolean).join(" - ")
        : [stageLabel, notes].filter(Boolean).join(" - ");

      createAssignment({
        childId,
        type: "homework",
        gameIds: weekGames,
        difficulty: weekDifficulty,
        mode,
        notes: assignmentNotes,
        dueDate: assignmentDueDate,
        assignedFamilyMemberId: assignedFamilyMemberId || undefined,
        skillFocus: Array.from(new Set([...selectedSkillFocus, ...weekGames.flatMap((gameId) => getGameSkillDomains(gameId))])),
        supportLevel,
        systemSuggestedDifficulty: personalization.recommendedDifficulty,
        tuning: Object.keys(tuning).length > 0 ? tuning : undefined,
        monthlyPlan: monthlyPlanWeek ? {
          weekNumber: monthlyPlanWeek.weekNumber,
          objective: monthlyPlanWeek.objective,
          rationale: monthlyPlanWeek.rationale,
          progressionDecision: monthlyPlanWeek.progressionDecision,
          supportLevel: monthlyPlanWeek.supportLevel,
          sessionLengthMinutes: monthlyPlanWeek.sessionLengthMinutes,
          adultSupport: monthlyPlanWeek.adultSupport,
          familyGuidance: monthlyPlanWeek.familyGuidance,
          successMarkers: monthlyPlanWeek.successMarkers,
        } : undefined,
      });
    };

    if (planType === "monthly") {
      const baseDate = new Date(`${dueDate}T00:00:00`);
      monthlyPlanPreview.forEach((weekPlan, index) => {
        const nextDate = new Date(baseDate);
        nextDate.setDate(baseDate.getDate() + index * 7);
        createHomework(nextDate.toISOString().slice(0, 10), index + 1, weekPlan.difficulty, weekPlan.gameIds, weekPlan);
      });
    } else {
      createHomework(dueDate, undefined, difficulty, selectedGames);
    }

    setSelectedGames([]);
    setNotes("");
    setTuning({});
    setTunedGameId(null);
    setSuccess(true);
    window.setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-display text-lg font-bold text-foreground">Assign Homework</h2>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
          {showAdvanced ? "Advanced" : "Quick assign"}
        </span>
        <button
          onClick={() => setShowAdvanced((current) => !current)}
          className="touch-target rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground"
        >
          {showAdvanced ? "Hide extras" : "Show more"}
        </button>
      </div>
    </div>

    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Child</span>
        <select value={childId} onChange={(event) => { setChildId(event.target.value); setAssignedFamilyMemberId(""); }} className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground">
          {children.map((child) => (
            <option key={child.id} value={child.id}>{child.name}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{planType === "monthly" ? "Start Date" : "Due Date"}</span>
        <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground" />
      </label>

      <div>
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Difficulty</span>
        <div className="flex gap-1.5">
          {(["easy", "medium", "hard"] as Difficulty[]).map((entry) => (
            <button key={entry} onClick={() => setDifficulty(entry)} className={`touch-target flex-1 rounded-xl px-2 py-2.5 text-xs font-semibold capitalize transition-colors ${difficulty === entry ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {entry}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Plan</span>
        <div className="flex gap-1.5">
          <button onClick={() => setPlanType("single")} className={`touch-target flex-1 rounded-xl px-2 py-2.5 text-xs font-semibold transition-colors ${planType === "single" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            One Time
          </button>
          <button onClick={() => setPlanType("monthly")} className={`touch-target flex-1 rounded-xl px-2 py-2.5 text-xs font-semibold transition-colors ${planType === "monthly" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            Monthly Plan
          </button>
        </div>
      </div>
    </div>

    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        {personalization ? (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="font-display text-base font-bold capitalize text-foreground">
              {personalization.progressionStage} stage · target {personalization.recommendedDifficulty}
            </p>
            <p className="mt-1 text-xs font-semibold text-foreground">
              Readiness: {personalization.readiness.stage} - support {personalization.readiness.supportNeed}
            </p>

            {sessionPlan ? (
              <div className="mt-3 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Suggested session plan</p>
                {sessionPlan.sections.map((section) => (
                  <div key={section.bucket} className="rounded-xl bg-white/65 p-3">
                    <p className="text-xs font-bold text-foreground">
                      {section.label}
                      <span className="ml-2 font-normal text-muted-foreground">{section.reason}</span>
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {section.games.map((game) => (
                        <button
                          key={game.id}
                          onClick={() => {
                            setSelectedGames((currentSelected) => currentSelected.includes(game.id) ? currentSelected : [...currentSelected, game.id]);
                          }}
                          disabled={selectedGames.includes(game.id)}
                          className={`touch-target inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                            selectedGames.includes(game.id)
                              ? "bg-secondary/25 text-foreground"
                              : "bg-muted text-foreground hover:bg-secondary/20"
                          }`}
                        >
                          <GameIcon game={game} size="sm" />
                          {game.name}
                          {selectedGames.includes(game.id) ? " ✓" : " +"}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {personalization.recommendationReasons.length > 0 ? (
              <details className="mt-3 rounded-xl bg-white/65 p-3">
                <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Why this was recommended</summary>
                <div className="mt-2 space-y-1 text-xs text-foreground">
                  {personalization.recommendationReasons.slice(0, 3).map((reason) => (
                    <p key={reason}>· {reason}</p>
                  ))}
                </div>
              </details>
            ) : null}

            <button onClick={applyPersonalizedPlan} className="mt-3 touch-target rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
              Use Personalized Plan
            </button>
          </div>
        ) : null}

        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <select
              value={catalogPathway}
              onChange={(event) => setCatalogPathway(event.target.value as CatalogPathway)}
              aria-label="Catalog pathway"
              className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground"
            >
              {([
                ["recommended", "Recommended"],
                ["goal-based", "Goal-Based"],
                ["recent-success", "Recent Success"],
                ["needs-generalization", "Needs Generalization"],
                ["all", "All Games"],
              ] as Array<[CatalogPathway, string]>).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={(event) => setFilterCategory(event.target.value as GameCategory | "all")}
              aria-label="Filter by category"
              className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold capitalize text-foreground"
            >
              <option value="all">{mode === "shared" ? "Shared Games" : "All Categories"}</option>
              {categories.map(([key, meta]) => (
                <option key={key} value={key}>{meta.label} ({categoryCounts[key] || 0})</option>
              ))}
            </select>
          </div>

          {filteredGames.length > 0 ? (
            <div className="grid max-h-[560px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 xl:grid-cols-4">
              {filteredGames.map((game) => {
                const isRecommended = personalization?.recommendedGames.slice(0, 6).some((entry) => entry.id === game.id);
                return (
                  <button
                    key={game.id}
                    onClick={() => toggleGame(game.id)}
                    className={`touch-target rounded-2xl border-2 p-3 text-left transition-all ${
                      selectedGames.includes(game.id)
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <GameIcon game={game} size="md" />
                      {isRecommended ? <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">★</span> : null}
                    </div>
                    <p className="text-xs font-bold leading-tight text-foreground">{game.name}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{game.estimatedMinutes} min · {game.difficulty}</p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-6 text-center">
              <p className="text-sm font-semibold text-foreground">Nothing here in {mode === "shared" ? "With Family" : "Solo"} mode</p>
              <p className="mt-1 text-xs text-muted-foreground">This category exists, but its games need the other mode.</p>
              <button
                onClick={() => setMode(mode === "shared" ? "single" : "shared")}
                className="touch-target mt-3 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Switch to {mode === "shared" ? "Solo" : "With Family"}
              </button>
            </div>
          )}

          {planType === "monthly" && monthlyPlanPreview.length > 0 ? (
            <div className="mt-4 rounded-2xl border border-border bg-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Monthly Program Preview</p>
              <div className="mt-3 space-y-2">
                {monthlyPlanPreview.map((week) => (
                  <div key={`week-${week.weekNumber}`} className="flex items-start justify-between gap-3 rounded-xl bg-muted p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">W{week.weekNumber} · {week.objective}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{week.adultSupport} · {week.sessionLengthMinutes} min</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-foreground">{week.difficulty}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20">
        {pendingApprovals.length > 0 ? (
          <div className="rounded-2xl border border-amber-300/50 bg-amber-50/80 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700">Approvals ({pendingApprovals.length})</p>
            <div className="mt-2 space-y-2">
              {pendingApprovals.slice(0, 3).map((assignment) => (
                <div key={assignment.id} className="rounded-xl bg-white/85 p-3 text-xs text-foreground">
                  <p className="font-semibold">{assignment.gameIds.length} games · due {assignment.dueDate}</p>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => approveAssignment(assignment.id, "approved")} className="rounded-lg bg-primary px-3 py-1.5 font-semibold text-primary-foreground">
                      Approve
                    </button>
                    <button onClick={() => approveAssignment(assignment.id, "adjusted", difficulty)} className="rounded-lg bg-muted px-3 py-1.5 font-semibold text-foreground">
                      + {difficulty}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-2 text-sm font-bold text-foreground">Session ({selectedGames.length})</p>
          {selectedGames.length === 0 ? (
            <p className="text-xs text-muted-foreground">Pick games from the plan or catalog.</p>
          ) : null}
          <div className="flex flex-wrap gap-1.5">
            {selectedGames.map((gameId) => {
              const game = availableGames.find((entry) => entry.id === gameId) || allGames.find((entry) => entry.id === gameId);
              if (!game) return null;
              const tuned = tuning[gameId];
              const tunable = getTunables(game.engine);
              return (
                <button
                  key={gameId}
                  onClick={() => setTunedGameId(tunedGameId === gameId ? null : gameId)}
                  className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs transition-colors ${
                    tunedGameId === gameId
                      ? "bg-primary text-primary-foreground"
                      : tuned
                        ? "bg-secondary/20 text-foreground ring-1 ring-secondary/50"
                        : "bg-primary/10 text-foreground"
                  }`}
                >
                  <GameIcon game={game} size="sm" />
                  {game.name}
                  {tuned ? <span aria-hidden="true">⚙️</span> : tunable ? <span aria-hidden="true" className="opacity-50">⚙︎</span> : null}
                </button>
              );
            })}
          </div>

          {(() => {
            if (!tunedGameId) return null;
            const game = availableGames.find((entry) => entry.id === tunedGameId) || allGames.find((entry) => entry.id === tunedGameId);
            if (!game) return null;
            const tunable = getTunables(game.engine);
            if (!tunable) {
              return (
                <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                  {game.name} adapts automatically for this child.
                </p>
              );
            }
            const current = tuning[tunedGameId] || {};
            return (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-xl border border-border bg-background p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-foreground">Tailor: {game.name}</p>
                  {tuning[tunedGameId] ? (
                    <button
                      onClick={() => {
                        setTuning((currentTuning) => {
                          const next = { ...currentTuning };
                          delete next[tunedGameId];
                          return next;
                        });
                      }}
                      className="text-[11px] font-semibold text-muted-foreground underline hover:text-foreground"
                    >
                      Reset
                    </button>
                  ) : null}
                </div>
                <div className="mt-3 space-y-3">
                  {tunable.fields.map((field) => {
                    const value = current[field.key];
                    if (field.type === "slider") {
                      return (
                        <label key={field.key} className="block">
                          <span className="flex items-center justify-between text-xs font-semibold text-foreground">
                            {field.label}
                            <span className="font-black text-primary">{String(value ?? field.min ?? 0)}</span>
                          </span>
                          <input
                            type="range"
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={Number(value ?? field.min ?? 0)}
                            onChange={(event) => setTuning((prev) => ({
                              ...prev,
                              [tunedGameId]: { ...prev[tunedGameId], [field.key]: Number(event.target.value) },
                            }))}
                            className="mt-1 w-full accent-primary"
                          />
                        </label>
                      );
                    }
                    return (
                      <label key={field.key} className="block">
                        <span className="text-xs font-semibold text-foreground">{field.label}</span>
                        <select
                          value={String(value ?? "")}
                          onChange={(event) => setTuning((prev) => {
                            const nextValue = event.target.value;
                            const nextGame = { ...prev[tunedGameId] };
                            if (nextValue === "") delete nextGame[field.key];
                            else nextGame[field.key] = nextValue;
                            return { ...prev, [tunedGameId]: nextGame };
                          })}
                          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                        >
                          {(field.options || []).map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </label>
                    );
                  })}
                </div>
              </motion.div>
            );
          })()}

          {showAdvanced ? (
            <div className="mt-4 space-y-3 border-t border-border pt-3">
              {selectedChild && selectedChild.familyMembers.length > 0 ? (
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Family member</span>
                  <select value={assignedFamilyMemberId} onChange={(event) => setAssignedFamilyMemberId(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                    <option value="">Anyone in family</option>
                    {selectedChild.familyMembers.map((familyMember) => (
                      <option key={familyMember.id} value={familyMember.id}>
                        {familyMember.name} ({relationshipLabels[familyMember.relationship] || familyMember.relationship})
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <div>
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Support</span>
                <div className="flex gap-1.5">
                  {(["high", "moderate", "light"] as const).map((entry) => (
                    <button key={entry} onClick={() => setSupportLevel(entry)} className={`touch-target flex-1 rounded-lg px-2 py-2 text-xs font-semibold capitalize transition-colors ${supportLevel === entry ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {entry}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Mode</span>
                <div className="flex gap-1.5">
                  <button onClick={() => setMode("single")} className={`touch-target flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition-colors ${mode === "single" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    Solo
                  </button>
                  <button onClick={() => setMode("shared")} className={`touch-target flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition-colors ${mode === "shared" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    With Family
                  </button>
                </div>
              </div>

              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Notes for family</span>
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" placeholder="Tips, focus areas..." />
              </label>
            </div>
          ) : null}

          <button onClick={handleAssign} disabled={selectedGames.length === 0 || !childId} className="touch-target mt-4 w-full rounded-xl bg-primary py-3 text-base font-bold text-primary-foreground disabled:opacity-50">
            {planType === "monthly" ? `Create Progressive Monthly Plan (${selectedGames.length} games)` : `Assign Homework (${selectedGames.length} games)`}
          </button>

          <AnimatePresence>
            {success ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-lg bg-secondary/20 py-2 text-center text-sm font-semibold text-foreground">
                {planType === "monthly" ? "Progressive monthly homework plan created!" : "Homework assigned!"}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </aside>
    </div>
  </div>
  );
}
