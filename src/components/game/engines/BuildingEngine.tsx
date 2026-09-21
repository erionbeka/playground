import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GameConfig } from "@/data/games";
import { getAdaptiveGameConfig } from "@/lib/gameProgression";
import { speak } from "@/lib/speech";
import { BurstLayer, ComboBadge, useBursts } from "../Juice";
import { useGameAudio } from "../useGameAudio";
import { buildCompletionMetrics, GameCompletionMetrics, masteryForSupport, withTrace } from "../gameCompletion";
import { createSessionRecorder } from "@/lib/gameAnalytics";
import { getBuildPieceOptions, getBuildTemplate } from "./buildingLogic";

interface Props {
  game: GameConfig;
  onInteraction: () => void;
  onComplete: (score: number, socialScore?: number, metrics?: GameCompletionMetrics) => void;
}

const pieceAliases: Record<string, string> = {
  "[]": "cube",
  "/\\": "prism",
  "\\/": "prism",
  "||": "column",
  "=": "plank",
  "o": "sphere",
  "*": "sphere",
  "^": "prism",
  "<>": "diamond",
  "->": "wedge",
  T: "column",
  X: "cross",
  A: "letter",
  "+": "cross",
};

const pieceMeta: Record<string, { label: string; hint: string; className: string; form: "cube" | "sphere" | "cylinder" | "prism" | "plank" | "arch" | "wedge" | "flat" }> = {
  cube: { label: "Cube", hint: "equal faces", className: "froebel-cube", form: "cube" },
  prism: { label: "Roof Prism", hint: "slope and peak", className: "froebel-prism", form: "prism" },
  plank: { label: "Long Plank", hint: "bridge and balance", className: "froebel-plank", form: "plank" },
  column: { label: "Column", hint: "upright support", className: "froebel-column", form: "cylinder" },
  sphere: { label: "Sphere", hint: "rolls and turns", className: "froebel-sphere", form: "sphere" },
  arch: { label: "Arch", hint: "opening and curve", className: "froebel-arch", form: "arch" },
  diamond: { label: "Diamond", hint: "mirror angles", className: "froebel-diamond", form: "flat" },
  wedge: { label: "Wedge", hint: "direction and motion", className: "froebel-wedge", form: "wedge" },
  cross: { label: "Cross Joiner", hint: "two paths meet", className: "froebel-cross", form: "flat" },
  letter: { label: "Symbol Tile", hint: "mark and meaning", className: "froebel-letter", form: "flat" },
};

interface ShapeBuildConfig {
  scene?: string;
  template?: string[];
  pieceOptions?: string[];
  objective?: string;
  modelLabel?: string;
  supportLevel?: "high" | "moderate" | "light";
}

function normalizePiece(piece: string) {
  return pieceAliases[piece] || piece.toLowerCase().replace(/\s+/g, "-");
}

function getMeta(piece: string) {
  return pieceMeta[normalizePiece(piece)] || pieceMeta.cube;
}

function PieceObject({ piece, ghost = false, active = false }: { piece: string; ghost?: boolean; active?: boolean }) {
  const meta = getMeta(piece);

  return (
    <div className={`froebel-object ${meta.className} ${ghost ? "opacity-35 grayscale" : ""} ${active ? "froebel-object-active" : ""}`}>
      <span className="sr-only">{meta.label}</span>
      {meta.form === "flat" ? <span className="text-sm font-black">{meta.label.slice(0, 1)}</span> : null}
    </div>
  );
}

