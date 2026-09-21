import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useApp, HomeworkAssignment } from "@/context/AppContext";
import { getGameById } from "@/data/games";
import { AnimatePresence, motion } from "framer-motion";
import MatchingEngine from "./engines/MatchingEngine";
import TappingEngine from "./engines/TappingEngine";
import SocialEngine from "./engines/SocialEngine";
import PlaygroundEngine from "./engines/PlaygroundEngine";
import SequenceEngine from "./engines/SequenceEngine";
import SortingEngine from "./engines/SortingEngine";
import RecognitionEngine from "./engines/RecognitionEngine";
import CountingEngine from "./engines/CountingEngine";
import MemoryEngine from "./engines/MemoryEngine";
import BuildingEngine from "./engines/BuildingEngine";
import MagicToysEngine from "./engines/MagicToysEngine";
import OddOneOutEngine from "./engines/OddOneOutEngine";
import PatternNextEngine from "./engines/PatternNextEngine";
import FaceBuilderEngine from "./engines/FaceBuilderEngine";
import WhatsMissingEngine from "./engines/WhatsMissingEngine";
import SituationFeelingsEngine from "./engines/SituationFeelingsEngine";
import SoundMemoryEngine from "./engines/SoundMemoryEngine";
import GenericEngine from "./engines/GenericEngine";
import CelebrationOverlay from "./CelebrationOverlay";
import BreathingOverlay from "./BreathingOverlay";
import SensoryControls from "./SensoryControls";
import { useGameAudio } from "./useGameAudio";
import { getChildReadinessState } from "@/lib/personalization";
import { cancelSpeech, speak } from "@/lib/speech";
import { recordReward, RewardResult } from "@/lib/rewards";
import { getLatestMood, MOOD_OPTIONS, recordMood, type MoodKey } from "@/lib/mood";
import { appendChildEvent } from "@/lib/sessionEvents";
import { productionApi } from "@/lib/productionApi";
import type { EventRecord } from "@/lib/gameAnalytics";
import { useSensory } from "@/lib/sensory";
import { startTierForGame, updateFromSession } from "@/lib/childModel";
import { consistencyScore } from "@/lib/science";
import { getGameSkillDomains } from "@/lib/skills";

const IS_API_MODE = import.meta.env.VITE_DATA_MODE === "api";
import { GameIcon } from "@/components/icons/AppIcon";
import { GameCompletionMetrics } from "./gameCompletion";

interface Props {
  gameId: string;
  assignment: HomeworkAssignment;
  onComplete: () => void;
}

