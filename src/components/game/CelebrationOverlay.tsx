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

const floatVariants = {
  initial: { opacity: 0, y: 24, scale: 0.8 },
  animate: (index: number) => ({
    opacity: [0, 1, 1, 0.85],
    y: [20, -24 - (index % 3) * 18, -70 - (index % 4) * 16],
    x: [0, (index % 2 === 0 ? -1 : 1) * (18 + (index % 3) * 10), (index % 2 === 0 ? 1 : -1) * (28 + (index % 4) * 10)],
    scale: [0.7, 1, 1.08, 0.92],
    rotate: [0, index % 2 === 0 ? -10 : 10, index % 2 === 0 ? 8 : -8],
    transition: {
      duration: 2.8,
      repeat: Infinity,
      ease: "easeInOut",
      delay: index * 0.12,
    },
  }),
};

export default function CelebrationOverlay({ childName, childAvatar, message, themes, onContinue }: Props) {
  const bursts = Array.from({ length: 18 }, (_, index) => themes[index % themes.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 overflow-hidden rounded-[2rem] border border-white/40 bg-slate-950/72 backdrop-blur-md"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_40%),radial-gradient(circle_at_bottom,_rgba(255,255,255,0.12),_transparent_42%)]" />

      {bursts.map((theme, index) => {
        const left = 10 + (index % 6) * 14;
        const bottom = 6 + Math.floor(index / 6) * 12;

        return (
          <motion.div
            key={`${theme.label}-${index}`}
            custom={index}
            variants={floatVariants}
            initial="initial"
            animate="animate"
            className={`absolute text-4xl drop-shadow-[0_0_16px_rgba(255,255,255,0.35)] sm:text-5xl ${theme.glowClass}`}
            style={{ left: `${left}%`, bottom: `${bottom}%` }}
          >
            {theme.icon}
          </motion.div>
        );
      })}

      <div className="relative flex min-h-full items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 18 }}
          className="w-full max-w-md rounded-[2rem] border border-white/35 bg-white/16 p-6 text-center shadow-[0_24px_80px_rgba(15,23,42,0.42)]"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1], rotate: [0, -4, 4, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border border-white/45 bg-white/18 text-5xl shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          >
            {childAvatar}
          </motion.div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">Challenge Complete</p>
          <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">Amazing job, {childName}!</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm text-white/80 sm:text-base">{message}</p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {themes.slice(0, 4).map((theme) => (
              <span
                key={theme.label}
                className={`rounded-full border border-white/20 px-3 py-1 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(15,23,42,0.25)] ${theme.accentClass}`}
              >
                {theme.icon} {theme.label}
              </span>
            ))}
          </div>

          <button
            onClick={onContinue}
            className="mt-6 rounded-full border border-white/30 bg-white/18 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/24"
          >
            Continue
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