export default function BuildingEngine({ game, onInteraction, onComplete }: Props) {
  const config = game.config as ShapeBuildConfig;
  const { difficulty, supportLevel, readinessStage } = getAdaptiveGameConfig(game);
  const template = useMemo(() => getBuildTemplate(config), [config]);
  const pieceOptions = useMemo(() => {
    const options = getBuildPieceOptions(config, template);
    if (supportLevel === "high") {
      return Array.from(new Set([...template.slice(0, Math.min(template.length, 2)), ...options])).slice(0, Math.max(4, template.length));
    }
    if (supportLevel === "light") {
      return Array.from(new Set([...options, "cross", "wedge"]));
    }
    return options;
  }, [config, supportLevel, template]);

  const objective = config.objective || `Build the ${game.name.toLowerCase()}`;
  const modelLabel = config.modelLabel || game.name;
  const [placed, setPlaced] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [lastTry, setLastTry] = useState<"right" | "try-again" | null>(null);
  const [combo, setCombo] = useState(0);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const boardPanelRef = useRef<HTMLDivElement | null>(null);
  const comboRef = useRef(0);
  const { playHitSound, playMissSound } = useGameAudio();
  const { bursts, fireBurst } = useBursts();
  const rec = useMemo(() => createSessionRecorder(game.id), [game.id]);
  const nextExpected = template[placed.length];

  useEffect(() => {
    speak(`${objective}. ${modelLabel}. Choose the piece that comes next.`);
  }, [objective, modelLabel]);

  useEffect(() => {
    rec.mark();
  }, [placed.length, rec]);

  const handleSelectPiece = (piece: string) => {
    onInteraction();
    const meta = getMeta(piece);
    rec.trial({
      stimulus: `expected:${nextExpected}|chose:${piece}`,
      correct: piece === nextExpected,
      positionIndex: pieceOptions.indexOf(piece),
      choiceCount: pieceOptions.length,
      prompted: false,
    });
    if (piece === nextExpected) {
      comboRef.current += 1;
      setCombo(comboRef.current);
      playHitSound(comboRef.current);
      fireBurst(50, 45, "✨");
      speak(`${meta.label}. It fits!`);
      setLastTry("right");
      const nextPlaced = [...placed, piece];
      if (nextPlaced.length >= template.length) {
        const score = Math.max(60, 100 - mistakes * (difficulty === "hard" ? 14 : 12));
        onComplete(score, undefined, withTrace(rec, buildCompletionMetrics({
          trials: template.length,
          correctTrials: template.length,
          errors: mistakes,
          promptsNeeded: mistakes,
          masteryThreshold: masteryForSupport(supportLevel),
          attemptsBySkill: { planning: template.length + mistakes, "spatial-reasoning": template.length },
          observations: [
            `Built all ${template.length} pieces from the model.`,
            mistakes > 0 ? `Tried ${mistakes} wrong piece${mistakes === 1 ? "" : "s"} before finding the right solid${mistakes === 1 ? "" : "s"}.` : "Chose every piece correctly on the first try.",
          ],
        })));
        return;
      }
      setPlaced(nextPlaced);
      return;
    }

    comboRef.current = 0;
    setCombo(0);
    playMissSound();
    speak(`Not yet. Try a different solid.`);
    setLastTry("try-again");
    setMistakes((current) => current + 1);
  };

  return (
    <div ref={stageRef} className="relative mx-auto max-w-5xl froebel-stage px-2 py-4">
      <BurstLayer bursts={bursts} />
      <div className="mb-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-amber-900/10 bg-[linear-gradient(145deg,rgba(255,248,231,0.94),rgba(232,210,170,0.72))] p-5 shadow-[0_24px_80px_rgba(92,64,35,0.18)]"
        >
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-900/60">Build Studio</p>
          <h2 className="mt-2 font-display text-2xl font-black text-amber-950">{objective}</h2>
          <p className="mt-2 text-sm font-semibold text-amber-950/70">Copy the model, one solid piece at a time.</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs font-bold text-amber-950/70">
            <div className="rounded-2xl bg-white/55 p-3 shadow-inner">Step {placed.length + 1}/{template.length}</div>
            <div className="rounded-2xl bg-white/55 p-3 shadow-inner">{readinessStage === "stretch" ? "Challenge" : "Building"}</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-[2rem] border border-sky-900/10 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.95),rgba(199,229,222,0.8)_52%,rgba(135,170,155,0.55))] p-5 shadow-[0_24px_80px_rgba(28,76,93,0.16)]"
        >
          <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-950/55">Model Tray</p>
          <p className="mt-1 text-lg font-black text-sky-950">{modelLabel}</p>
          <div className="froebel-model-shelf mt-4">
            {template.map((piece, index) => (
              <div key={`model-${piece}-${index}`} className="froebel-model-cell">
                {supportLevel !== "light" || difficulty === "easy" ? <PieceObject piece={piece} /> : <PieceObject piece={piece} ghost />}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div ref={boardPanelRef} className="relative mb-5 rounded-[2rem] border border-stone-900/10 bg-[linear-gradient(160deg,#d3b88b,#9c7650)] p-4 shadow-[0_30px_90px_rgba(76,50,28,0.2)]">
        <ComboBadge combo={combo} />
        <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-950/60">Drag a piece here, or tap one below</p>
        <div className="froebel-board">
          {template.map((piece, index) => {
            const isFilled = index < placed.length;
            const isCurrent = index === placed.length;
            return (
              <motion.div
                key={`${piece}-${index}`}
                layout
                className={`froebel-slot ${isCurrent ? "froebel-slot-current" : ""}`}
              >
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-950/55">{isFilled ? "Placed" : isCurrent ? "Next" : "Later"}</span>
                <div className="mt-3 flex min-h-[92px] items-center justify-center">
                  {isFilled ? <PieceObject piece={piece} active /> : supportLevel === "high" || difficulty === "easy" ? <PieceObject piece={piece} ghost /> : <span className="text-3xl font-black text-amber-950/25">?</span>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="rounded-[2rem] border border-border bg-card/90 p-5 shadow-[0_20px_70px_rgba(40,35,25,0.1)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-black text-foreground">Choose the next solid</p>
          <span className={`rounded-full px-3 py-1 text-xs font-black ${lastTry === "right" ? "bg-emerald-100 text-emerald-800" : lastTry === "try-again" ? "bg-amber-100 text-amber-900" : "bg-muted text-muted-foreground"}`}>
            {lastTry === "right" ? "That fits" : lastTry === "try-again" ? "Try a different solid" : `${mistakes} mistakes`}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {pieceOptions.map((piece, index) => {
            const meta = getMeta(piece);
            const isNext = piece === nextExpected;
            return (
              <motion.button
                key={`${piece}-${index}`}
                whileHover={{ y: -7, rotateX: 8, rotateY: -10 }}
                whileTap={{ scale: 0.94 }}
                whileDrag={{ scale: 1.18, zIndex: 50, rotate: -4 }}
                drag
                dragSnapToOrigin
                dragElastic={0.15}
                onDragEnd={(_, info) => {
                  const board = boardPanelRef.current;
                  if (!board) return;
                  const rect = board.getBoundingClientRect();
                  if (
                    info.point.x >= rect.left - 16 &&
                    info.point.x <= rect.right + 16 &&
                    info.point.y >= rect.top - 16 &&
                    info.point.y <= rect.bottom + 16
                  ) {
                    handleSelectPiece(piece);
                  }
                }}
                onClick={() => handleSelectPiece(piece)}
                className={`froebel-piece-button touch-target cursor-grab active:cursor-grabbing ${
                  supportLevel === "high" && isNext ? "ring-4 ring-amber-300/70" : ""
                }`}
                aria-label={`piece ${piece}`}
              >
                <PieceObject piece={piece} />
                <span className="mt-3 block text-xs font-black text-foreground">{meta.label}</span>
                <span className="mt-1 block text-[10px] font-semibold text-muted-foreground">{meta.hint}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
