import { useState } from "react";
import { motion } from "framer-motion";
import { GameConfig } from "@/data/games";

interface Props {
  game: GameConfig;
  onInteraction: () => void;
  onComplete: (score: number, socialScore: number) => void;
}

interface Scenario {
  situation: string;
  options: { text: string; emoji: string; points: number; social: number }[];
}

const scenarioBank: Record<string, Scenario[]> = {
  greetings: [
    { situation: "You see your friend at school. What do you do?", options: [{ text: "Wave and say hi", emoji: "👋", points: 25, social: 3 }, { text: "Smile at them", emoji: "😊", points: 20, social: 2 }, { text: "Walk over and hug", emoji: "🤗", points: 25, social: 3 }, { text: "Keep walking", emoji: "🚶", points: 5, social: 0 }] },
    { situation: "A new kid joins your class. What do you do?", options: [{ text: "Introduce yourself", emoji: "🙋", points: 25, social: 3 }, { text: "Smile warmly", emoji: "😊", points: 20, social: 2 }, { text: "Show them around", emoji: "🏫", points: 25, social: 3 }, { text: "Wait for them to talk", emoji: "⏳", points: 10, social: 1 }] },
  ],
  sharing: [
    { situation: "You have extra snacks at lunch. What do you do?", options: [{ text: "Offer to share", emoji: "🤲", points: 25, social: 3 }, { text: "Ask who wants some", emoji: "🗣️", points: 25, social: 3 }, { text: "Eat them yourself", emoji: "😋", points: 5, social: 0 }, { text: "Save for later", emoji: "📦", points: 10, social: 1 }] },
    { situation: "Your friend wants to play with your toy. What do you do?", options: [{ text: "Let them play", emoji: "🧸", points: 25, social: 3 }, { text: "Take turns", emoji: "🔄", points: 25, social: 3 }, { text: "Play together", emoji: "👫", points: 25, social: 3 }, { text: "Say no", emoji: "🚫", points: 5, social: 0 }] },
  ],
  "sharing toys": [
    { situation: "A classmate asks to use your toy car. What works best?", options: [{ text: "Say yes and share it", emoji: "🚗", points: 25, social: 3 }, { text: "Offer a turn after you", emoji: "🔄", points: 25, social: 3 }, { text: "Play together", emoji: "🧩", points: 25, social: 3 }, { text: "Hide the toy", emoji: "🙈", points: 5, social: 0 }] },
    { situation: "There is one puzzle and two kids. What should you do?", options: [{ text: "Build it together", emoji: "🧩", points: 25, social: 3 }, { text: "Take turns with pieces", emoji: "🤝", points: 25, social: 3 }, { text: "Ask an adult to help share", emoji: "🙋", points: 20, social: 2 }, { text: "Grab all the pieces", emoji: "🏃", points: 5, social: 0 }] },
  ],
  "waiting for turn": [
    { situation: "You are next for the slide, but someone is still going. What do you do?", options: [{ text: "Wait behind the line", emoji: "⏳", points: 25, social: 3 }, { text: "Count quietly while waiting", emoji: "🔢", points: 20, social: 2 }, { text: "Cheer for your friend", emoji: "👏", points: 25, social: 3 }, { text: "Push ahead", emoji: "🏃", points: 5, social: 0 }] },
    { situation: "It is circle time and another child is speaking. What should you do?", options: [{ text: "Raise your hand and wait", emoji: "✋", points: 25, social: 3 }, { text: "Listen with your body still", emoji: "👂", points: 25, social: 3 }, { text: "Take a deep breath", emoji: "🌬️", points: 20, social: 2 }, { text: "Shout your answer", emoji: "📣", points: 5, social: 0 }] },
  ],
  "waiting patiently": [
    { situation: "A friend is using the swing you want. What do you do?", options: [{ text: "Wait and watch", emoji: "🙂", points: 25, social: 3 }, { text: "Ask when it will be your turn", emoji: "💬", points: 20, social: 2 }, { text: "Choose another activity for now", emoji: "🛝", points: 20, social: 2 }, { text: "Cut in line", emoji: "🚫", points: 5, social: 0 }] },
    { situation: "Snack is almost ready. What helps while you wait?", options: [{ text: "Sit calmly", emoji: "🪑", points: 25, social: 3 }, { text: "Sing quietly", emoji: "🎵", points: 20, social: 2 }, { text: "Ask once, then wait", emoji: "🙋", points: 20, social: 2 }, { text: "Grab food early", emoji: "🏃", points: 5, social: 0 }] },
  ],
  "expressing feelings": [
    { situation: "Your tower falls down. What can you say?", options: [{ text: "I feel upset", emoji: "😟", points: 25, social: 3 }, { text: "Can you help me?", emoji: "🆘", points: 25, social: 3 }, { text: "I need a break", emoji: "🛋️", points: 20, social: 2 }, { text: "Throw the blocks", emoji: "🧱", points: 5, social: 0 }] },
    { situation: "A game is too hard. What is a good choice?", options: [{ text: "Ask for help", emoji: "🙋", points: 25, social: 3 }, { text: "Use calm words", emoji: "💬", points: 25, social: 3 }, { text: "Take a breath", emoji: "🌬️", points: 20, social: 2 }, { text: "Yell at everyone", emoji: "📣", points: 5, social: 0 }] },
  ],
  "expressing anger": [
    { situation: "You feel angry because the game ended. What should you do first?", options: [{ text: "Say I feel mad", emoji: "😠", points: 25, social: 3 }, { text: "Take deep breaths", emoji: "🌬️", points: 25, social: 3 }, { text: "Ask for a break", emoji: "✋", points: 20, social: 2 }, { text: "Hit the table", emoji: "💥", points: 5, social: 0 }] },
    { situation: "Someone takes your turn. What is the best response?", options: [{ text: "Use calm words", emoji: "💬", points: 25, social: 3 }, { text: "Ask an adult for help", emoji: "🙋", points: 20, social: 2 }, { text: "Count to five", emoji: "5️⃣", points: 20, social: 2 }, { text: "Grab it back", emoji: "🏃", points: 5, social: 0 }] },
  ],
  default: [
    { situation: "Someone drops their books. What do you do?", options: [{ text: "Help pick them up", emoji: "📚", points: 25, social: 3 }, { text: "Ask if they are OK", emoji: "❓", points: 20, social: 2 }, { text: "Both help and ask", emoji: "🌟", points: 25, social: 3 }, { text: "Walk past", emoji: "🚶", points: 5, social: 0 }] },
    { situation: "Your friend looks sad. What do you do?", options: [{ text: "Ask what's wrong", emoji: "💬", points: 25, social: 3 }, { text: "Sit with them", emoji: "🪑", points: 25, social: 3 }, { text: "Give them a drawing", emoji: "🎨", points: 20, social: 2 }, { text: "Leave them alone", emoji: "🚶", points: 10, social: 1 }] },
    { situation: "It is time to line up. What do you do?", options: [{ text: "Wait your turn", emoji: "⏳", points: 25, social: 3 }, { text: "Help others line up", emoji: "🤝", points: 25, social: 3 }, { text: "Talk to the person next to you quietly", emoji: "💬", points: 20, social: 2 }, { text: "Push ahead", emoji: "🏃", points: 5, social: 0 }] },
    { situation: "Someone made a nice picture. What do you say?", options: [{ text: "That looks great", emoji: "🌟", points: 25, social: 3 }, { text: "I like the colors", emoji: "🎨", points: 25, social: 3 }, { text: "Can I see?", emoji: "👀", points: 20, social: 2 }, { text: "Nothing", emoji: "😶", points: 5, social: 0 }] },
  ],
};

