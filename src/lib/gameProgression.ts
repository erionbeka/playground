import { Difficulty, GameConfig } from "@/data/games";

export type SupportLevel = "high" | "moderate" | "light";
export type ReadinessStage = "stabilize" | "build" | "generalize" | "stretch";

export interface AdaptiveGameConfig {
  difficulty: Difficulty;
  supportLevel: SupportLevel;
  readinessStage: ReadinessStage;
  personalized: boolean;
}

export function getAdaptiveGameConfig(game: GameConfig): AdaptiveGameConfig {
  const personalized = Object.prototype.hasOwnProperty.call(game.config, "assignedDifficulty")
    || Object.prototype.hasOwnProperty.call(game.config, "supportLevel")
    || Object.prototype.hasOwnProperty.call(game.config, "readinessStage");
  return {
    difficulty: (game.config.assignedDifficulty as Difficulty | undefined) || game.difficulty,
    supportLevel: (game.config.supportLevel as SupportLevel | undefined) || "moderate",
    readinessStage: (game.config.readinessStage as ReadinessStage | undefined) || "build",
    personalized,
  };
}

export function difficultyToNumber(difficulty: Difficulty) {
  if (difficulty === "easy") return 0;
  if (difficulty === "medium") return 1;
  return 2;
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