export default function GamePlayer({ gameId, assignment, onComplete }: Props) {
  const { completeGame, children, assignments } = useApp();
  const game = getGameById(gameId);
  const [started, setStarted] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [interactions, setInteractions] = useState(0);
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [attemptNotice, setAttemptNotice] = useState<GameCompletionMetrics | null>(null);
  const [rewardResult, setRewardResult] = useState<RewardResult | null>(null);
  const [lastMetrics, setLastMetrics] = useState<GameCompletionMetrics | null>(null);
  const [breathingOpen, setBreathingOpen] = useState(false);
  const [exitPrompt, setExitPrompt] = useState(false);
  const [moodLogged, setMoodLogged] = useState<MoodKey | null>(null);
  const [sessionEvents, setSessionEvents] = useState<EventRecord[]>([]);
  const breathingStartedAt = useRef<number | null>(null);
  const { warmUpAudio, playTapSound, playStartSound, playCelebrationSound } = useGameAudio();

  const child = useMemo(
    () => children.find((candidate) => candidate.id === assignment.childId) || null,
    [assignment.childId, children]
  );

  const celebrationConfig = useMemo(() => {
    const loweredNotes = child?.notes.toLowerCase() || "";

    if (loweredNotes.includes("animal")) {
      return {
        message: `${child?.name || "You"} finished strong, so a parade of animal friends is here to cheer you on!`,
        themes: [
          { icon: "🦊", label: "Forest Friends", accentClass: "bg-emerald-400/25", glowClass: "text-emerald-200" },
          { icon: "🐼", label: "Animal Party", accentClass: "bg-sky-400/25", glowClass: "text-sky-200" },
          { icon: "🦁", label: "Wild Cheers", accentClass: "bg-amber-400/25", glowClass: "text-amber-200" },
          { icon: "🐬", label: "Ocean Splash", accentClass: "bg-cyan-400/25", glowClass: "text-cyan-200" },
        ],
      };
    }

    if (loweredNotes.includes("visual") || loweredNotes.includes("pattern")) {
      return {
        message: `${child?.name || "You"} just completed another challenge, so bright shapes and stars are celebrating every smart move!`,
        themes: [
          { icon: "🌈", label: "Color Burst", accentClass: "bg-fuchsia-400/25", glowClass: "text-fuchsia-200" },
          { icon: "⭐", label: "Star Spark", accentClass: "bg-amber-400/25", glowClass: "text-amber-200" },
          { icon: "🧩", label: "Pattern Pop", accentClass: "bg-violet-400/25", glowClass: "text-violet-200" },
          { icon: "💫", label: "Glow Trail", accentClass: "bg-sky-400/25", glowClass: "text-sky-200" },
        ],
      };
    }

    return {
      message: `${child?.name || "You"} did it, and this celebration is here to make the finish feel extra special.`,
      themes: [
        { icon: "🎉", label: "Big Cheers", accentClass: "bg-rose-400/25", glowClass: "text-rose-200" },
        { icon: "🌟", label: "Shiny Win", accentClass: "bg-amber-400/25", glowClass: "text-amber-200" },
        { icon: "🎈", label: "Balloon Lift", accentClass: "bg-sky-400/25", glowClass: "text-sky-200" },
        { icon: "🎶", label: "Happy Beats", accentClass: "bg-emerald-400/25", glowClass: "text-emerald-200" },
      ],
    };
  }, [child]);

  const readiness = useMemo(
    () => (child ? getChildReadinessState(child, assignments) : null),
    [assignments, child]
  );

  const runtimeGame = useMemo(
    () => {
      const modelTier = child ? startTierForGame(child.id, gameId) : null;
      return {
        ...game,
        config: {
          ...game.config,
          ...(assignment.tuning?.[gameId] || {}),
          ...(modelTier ? { startLevel: modelTier } : {}),
          assignedDifficulty: assignment.difficulty || game.difficulty,
          supportLevel: assignment.supportLevel || game.config.supportLevel || "moderate",
          readinessStage: readiness?.stage || "build",
        },
      };
    },
    [assignment, child, game, readiness?.stage]
  );

  const handleInteraction = useCallback(() => {
    playTapSound();
    setInteractions((prev) => prev + 1);
  }, [playTapSound]);

  useEffect(() => {
    if (!celebrationVisible) return;

    playCelebrationSound();

    const timeoutId = window.setTimeout(() => {
      setCelebrationVisible(false);
      onComplete();
    }, 4500);

    return () => window.clearTimeout(timeoutId);
  }, [celebrationVisible, onComplete, playCelebrationSound]);

  useEffect(() => {
    return () => cancelSpeech();
  }, []);

  const requestExit = useCallback(() => {
    if (started && interactions > 0 && !celebrationVisible) {
      setExitPrompt(true);
      return;
    }
    cancelSpeech();
    onComplete();
  }, [celebrationVisible, interactions, onComplete, started]);

  const logEvent = useCallback(
    (type: string, detail?: string) => {
      const entry: EventRecord = { at: Date.now(), type, detail };
      setSessionEvents((current) => [...current.slice(-40), entry]);
      if (child) {
        appendChildEvent(child.id, type, detail);
        if (IS_API_MODE) void productionApi.recordChildEvent(child.id, type, detail).catch(() => undefined);
      }
    },
    [child]
  );

  const handleRegulationToggle = useCallback(
    (type: "calm" | "voice" | "sound", enabled: boolean) => {
      logEvent(`${type}_${enabled ? "on" : "off"}`);
      if (IS_API_MODE && child && type === "calm") {
        void productionApi.setChildPreference(child.id, { calmMode: enabled }).catch(() => undefined);
      }
    },
    [child, logEvent]
  );

  const openBreathingBreak = useCallback(() => {
    breathingStartedAt.current = Date.now();
    setBreathingOpen(true);
  }, []);

  const closeBreathingBreak = useCallback(() => {
    const openedAt = breathingStartedAt.current;
    breathingStartedAt.current = null;
    setBreathingOpen(false);
    playTapSound();
    if (openedAt) {
      const seconds = Math.max(1, Math.round((Date.now() - openedAt) / 1000));
      logEvent("breathing_break", `${seconds}s`);
    }
  }, [logEvent, playTapSound]);

  const handleMoodPick = useCallback(
    (mood: MoodKey) => {
      if (!child || moodLogged) return;
      recordMood(child.id, mood);
      setMoodLogged(mood);
      if (IS_API_MODE) void productionApi.recordChildMood(child.id, mood).catch(() => undefined);
      const label = MOOD_OPTIONS.find((option) => option.key === mood)?.label || "";
      speak(`Thank you for telling me you feel ${label}.`);
    },
    [child, moodLogged]
  );

  const lastMood = useMemo(() => (child ? getLatestMood(child.id) : null), [child]);
  const { calmMode } = useSensory();

  const handleGameComplete = useCallback(
    (score: number, socialScore?: number, metrics?: GameCompletionMetrics) => {
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      const enrichedMetrics = sessionEvents.length
        ? { ...metrics, sessionEvents }
        : metrics;
      completeGame(assignment.id, {
        gameId,
        completedAt: new Date().toISOString().slice(0, 10),
        durationSeconds,
        score,
        interactions,
        socialScore,
        ...enrichedMetrics,
      });
      if (metrics?.completedSuccessfully === false) {
        setAttemptNotice(metrics);
        setStarted(false);
        return;
      }

      if (child) {
        const rewards = recordReward(child.id, gameId, score, Boolean(metrics?.completedSuccessfully));
        setRewardResult(rewards);
        if (IS_API_MODE) {
          void productionApi
            .saveChildRewards(child.id, {
              stars: rewards.totalStars,
              stickers: rewards.state.stickers,
              plays: rewards.state.plays,
            })
            .catch(() => undefined);
        }
        if (metrics) {
          const correctFlags = metrics.trace
            ? metrics.trace.trials.map((trial) => trial.correct)
            : [];
          updateFromSession(
            child.id,
            metrics.attemptsBySkill,
            metrics.independenceRate ?? metrics.accuracy ?? score,
            {
              medianLatencyMs: metrics.medianLatencyMs,
              consistency: correctFlags.length ? consistencyScore(correctFlags) : undefined,
            }
          );
        }
      }
      setLastMetrics(metrics ?? null);
      setCelebrationVisible(true);
    },
    [assignment.id, child, completeGame, gameId, interactions, sessionEvents, startTime]
  );

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-foreground">Game not found</p>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className={`mb-4 ${calmMode ? "" : "animate-bounce-gentle"}`}>
            <GameIcon game={game} size="xl" />
          </div>
          <h1 className="font-display text-3xl font-extrabold text-foreground mb-2">{game.name}</h1>
          <p className="text-muted-foreground mb-4">{game.description}</p>

          <div className="mx-auto mb-5 flex max-w-xs items-center justify-center gap-2 rounded-2xl border border-secondary/30 bg-secondary/10 px-4 py-3">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-secondary">First</span>
            <span aria-hidden="true" className="text-xl">🎮</span>
            <span className="text-sm font-bold text-foreground">{game.name}</span>
            <span aria-hidden="true" className="text-muted-foreground">→</span>
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Then</span>
            <span aria-hidden="true" className="text-xl">⭐</span>
            <span className="text-sm font-semibold text-muted-foreground">Star surprise</span>
          </div>

          {(() => {
            const order = assignment.gameIds;
            const done = new Set(assignment.completedGames);
            const remaining = order.filter((id) => !done.has(id));
            if (remaining.length <= 1 && order.length <= 1) return null;
            return (
              <div className="mx-auto mb-5 w-full max-w-md rounded-2xl border border-border bg-card/80 p-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Today's plan · {remaining.length} game{remaining.length === 1 ? "" : "s"} left
                  {remaining.length === 1 ? " — then all done! 🏁" : ""}
                </p>
                <ol className="space-y-1">
                  {order.map((id, index) => {
                    const g = getGameById(id);
                    if (!g) return null;
                    const state = done.has(id) ? "done" : id === gameId ? "now" : "next";
                    return (
                      <li key={id} className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs ${
                        state === "now" ? "bg-primary/15 font-bold text-foreground"
                        : state === "done" ? "text-muted-foreground line-through opacity-60"
                        : "text-muted-foreground"
                      }`}>
                        <span aria-hidden="true">{state === "done" ? "✅" : state === "now" ? "▶️" : `${index + 1}.`}</span>
                        <GameIcon game={g} size="sm" />
                        {g.name}
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          })()}

          {child ? (
            <div className="mx-auto mb-5 rounded-2xl border border-border bg-card/80 p-3">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Before we start, how do you feel, {child.name}?</p>
              <div className="flex justify-center gap-2">
                {MOOD_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => handleMoodPick(option.key)}
                    aria-label={option.label}
                    title={option.label}
                    className={`touch-target grid h-11 w-11 place-items-center rounded-full text-2xl transition ${
                      moodLogged === option.key ? "bg-primary/15 ring-2 ring-primary/50" : "bg-muted hover:bg-muted/70"
                    }`}
                  >
                    <span aria-hidden="true">{option.emoji}</span>
                  </button>
                ))}
              </div>
              {moodLogged || lastMood ? (
                <p className="mt-2 text-[11px] text-muted-foreground">Thanks for telling me 💚</p>
              ) : null}
            </div>
          ) : null}

          <div className="flex gap-3 justify-center mb-5">
            {game.skills.map((s) => (
              <span key={s} className="text-xs bg-primary/10 text-foreground px-3 py-1 rounded-full capitalize">{s}</span>
            ))}
          </div>

          <div className="mb-6 flex justify-center">
            <SensoryControls onBreathingBreak={openBreathingBreak} onRegulationEvent={handleRegulationToggle} />
          </div>

          <div className="flex gap-3 justify-center">
            <button onClick={requestExit} className="px-6 py-3 bg-muted text-muted-foreground rounded-xl font-semibold touch-target">
              Back
            </button>
            <button
              onClick={() => {
                warmUpAudio();
                playStartSound();
                speak(`${game.name}. ${game.description}`);
                setAttemptNotice(null);
                setRewardResult(null);
                setInteractions(0);
                setStartTime(Date.now());
                setStarted(true);
              }}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-display font-bold text-lg touch-target"
            >
              {attemptNotice ? "Try Again" : "Start"}
            </button>
          </div>
          {attemptNotice ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left">
              <p className="font-display text-base font-bold text-amber-950">Practice attempt saved</p>
              <p className="mt-1 text-sm text-amber-900">
                Accuracy was {attemptNotice.accuracy}%. This game will stay available until it reaches {attemptNotice.masteryThreshold}% mastery.
              </p>
              <p className="mt-2 text-xs text-amber-800">Trials: {attemptNotice.trials} | Correct: {attemptNotice.correctTrials} | Errors: {attemptNotice.errors}</p>
            </div>
          ) : null}
        </motion.div>
      </div>
    );
  }

  const engineProps = { game: runtimeGame, onInteraction: handleInteraction, onComplete: handleGameComplete };

  return (
    <div className="min-h-screen">
      <div className="bg-card/85 backdrop-blur-md border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GameIcon game={game} size="sm" />
          <span className="font-display font-bold text-foreground text-sm">{game.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <SensoryControls onBreathingBreak={openBreathingBreak} onRegulationEvent={handleRegulationToggle} />
          <button
            onClick={requestExit}
            className="text-xs text-muted-foreground hover:text-foreground touch-target px-3"
          >
            Exit
          </button>
        </div>
      </div>

      <div className="relative p-4">
        {game.engine === "matching" ? (
          <MatchingEngine {...engineProps} />
        ) : game.engine === "tapping" ? (
          <TappingEngine {...engineProps} />
        ) : game.engine === "social" ? (
          <SocialEngine {...engineProps} />
        ) : game.engine === "sandbox" || game.engine === "slide" || game.engine === "bench" ? (
          <PlaygroundEngine {...engineProps} />
        ) : game.engine === "sequence" ? (
          <SequenceEngine {...engineProps} />
        ) : game.engine === "sorting" ? (
          <SortingEngine {...engineProps} />
        ) : game.engine === "recognition" ? (
          <RecognitionEngine {...engineProps} />
        ) : game.engine === "counting" ? (
          <CountingEngine {...engineProps} />
        ) : game.engine === "memory" ? (
          <MemoryEngine {...engineProps} />
        ) : game.engine === "building" ? (
          <BuildingEngine {...engineProps} />
        ) : game.engine === "magic-toys" ? (
          <MagicToysEngine {...engineProps} />
        ) : game.engine === "odd-one-out" ? (
          <OddOneOutEngine {...engineProps} />
        ) : game.engine === "pattern-next" ? (
          <PatternNextEngine {...engineProps} />
        ) : game.engine === "face-builder" ? (
          <FaceBuilderEngine {...engineProps} />
        ) : game.engine === "whats-missing" ? (
          <WhatsMissingEngine {...engineProps} />
        ) : game.engine === "situation-feelings" ? (
          <SituationFeelingsEngine {...engineProps} />
        ) : game.engine === "sound-memory" ? (
          <SoundMemoryEngine {...engineProps} />
        ) : game.engine === "listen" ? (
          <GenericEngine {...engineProps} />
        ) : (
          <GenericEngine {...engineProps} />
        )}

        <AnimatePresence>
          {celebrationVisible && child ? (
            <CelebrationOverlay
              childName={child.name}
              childAvatar={child.avatar}
              message={celebrationConfig.message}
              themes={celebrationConfig.themes}
              reward={rewardResult}
              independenceRate={lastMetrics?.independenceRate ?? null}
              onContinue={() => {
                setCelebrationVisible(false);
                onComplete();
              }}
            />
          ) : null}

          {breathingOpen ? (
            <BreathingOverlay onExit={closeBreathingBreak} />
          ) : null}

          {exitPrompt ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[55] grid place-items-center bg-slate-950/60 px-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.92, y: 12 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-xs rounded-3xl border border-border bg-card p-6 text-center shadow-2xl"
              >
                <p aria-hidden="true" className="mb-2 text-4xl">🤍</p>
                <h2 className="font-display text-lg font-bold text-foreground">Leave this game?</h2>
                <p className="mt-1 text-sm text-muted-foreground">This round will not be saved, and that is okay.</p>
                <div className="mt-5 flex flex-col gap-2">
                  <button
                    onClick={() => setExitPrompt(false)}
                    className="touch-target rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground"
                  >
                    Keep playing
                  </button>
                  <button
                    onClick={() => {
                      setExitPrompt(false);
                      logEvent("quit_mid_game", `after ${interactions} interactions`);
                      cancelSpeech();
                      onComplete();
                    }}
                    className="touch-target rounded-xl bg-muted px-4 py-3 font-semibold text-muted-foreground"
                  >
                    Leave now
                  </button>
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
