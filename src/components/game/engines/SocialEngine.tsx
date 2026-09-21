import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GameConfig } from "@/data/games";
import { getAdaptiveGameConfig } from "@/lib/gameProgression";
import { speak } from "@/lib/speech";
import { praise } from "@/lib/praise";
import { BurstLayer, ComboBadge, useBursts, useWobble } from "../Juice";
import { useGameAudio } from "../useGameAudio";
import { buildCompletionMetrics, GameCompletionMetrics, masteryForSupport, withTrace } from "../gameCompletion";
import { createSessionRecorder } from "@/lib/gameAnalytics";

interface Props {
  game: GameConfig;
  onInteraction: () => void;
  onComplete: (score: number, socialScore?: number, metrics?: GameCompletionMetrics) => void;
}

interface Scenario {
  situation: string;
  options: { text: string; points: number; social: number }[];
}

const scenarioBank: Record<string, Scenario[]> = {
  greetings: [
    { situation: "You see your friend at school. What do you do?", options: [{ text: "Wave and say hi", points: 25, social: 3 }, { text: "Smile at them", points: 20, social: 2 }, { text: "Walk over and hug", points: 25, social: 3 }, { text: "Keep walking", points: 5, social: 0 }] },
    { situation: "A new kid joins your class. What do you do?", options: [{ text: "Introduce yourself", points: 25, social: 3 }, { text: "Smile warmly", points: 20, social: 2 }, { text: "Show them around", points: 25, social: 3 }, { text: "Wait for them to talk", points: 10, social: 1 }] },
  ],
  sharing: [
    { situation: "You have extra snacks at lunch. What do you do?", options: [{ text: "Offer to share", points: 25, social: 3 }, { text: "Ask who wants some", points: 25, social: 3 }, { text: "Eat them yourself", points: 5, social: 0 }, { text: "Save for later", points: 10, social: 1 }] },
    { situation: "Your friend wants to play with your toy. What do you do?", options: [{ text: "Let them play", points: 25, social: 3 }, { text: "Take turns", points: 25, social: 3 }, { text: "Play together", points: 25, social: 3 }, { text: "Say no", points: 5, social: 0 }] },
  ],
  default: [
    { situation: "Someone drops their books. What do you do?", options: [{ text: "Help pick them up", points: 25, social: 3 }, { text: "Ask if they are OK", points: 20, social: 2 }, { text: "Both help and ask", points: 25, social: 3 }, { text: "Walk past", points: 5, social: 0 }] },
    { situation: "Your friend looks sad. What do you do?", options: [{ text: "Ask what's wrong", points: 25, social: 3 }, { text: "Sit with them", points: 25, social: 3 }, { text: "Give them a drawing", points: 20, social: 2 }, { text: "Leave them alone", points: 10, social: 1 }] },
  ],
};

function sentenceCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function optionEmoji(text: string): string {
  const lowered = text.toLowerCase();
  if (lowered.includes("wave") || lowered.includes("hello") || lowered.includes("gesture")) return "👋";
  if (lowered.includes("smile")) return "😊";
  if (lowered.includes("introduce") || lowered.includes("show them")) return "🧑‍🤝‍🧑";
  if (lowered.includes("share") || lowered.includes("snack")) return "🍪";
  if (lowered.includes("turn") || lowered.includes("together") || lowered.includes("play")) return "🎲";
  if (lowered.includes("ask") || lowered.includes("?")) return "❓";
  if (lowered.includes("help")) return "🤲";
  if (lowered.includes("drawing") || lowered.includes("picture")) return "🖍️";
  if (lowered.includes("talk") || lowered.includes("chat") || lowered.includes("sentence") || lowered.includes("word") || lowered.includes("voice")) return "💬";
  if (lowered.includes("wait") || lowered.includes("listen") || lowered.includes("quiet") || lowered.includes("sit with")) return "👂";
  if (lowered.includes("breath") || lowered.includes("calm")) return "🌬️";
  if (lowered.includes("break")) return "🧘";
  if (lowered.includes("adult") || lowered.includes("tell")) return "🧑‍🏫";
  if (lowered.includes("space") || lowered.includes("walk") || lowered.includes("leave")) return "🚶";
  if (lowered.includes("no ") || lowered === "say no" || lowered.includes("ignore") || lowered.includes("push") || lowered.includes("grab") || lowered.includes("give up") || lowered.includes("silent") || lowered.includes("stay")) return "🙅";
  if (lowered.includes("laugh")) return "😅";
  if (lowered.includes("hug")) return "🤗";
  if (lowered.includes("try again") || lowered.includes("slower")) return "🔁";
  if (lowered.includes("small step") || lowered.includes("point")) return "1️⃣";
  if (lowered.includes("kind")) return "💗";
  return "💬";
}