export default function SocialEngine({ game, onInteraction, onComplete }: Props) {
  const theme = String(game.config.theme || "default");
  const scenarios = scenarioBank[theme] || scenarioBank.default;
  const [current, setCurrent] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [totalSocial, setTotalSocial] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const scenario = scenarios[current];

  const handleChoice = (option: { points: number; social: number }) => {
    onInteraction();
    const nextScore = totalScore + option.points;
    const nextSocial = totalSocial + option.social;

    setTotalScore(nextScore);
    setTotalSocial(nextSocial);
    setFeedback(option.social >= 2 ? "🌟 Great choice!" : option.social >= 1 ? "👍 Good try!" : "🤔 Think about how they might feel.");

    window.setTimeout(() => {
      setFeedback(null);
      if (current + 1 >= scenarios.length) {
        const pct = Math.round((nextScore / (scenarios.length * 25)) * 100);
        const socialPct = Math.round((nextSocial / (scenarios.length * 3)) * 10);
        onComplete(pct, socialPct);
      } else {
        setCurrent((value) => value + 1);
      }
    }, 1500);
  };

  if (!scenario) return null;

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-2 text-center">
        <p className="text-xs text-muted-foreground">
          {current + 1} of {scenarios.length}
        </p>
      </div>

      <div className="mb-4 rounded-2xl border border-border bg-card p-6">
        <p className="text-center font-display text-xl font-bold text-foreground">{scenario.situation}</p>
      </div>

      {feedback ? (
        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center">
          <p className="text-4xl">{feedback}</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {scenario.options.map((option) => (
            <motion.button
              key={`${scenario.situation}-${option.text}`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleChoice(option)}
              className="touch-target rounded-xl border-2 border-border bg-card p-4 text-center transition-colors hover:border-primary"
            >
              <span className="mb-2 block text-3xl">{option.emoji}</span>
              <span className="text-sm font-semibold text-foreground">{option.text}</span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
