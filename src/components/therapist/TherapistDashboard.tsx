import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { useApp } from "@/context/AppContext";
import CaseloadOverview from "./CaseloadOverview";
import ChildList from "./ChildList";
import AssignHomework from "./AssignHomework";
import HomeworkReview from "./HomeworkReview";
import ClinicSession from "./ClinicSession";
import { School, therapistNavIcons } from "@/components/icons/AppIcon";

type Section = "kids" | "work" | "results";

const sections: { key: Section; label: string; helper: string }[] = [
  { key: "kids", label: "My Kids", helper: "See who needs attention" },
  { key: "work", label: "Give Work", helper: "Set homework & run sessions" },
  { key: "results", label: "Results", helper: "Review what happened" },
];

export default function TherapistDashboard() {
  const { setRole, session, therapistUsers, signInTherapist, signOut } = useApp();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("kids");
  const [kidsView, setKidsView] = useState<"overview" | "profiles">("overview");
  const [workView, setWorkView] = useState<"assign" | "clinic">("assign");
  const [email, setEmail] = useState(therapistUsers[0]?.email || "therapist@playgroundlife.app");
  const [password, setPassword] = useState("therapist123");
  const [error, setError] = useState("");

  if (session?.role !== "therapist") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <button onClick={() => { setRole("none"); navigate("/"); }} className="absolute left-4 top-4 text-sm text-muted-foreground hover:text-foreground touch-target">
            Back
          </button>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/35 bg-card/82 p-6 shadow-[0_24px_70px_rgba(21,31,56,0.16)] backdrop-blur-xl sm:p-8"
          >
            <div className="mb-8 text-center">
              <h1 className="mb-2 font-display text-3xl font-extrabold text-foreground">Therapist Sign In</h1>
              <p className="text-sm text-muted-foreground sm:text-base">Secure clinic access for assignments, approvals, reports, and audit history.</p>
            </div>

            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                const handleResult = (authenticated: boolean) => {
                  if (!authenticated) {
                    setError("We couldn't sign you in. Check the clinic email and password.");
                    return;
                  }
                  setError("");
                };
                const authenticated = signInTherapist(email, password);
                if (authenticated instanceof Promise) authenticated.then(handleResult);
                else handleResult(authenticated);
              }}
            >
              <div className="space-y-2">
                <label htmlFor="therapist-email" className="block text-sm font-semibold text-foreground">
                  Clinic email
                </label>
                <input
                  id="therapist-email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (error) setError("");
                  }}
                  autoComplete="email"
                  className="h-12 w-full rounded-xl border border-border bg-background/85 px-4 text-base text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="therapist-password" className="block text-sm font-semibold text-foreground">
                  Password
                </label>
                <input
                  id="therapist-password"
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (error) setError("");
                  }}
                  autoComplete="current-password"
                  className="h-12 w-full rounded-xl border border-border bg-background/85 px-4 text-base text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <button
                type="submit"
                className="touch-target w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground shadow-[0_16px_40px_rgba(77,170,206,0.28)] transition hover:brightness-105"
              >
                Sign In
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-border/70 bg-background/45 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Demo clinic access</p>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <p>therapist@playgroundlife.app</p>
                <p>therapist123</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const activeSection = sections.find((entry) => entry.key === section) || sections[0];

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-border bg-card/85 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-3">
          <span className="inline-grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <School className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Therapist Dashboard</h1>
            <p className="text-xs text-muted-foreground">{activeSection.helper}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate("/how-it-works")}
            className="touch-target rounded-full bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
          >
            ? Guide
          </button>
          <button
            onClick={() => navigate("/")}
            aria-label="Back to home"
            className="touch-target grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
          </button>
          <button onClick={() => { signOut(); navigate("/"); }} className="text-sm text-muted-foreground hover:text-foreground transition-colors touch-target px-3">
            Sign Out
          </button>
        </div>
      </header>

      <nav className="mx-auto grid max-w-3xl grid-cols-3 gap-2 px-3 pt-5 sm:px-6" aria-label="Dashboard sections">
        {sections.map((entry) => {
          const NavIcon = therapistNavIcons[entry.key === "kids" ? "overview" : entry.key === "work" ? "assign" : "review"];
          return (
            <button
              key={entry.key}
              onClick={() => setSection(entry.key)}
              aria-current={section === entry.key ? "page" : undefined}
              className={`touch-target flex flex-col items-center gap-1 rounded-2xl px-3 py-3 text-center transition-colors ${
                section === entry.key
                  ? "bg-primary text-primary-foreground shadow-[0_14px_36px_rgba(77,170,206,0.32)]"
                  : "bg-card/85 text-muted-foreground hover:text-foreground ring-1 ring-border"
              }`}
            >
              <NavIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="text-sm font-bold">{entry.label}</span>
            </button>
          );
        })}
      </nav>

      {section !== "results" ? (
        <div className="mx-auto mt-4 flex max-w-3xl justify-center px-3 sm:px-6">
          <div className="inline-flex rounded-full border border-border bg-card/85 p-1" role="tablist" aria-label={`${activeSection.label} views`}>
            {(section === "kids"
              ? [
                  { key: "overview" as const, label: "At a glance" },
                  { key: "profiles" as const, label: "Profiles & goals" },
                ]
              : [
                  { key: "assign" as const, label: "Homework builder" },
                  { key: "clinic" as const, label: "Live classwork" },
                ]
            ).map((view) => {
              const selected = section === "kids" ? kidsView === view.key : workView === view.key;
              const onSelect = () => (section === "kids" ? setKidsView(view.key) : setWorkView(view.key));
              return (
                <button
                  key={view.key}
                  role="tab"
                  aria-selected={selected}
                  onClick={onSelect}
                  className={`touch-target rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                    selected ? "bg-primary/12 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {view.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <motion.div
        key={`${section}-${section === "kids" ? kidsView : workView}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mx-auto mb-8 mt-4 max-w-6xl px-3 sm:px-6"
      >
        {section === "kids" && kidsView === "overview" && <CaseloadOverview />}
        {section === "kids" && kidsView === "profiles" && <ChildList />}
        {section === "work" && workView === "assign" && <AssignHomework />}
        {section === "work" && workView === "clinic" && <ClinicSession />}
        {section === "results" && <HomeworkReview />}
      </motion.div>
    </div>
  );
}