function buildGeneratedScenarios(theme: string, category: string): Scenario[] {
  const label = sentenceCase(theme.replace(/-/g, " "));

  if (category === "language") {
    return [
      {
        situation: `You want to practice ${label.toLowerCase()}. What helps you use clear words?`,
        options: [
          { text: "Say one clear sentence", points: 25, social: 3 },
          { text: "Point and add a word", points: 20, social: 2 },
          { text: "Ask for help", points: 20, social: 2 },
          { text: "Stay silent", points: 5, social: 0 },
        ],
      },
      {
        situation: `A friend does not understand your ${label.toLowerCase()} message. What can you do?`,
        options: [
          { text: "Try again slower", points: 25, social: 3 },
          { text: "Use a gesture", points: 20, social: 2 },
          { text: "Choose a picture", points: 20, social: 2 },
          { text: "Give up", points: 5, social: 0 },
        ],
      },
    ];
  }

  if (category === "emotions" || theme.includes("feeling") || theme.includes("calm")) {
    return [
      {
        situation: `You notice a ${label.toLowerCase()} feeling in your body. What is a helpful first step?`,
        options: [
          { text: "Name the feeling", points: 25, social: 3 },
          { text: "Take a slow breath", points: 25, social: 3 },
          { text: "Ask for a break", points: 20, social: 2 },
          { text: "Push someone", points: 5, social: 0 },
        ],
      },
      {
        situation: `A friend looks ${label.toLowerCase()}. What can you do kindly?`,
        options: [
          { text: "Ask how they feel", points: 25, social: 3 },
          { text: "Give them space", points: 20, social: 2 },
          { text: "Tell an adult", points: 20, social: 2 },
          { text: "Laugh at them", points: 5, social: 0 },
        ],
      },
    ];
  }

  return [
    {
      situation: `You are practicing ${label.toLowerCase()} with another person. What is the best move?`,
      options: [
        { text: "Use kind words", points: 25, social: 3 },
        { text: "Wait and listen", points: 25, social: 3 },
        { text: "Ask what they need", points: 20, social: 2 },
        { text: "Ignore the other person", points: 5, social: 0 },
      ],
    },
    {
      situation: `The ${label.toLowerCase()} activity feels hard. What keeps the play going?`,
      options: [
        { text: "Try one small step", points: 25, social: 3 },
        { text: "Ask for a turn", points: 20, social: 2 },
        { text: "Use a calm voice", points: 20, social: 2 },
        { text: "Grab the toy", points: 5, social: 0 },
      ],
    },
  ];
}

