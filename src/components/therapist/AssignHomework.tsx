import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { allGames, categoryMeta, GameCategory, Difficulty } from "@/data/games";
import { motion, AnimatePresence } from "framer-motion";

const categories = Object.entries(categoryMeta) as [GameCategory, typeof categoryMeta[GameCategory]][];

const relationshipLabels: Record<string, string> = {
  parent: "Parent",
  sibling: "Sibling",
  grandparent: "Grandparent",
  "aunt-uncle": "Aunt/Uncle",
  other: "Other",
};

export default function AssignHomework() {
  const { children, createAssignment } = useApp();
  const [childId, setChildId] = useState(children[0]?.id || "");
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [mode, setMode] = useState<"single" | "shared">("shared");
  const [planType, setPlanType] = useState<"single" | "monthly">("single");
  const [notes, setNotes] = useState("");
  const [assignedFamilyMemberId, setAssignedFamilyMemberId] = useState<string>("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [filterCategory, setFilterCategory] = useState<GameCategory | "all">("all");
  const [success, setSuccess] = useState(false);

  const selectedChild = children.find((c) => c.id === childId);
  const availableGames = useMemo(
    () => allGames.filter((g) => (mode === "shared" ? g.supportsShared : true)),
    [mode]
  );
  const filteredGames = filterCategory === "all" ? availableGames : availableGames.filter((g) => g.category === filterCategory);
  const categoryCounts = useMemo(
    () =>
      categories.reduce<Record<string, number>>((counts, [key]) => {
        counts[key] = availableGames.filter((game) => game.category === key).length;
        return counts;
      }, {}),
    [availableGames]
  );
  const selectedCategoryMeta = filterCategory === "all" ? null : categoryMeta[filterCategory];

  useEffect(() => {
    setSelectedGames((prev) => prev.filter((id) => availableGames.some((g) => g.id === id)));
  }, [availableGames]);

  const toggleGame = (id: string) => {
    setSelectedGames((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  };

  const handleAssign = () => {
    if (!childId || selectedGames.length === 0) return;

    const createHomework = (assignmentDueDate: string, weekNumber?: number) => {
      const weekLabel = weekNumber ? `Week ${weekNumber}` : null;
      const assignmentNotes = [weekLabel, notes].filter(Boolean).join(" - ");

      createAssignment({
        childId,
        type: "homework",
        gameIds: selectedGames,
        difficulty,
        mode,
        notes: assignmentNotes,
        dueDate: assignmentDueDate,
        assignedFamilyMemberId: assignedFamilyMemberId || undefined,
      });
    };

    if (planType === "monthly") {
      const baseDate = new Date(`${dueDate}T00:00:00`);
      Array.from({ length: 4 }, (_, index) => {
        const nextDate = new Date(baseDate);
        nextDate.setDate(baseDate.getDate() + index * 7);
        return nextDate.toISOString().slice(0, 10);
      }).forEach((assignmentDueDate, index) => createHomework(assignmentDueDate, index + 1));
    } else {
      createHomework(dueDate);
    }

    setSelectedGames([]);
    setNotes("");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div>
      <h2 className="font-display text-lg font-bold text-foreground mb-6">Assign Homework</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-foreground block mb-1">Child</label>
            <select value={childId} onChange={(e) => { setChildId(e.target.value); setAssignedFamilyMemberId(""); }} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground">
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.avatar} {c.name}
                </option>
              ))}
            </select>
          </div>

          {selectedChild && selectedChild.familyMembers.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1">Assign to Family Member</label>
              <select value={assignedFamilyMemberId} onChange={(e) => setAssignedFamilyMemberId(e.target.value)} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground">
                <option value="">Anyone in family</option>
                {selectedChild.familyMembers.map((fm) => (
                  <option key={fm.id} value={fm.id}>
                    {fm.avatar} {fm.name} ({relationshipLabels[fm.relationship] || fm.relationship})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-foreground block mb-1">Plan Length</label>
            <div className="flex gap-2">
              <button onClick={() => setPlanType("single")} className={`px-4 py-2 rounded-lg text-sm font-semibold touch-target transition-colors ${planType === "single" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                One Time
              </button>
              <button onClick={() => setPlanType("monthly")} className={`px-4 py-2 rounded-lg text-sm font-semibold touch-target transition-colors ${planType === "monthly" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                Monthly Plan
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground block mb-1">Difficulty</label>
            <div className="flex gap-2">
              {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                <button key={d} onClick={() => setDifficulty(d)} className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize touch-target transition-colors ${difficulty === d ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground block mb-1">Mode</label>
            <div className="flex gap-2">
              <button onClick={() => setMode("single")} className={`px-4 py-2 rounded-lg text-sm font-semibold touch-target transition-colors ${mode === "single" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                Solo
              </button>
              <button onClick={() => setMode("shared")} className={`px-4 py-2 rounded-lg text-sm font-semibold touch-target transition-colors ${mode === "shared" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                With Family
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground block mb-1">{planType === "monthly" ? "Start Date" : "Due Date"}</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground" />
            {planType === "monthly" ? (
              <p className="mt-2 text-xs text-muted-foreground">This will create 4 weekly homework assignments starting from the selected date.</p>
            ) : null}
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground block mb-1">Notes for Family</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground resize-none" placeholder="Tips, focus areas..." />
          </div>

          <div className="bg-muted rounded-xl p-4">
            <p className="text-sm font-semibold text-foreground mb-1">Selected: {selectedGames.length} games</p>
            <div className="flex flex-wrap gap-1">
              {selectedGames.map((id) => {
                const g = availableGames.find((game) => game.id === id) || allGames.find((game) => game.id === id);
                return g ? (
                  <span key={id} className="text-xs bg-primary/10 text-foreground px-2 py-1 rounded-full">
                    {g.emoji} {g.name}
                  </span>
                ) : null;
              })}
            </div>
          </div>

          <button
            onClick={handleAssign}
            disabled={selectedGames.length === 0 || !childId}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-display font-bold text-base touch-target disabled:opacity-50 transition-opacity"
          >
            {planType === "monthly" ? `Create Monthly Plan (4 weeks, ${selectedGames.length} games)` : `Assign Homework (${selectedGames.length} games)`}
          </button>

          <AnimatePresence>
            {success && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-secondary/20 text-foreground text-center py-2 rounded-lg text-sm font-semibold">
                {planType === "monthly" ? "Monthly homework plan created!" : "Homework assigned!"}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-2">
          <div className="flex gap-2 flex-wrap mb-4">
            <button onClick={() => setFilterCategory("all")} className={`px-3 py-1.5 rounded-full text-xs font-semibold touch-target transition-colors ${filterCategory === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {mode === "shared" ? "Shared Games" : "All"}
            </button>
            {categories.map(([key, meta]) => {
              const count = categoryCounts[key] || 0;
              return (
                <button key={key} onClick={() => setFilterCategory(key)} className={`px-3 py-1.5 rounded-full text-xs font-semibold touch-target transition-colors ${filterCategory === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {meta.emoji} {meta.label} ({count})
                </button>
              );
            })}
          </div>

          {filteredGames.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[500px] overflow-y-auto pr-2">
              {filteredGames.map((g) => (
                <button
                  key={g.id}
                  onClick={() => toggleGame(g.id)}
                  className={`text-left p-3 rounded-xl border-2 transition-all touch-target ${
                    selectedGames.includes(g.id)
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <div className="text-2xl mb-1">{g.emoji}</div>
                  <p className="text-xs font-bold text-foreground leading-tight">{g.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{g.estimatedMinutes}min - {g.difficulty}</p>
                  {mode === "shared" && (
                    <span className="text-[10px] bg-accent/20 text-foreground px-1.5 py-0.5 rounded-full mt-1 inline-block">Shared</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-6 text-center">
              <p className="font-display text-lg font-bold text-foreground mb-2">
                {selectedCategoryMeta ? `${selectedCategoryMeta.label} is empty in this mode` : "No games available"}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {mode === "shared"
                  ? "These categories mostly contain solo games. Switch homework mode to Solo to see them."
                  : "No games matched this category right now."}
              </p>
              {mode === "shared" ? (
                <button
                  onClick={() => setMode("single")}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground touch-target"
                >
                  Switch to Solo
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
