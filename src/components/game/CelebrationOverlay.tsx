import { useEffect } from "react";
import { motion } from "framer-motion";
import type { RewardResult } from "@/lib/rewards";
import { speak } from "@/lib/speech";
import { useSensory } from "@/lib/sensory";

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
  reward?: RewardResult | null;
  independenceRate?: number | null;
  onContinue: () => void;
}

function StarRow({ earned }: { earned: number }) {
  const { calmMode } = useSensory();

  return (
    <div className="mb-4 flex items-center justify-center gap-2">
      {[1, 2, 3].map((star) => (
        <motion.span
          key={star}
          initial={{ opacity: 0, scale: calmMode ? 0.8 : 0.3, rotate: calmMode ? 0 : -30 }}
          animate={{ opacity: star <= earned ? 1 : 0.25, scale: calmMode ? 1 : [0.4, 1.25, 1], rotate: 0 }}
          transition={calmMode ? { delay: star * 0.12, duration: 0.3 } : { delay: 0.35 + star * 0.22, type: "spring", stiffness: 260, damping: 14 }}
          className={`text-4xl drop-shadow-[0_0_16px_rgba(250,204,21,0.55)] ${star <= earned ? "" : "grayscale"}`}
          aria-label={star <= earned ? `${earned} of 3 stars` : "empty star"}
        >
          ⭐
        </motion.span>
      ))}
    </div>
  );
}

export default function CelebrationOverlay({ childName, childAvatar, message, themes, reward, independenceRate, onContinue }: Props) {
  const { calmMode } = useSensory();
  const confetti = calmMode ? [] : themes.slice(0, 6);
  const independenceLine =
    typeof independenceRate === "number" && independenceRate >= 100
      ? "You answered everything all by yourself! 🌟"
      : typeof independenceRate === "number" && independenceRate >= 60
        ? "Mostly all by yourself — that's growing! 💪"
        : null;
  const praise = `Amazing work ${childName}! You earned ${reward?.starsEarned ?? 2} ${reward?.starsEarned === 1 ? "star" : "stars"}!${independenceLine ? ` ${independenceLine}` : ""}`;

  useEffect(() => {
    speak(praise);
  }, [praise]);

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
        className="relative z-10 max-h-full w-full max-w-lg overflow-y-auto rounded-[2rem] border border-white/20 bg-[linear-gradient(160deg,rgba(17,24,39,0.96),rgba(30,41,59,0.92))] p-6 text-center shadow-[0_28px_80px_rgba(15,23,42,0.46)] sm:p-8"
      >
        <StarRow earned={reward?.starsEarned ?? 2} />

        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border border-white/30 bg-white/10 text-5xl shadow-[0_0_32px_rgba(255,255,255,0.14)]">
          {childAvatar}
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/65">Session Complete</p>
        <h2 className="mt-2 font-display text-3xl font-extrabold text-white sm:text-4xl">Amazing work, {childName}!</h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/82 sm:text-base">{message}</p>

        {independenceLine ? (
          <p className="mt-3 inline-block rounded-full bg-emerald-400/20 px-4 py-1.5 text-sm font-bold text-emerald-200 ring-1 ring-emerald-300/40">
            {independenceLine}
          </p>
        ) : null}

        {reward?.isNewSticker && reward.sticker ? (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: [1, 1.06, 1] }}
            transition={{ delay: 1.15, duration: 0.5 }}
            className="mt-5 rounded-2xl border border-amber-300/40 bg-gradient-to-br from-amber-400/25 to-orange-500/20 p-4"
          >
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-200">New sticker unlocked!</p>
            <p aria-hidden="true" className="mt-2 text-5xl drop-shadow-[0_0_18px_rgba(251,191,36,0.5)]">{reward.sticker}</p>
            <p className="mt-2 text-xs text-white/70">Added to the sticker book · {reward.state.stickers.length} collected</p>
          </motion.div>
        ) : null}

        {reward && reward.state.stickers.length > 0 ? (
          <div className="mt-4 rounded-2xl border border-white/12 bg-white/6 p-3">
            <p className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">Sticker book</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {reward.state.stickers.slice(-10).map((sticker) => (
                <span key={sticker} className="grid h-9 w-9 place-items-center rounded-xl bg-white/12 text-xl" aria-hidden="true">
                  {sticker}
                </span>
              ))}
              <span className="ml-1 text-xs font-semibold text-white/65">⭐ {reward.totalStars} total stars</span>
            </div>
          </div>
        ) : null}

        <div className="mt-5 rounded-2xl border border-white/12 bg-white/6 p-4 text-left">
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
