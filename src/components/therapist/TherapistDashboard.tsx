import { useState } from "react";
import { useApp } from "@/context/AppContext";
import ChildList from "./ChildList";
import AssignHomework from "./AssignHomework";
import HomeworkReview from "./HomeworkReview";
import ClinicSession from "./ClinicSession";
import { motion } from "framer-motion";

type Tab = "children" | "assign" | "clinic" | "review";

const tabs: { key: Tab; label: string; emoji: string }[] = [
  { key: "children", label: "Children", emoji: "👧" },
  { key: "assign", label: "Homework", emoji: "📝" },
  { key: "clinic", label: "Classwork", emoji: "🏥" },
  { key: "review", label: "Reports", emoji: "📊" },
];

export default function TherapistDashboard() {
  const { setRole } = useApp();
  const [tab, setTab] = useState<Tab>("children");

  return (
    <div className="min-h-screen">
      <header className="bg-card/85 backdrop-blur-md border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧑‍⚕️</span>
          <h1 className="font-display text-xl font-bold text-foreground">Therapist Dashboard</h1>
        </div>
        <button onClick={() => setRole("none")} className="text-sm text-muted-foreground hover:text-foreground transition-colors touch-target px-3">
          Back
        </button>
      </header>

      <nav className="flex gap-1 px-4 sm:px-6 pt-4 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-3 rounded-t-xl font-display font-semibold text-sm transition-colors touch-target whitespace-nowrap ${
              tab === t.key
                ? "bg-card text-foreground border border-b-0 border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </nav>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-card/88 backdrop-blur-md border border-border rounded-b-xl rounded-tr-xl mx-4 sm:mx-6 mb-6 p-4 sm:p-6"
      >
        {tab === "children" && <ChildList />}
        {tab === "assign" && <AssignHomework />}
        {tab === "clinic" && <ClinicSession />}
        {tab === "review" && <HomeworkReview />}
      </motion.div>
    </div>
  );
}