export default function SocialEngine({ game, onInteraction, onComplete }: Props) {
  const { difficulty, supportLevel } = getAdaptiveGameConfig(game);
  const theme = String(game.config.theme || "default");
  const allScenarios = scenarioBank[theme] || buildGeneratedScenarios(theme, game.category);
  const scenarioCount = difficulty === "easy" || supportLevel === "high" ? 2 : Math.min(3, allScenarios.length);
  const scenarios = useMemo(() => allScenarios.slice(0, scenarioCount), [allScenarios, scenarioCount]);
  const [current, setCurrent] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [totalSocial, setTotalSocial] = useState(0);
  const [errors, setErrors] = useState(0);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const comboRef = useRef(0);
  const { playHitSound, playMissSound } = useGameAudio();
  const { bursts, fireBurst } = useBursts();
  const { controls, wobble } = useWobble();
  const rec = useMemo(() => createSessionRecorder(game.id), [game.id]);

  const scenario = scenarios[current];
  const visibleOptions = useMemo(
    () => (difficulty === "easy" || supportLevel === "high" ? scenario.options.filter((option) => option.social >= 1) : scenario.options),
    [difficulty, scenario?.options, supportLevel]
  );

  useEffect(() => {
    if (!scenario) return;
    speak(scenario.situation);
    rec.mark();
  }, [rec, scenario]);

  const handleChoice = (option: { points: number; social: number; text: string }) => {
    onInteraction();
    rec.trial({
      stimulus: `scenario-${current + 1}:${option.text}`,
      correct: option.social >= 2,
      positionIndex: visibleOptions.findIndex((entry) => entry.text === option.text),
      choiceCount: visibleOptions.length,
      prompted: false,
    });
    const nextScore = totalScore + option.points;
    const nextSocial = totalSocial + option.social;
    const nextErrors = errors + (option.social >= 2 ? 0 : 1);

    if (option.social >= 2) {
      comboRef.current += 1;
      setCombo(comboRef.current);
      playHitSound(comboRef.current);
      fireBurst(50, 40, optionEmoji(option.text));
      speak(option.social >= 2 ? "Great choice!" : "Good try!");
    } else {
      comboRef.current = 0;
      setCombo(0);
      wobble();
      playMissSound();
      speak(option.social >= 1 ? "Good try!" : "Let's try a kinder choice.");
    }

    setTotalScore(nextScore);
    setTotalSocial(nextSocial);
    setErrors(nextErrors);
    const praiseLine = option.social >= 2 ? praise("kind", comboRef.current) : option.social >= 1 ? "Good try!" : "Try a kinder choice.";
    setFeedback(praiseLine);
    speak(praiseLine);

    window.setTimeout(() => {
      setFeedback(null);
      if (current + 1 >= scenarios.length) {
        const pct = Math.round((nextScore / (scenarios.length * 25)) * 100);
        const socialPct = Math.round((nextSocial / (scenarios.length * 3)) * 10);
        onComplete(pct, socialPct, withTrace(rec, buildCompletionMetrics({
          trials: scenarios.length,
          correctTrials: scenarios.length - nextErrors,
          errors: nextErrors,
          masteryThreshold: masteryForSupport(supportLevel),
          attemptsBySkill: { "social-decision-making": scenarios.length, communication: nextSocial },
          observations: [`Completed ${scenarios.length} social scenarios for ${theme}.`],
        })));
      } else {
        setCurrent((value) => value + 1);
      }
    }, supportLevel === "high" ? 1800 : 1500);
  };

  if (!scenario) return null;

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-2 text-center">
        <p className="text-xs text-muted-foreground">
          {current + 1} of {scenarios.length}
        </p>
      </div>

      <div ref={boardRef} className="mb-4 rounded-2xl border border-border bg-card p-6 relative">
        <ComboBadge combo={combo} />
        <p className="mb-2 text-center text-xs font-black uppercase tracking-[0.18em] text-primary">Practice: {sentenceCase(theme)}</p>
        <p className="text-center font-display text-xl font-bold text-foreground">{scenario.situation}</p>
      </div>

      {feedback ? (
        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center">
          <p className="text-2xl font-semibold text-foreground">{feedback}</p>
        </motion.div>
      ) : (
        <motion.div animate={controls} className="relative grid grid-cols-2 gap-3">
          {visibleOptions.map((option) => (
            <motion.button
              key={`${scenario.situation}-${option.text}`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleChoice(option)}
              className="touch-target rounded-xl border-2 border-border bg-card p-4 text-center transition-colors hover:border-primary"
            >
              <span aria-hidden="true" className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-3xl ring-1 ring-primary/20">
                {optionEmoji(option.text)}
              </span>
              <span className="text-sm font-semibold text-foreground">{option.text}</span>
            </motion.button>
          ))}
          <BurstLayer bursts={bursts} />
        </motion.div>
      )}
    </div>
  );
}
