import { useState, useCallback, useEffect, useMemo } from "react";
import { useApp, HomeworkAssignment } from "@/context/AppContext";
import { getGameById } from "@/data/games";
import { AnimatePresence, motion } from "framer-motion";
import MatchingEngine from "./engines/MatchingEngine";
import TappingEngine from "./engines/TappingEngine";
import SocialEngine from "./engines/SocialEngine";
import GenericEngine from "./engines/GenericEngine";
import PlaygroundEngine from "./engines/PlaygroundEngine";
import SequenceEngine from "./engines/SequenceEngine";
import SortingEngine from "./engines/SortingEngine";
import RecognitionEngine from "./engines/RecognitionEngine";
import CountingEngine from "./engines/CountingEngine";
import MemoryEngine from "./engines/MemoryEngine";
import BuildingEngine from "./engines/BuildingEngine";
import CelebrationOverlay from "./CelebrationOverlay";
import { useGameAudio } from "./useGameAudio";
import { getChildReadinessState } from "@/lib/personalization";

interface Props {
  gameId: string;
  assignment: HomeworkAssignment;
  onComplete: () => void;
}

export default function GamePlayer({ gameId, assignment, onComplete }: Props) {
  const { completeGame, children, assignments } = useApp();
  const game = getGameById(gameId);
  const [started, setStarted] = useState(false);
  const [startTime] = useState(Date.now());
  const [interactions, setInteractions] = useState(0);
  const [celebrationVisible, setCelebrationVisible] = useState(false);
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
    () => game ? ({
      ...game,
      config: {
        ...game.config,
        assignedDifficulty: assignment.difficulty || game.difficulty,
        supportLevel: assignment.supportLevel || game.config.supportLevel || "moderate",
        readinessStage: readiness?.stage || "build",
      },
    }) : null,
    [assignment.difficulty, assignment.supportLevel, game, readiness?.stage]
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

  const handleGameComplete = useCallback(
    (score: number, socialScore?: number) => {
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      completeGame(assignment.id, {
        gameId,
        completedAt: new Date().toISOString().slice(0, 10),
        durationSeconds,
        score,
        interactions,
        socialScore,
      });
      setCelebrationVisible(true);
    },
    [assignment.id, completeGame, gameId, interactions, startTime]
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
          <div className="text-7xl mb-4 animate-bounce-gentle">{game.emoji}</div>
          <h1 className="font-display text-3xl font-extrabold text-foreground mb-2">{game.name}</h1>
          <p className="text-muted-foreground mb-6">{game.description}</p>
          <div className="mb-5 rounded-2xl border border-border bg-card p-4 text-left">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {game.ageRange ? (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-foreground">
                  Ages {game.ageRange.min}-{game.ageRange.max}
                </span>
              ) : null}
              <span className="rounded-full bg-secondary/20 px-3 py-1 text-xs font-semibold text-foreground capitalize">
                {game.difficulty}
              </span>
            </div>
            {game.learningGoal ? (
              <p className="text-sm font-semibold text-foreground">{game.learningGoal}</p>
            ) : null}
            {game.adultPrompt ? (
              <p className="mt-2 text-xs text-muted-foreground">Adult prompt: {game.adultPrompt}</p>
            ) : null}
            {game.autismSupports && game.autismSupports.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {game.autismSupports.slice(0, 4).map((support) => (
                  <span key={support} className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                    {support}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex gap-3 justify-center mb-6">
            {game.skills.map((s) => (
              <span key={s} className="text-xs bg-primary/10 text-foreground px-3 py-1 rounded-full capitalize">{s}</span>
            ))}
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={onComplete} className="px-6 py-3 bg-muted text-muted-foreground rounded-xl font-semibold touch-target">
              Back
            </button>
            <button
              onClick={() => {
                warmUpAudio();
                playStartSound();
                setStarted(true);
              }}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-display font-bold text-lg touch-target"
            >
              Start
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!runtimeGame) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-foreground">Game not found</p>
      </div>
    );
  }

  const engineProps = { game: runtimeGame, onInteraction: handleInteraction, onComplete: handleGameComplete };

  return (
    <div className="min-h-screen">
      <div className="bg-card/85 backdrop-blur-md border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{game.emoji}</span>
          <div>
            <span className="font-display font-bold text-foreground text-sm">{game.name}</span>
            {runtimeGame.learningGoal ? (
              <p className="hidden text-[10px] text-muted-foreground sm:block">{runtimeGame.learningGoal}</p>
            ) : null}
          </div>
        </div>
        <button onClick={onComplete} className="text-xs text-muted-foreground hover:text-foreground touch-target px-3">
          Exit
        </button>
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
              onContinue={() => {
                setCelebrationVisible(false);
                onComplete();
              }}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
