import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const roles = [
  {
    emoji: "🧑‍⚕️",
    title: "Therapist",
    description: "Assign sessions, track progress, tune every game.",
    route: "/therapist",
    classes: "bg-primary/90 text-primary-foreground shadow-[0_24px_60px_rgba(77,170,206,0.30)]",
    delay: 0.15,
  },
  {
    emoji: "👪",
    title: "Family",
    description: "Play homework together and watch skills grow.",
    route: "/family",
    classes: "bg-secondary/90 text-secondary-foreground shadow-[0_24px_60px_rgba(102,190,132,0.28)]",
    delay: 0.25,
  },
];

export default function RoleSelector() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4 sm:p-6">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="relative z-10 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-muted-foreground">Playground Life</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Play with purpose.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base leading-7 text-muted-foreground">
          Therapeutic games for children on the spectrum — at the clinic and at home.
        </p>
      </motion.div>

      <div className="relative z-10 mt-10 w-full max-w-xl space-y-3">
        {roles.map((role) => (
          <motion.button
            key={role.title}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: role.delay, duration: 0.4 }}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => navigate(role.route)}
            className={`touch-target flex w-full items-center gap-5 rounded-3xl border border-white/40 p-5 text-left backdrop-blur-md sm:p-6 ${role.classes}`}
          >
            <span aria-hidden="true" className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/20 text-4xl">
              {role.emoji}
            </span>
            <span className="min-w-0">
              <span className="block font-display text-2xl font-bold tracking-tight">{role.title}</span>
              <span className="mt-0.5 block text-sm opacity-85">{role.description}</span>
            </span>
            <span aria-hidden="true" className="ml-auto text-xl opacity-60">›</span>
          </motion.button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="relative z-10 mt-8 flex items-center gap-4 text-sm"
      >
        <button onClick={() => navigate("/admin")} className="touch-target rounded-full px-4 py-2 text-muted-foreground transition hover:bg-card/70 hover:text-foreground">
          Clinic Admin · caseloads
        </button>
        <span aria-hidden="true" className="h-4 w-px bg-border" />
        <button onClick={() => navigate("/how-it-works")} className="touch-target rounded-full px-4 py-2 text-muted-foreground transition hover:bg-card/70 hover:text-foreground">
          How it works
        </button>
      </motion.div>
    </div>
  );
}
