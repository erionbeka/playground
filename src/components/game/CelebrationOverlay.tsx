import { motion } from "framer-motion";

interface CelebrationTheme {
  icon: string;
  accentClass: string;
  glowClass: string;
  label: string;
}

interface Props {
  childName: string;
  childAvatar: string;
  message: string;
  themes: CelebrationTheme[];
  onContinue: () => void;
}

export default function CelebrationOverlay({ childName, childAvatar, message, themes, onContinue }: Props) {
  const confetti = themes.slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confetti.map((theme, index) => (
          <motion.div
            key={`${theme.label}-${index}`}
            initial={{ opacity: 0, y: 40, scale: 0.6 }}
            animate={{
              opacity: [0, 1, 0.85],
              y: [20, -120 - index * 16, -220 - index * 20],
              x: [0, index % 2 === 0 ? -50 : 50, index % 2 === 0 ? 70 : -70],
              rotate: [0, index % 2 === 0 ? -18 : 18, index % 2 === 0 ? 10 : -10],
            }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: index * 0.18 }}
            className={`absolute bottom-10 text-4xl drop-shadow-[0_0_18px_rgba(255,255,255,0.3)] ${theme.glowClass}`}
            style={{ left: `${18 + index * 12}%` }}
          >
            {theme.icon}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 18 }}
        className="relative z-10 w-full max-w-lg rounded-[2rem] border border-white/20 bg-[linear-gradient(160deg,rgba(17,24,39,0.96),rgba(30,41,59,0.92))] p-6 text-center shadow-[0_28px_80px_rgba(15,23,42,0.46)] sm:p-8"
      >
        <div className="mb-5 flex items-center justify-center gap-3">
          {themes.slice(0, 3).map((theme) => (
            <span key={theme.label} className={`rounded-full px-3 py-1 text-sm font-semibold text-white ${theme.accentClass}`}>
              {theme.icon} {theme.label}
            </span>
          ))}
        </div>

        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border border-white/30 bg-white/10 text-5xl shadow-[0_0_32px_rgba(255,255,255,0.14)]">
          {childAvatar}
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/65">Session Complete</p>
        <h2 className="mt-2 font-display text-3xl font-extrabold text-white sm:text-4xl">Amazing work, {childName}!</h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/82 sm:text-base">{message}</p>

        <div className="mt-6 rounded-2xl border border-white/12 bg-white/6 p-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Why this matters</p>
          <p className="mt-2 text-sm text-white/75">
            Each finished activity helps the therapist and family see which skills are getting stronger and when it is time to move up to the next challenge.
          </p>
        </div>

        <button
          onClick={onContinue}
          className="mt-6 w-full rounded-full border border-white/20 bg-white/14 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/22"
        >
          Continue
        </button>
      </motion.div>
    </motion.div>
  );
}
