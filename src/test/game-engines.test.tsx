import { ComponentType } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { allGames, GameConfig } from "@/data/games";
import { shuffleItems } from "@/lib/shuffle";
import PlaygroundEngine from "@/components/game/engines/PlaygroundEngine";
import MatchingEngine from "@/components/game/engines/MatchingEngine";
import SequenceEngine from "@/components/game/engines/SequenceEngine";
import SortingEngine from "@/components/game/engines/SortingEngine";
import TappingEngine from "@/components/game/engines/TappingEngine";
import SocialEngine from "@/components/game/engines/SocialEngine";
import RecognitionEngine from "@/components/game/engines/RecognitionEngine";
import CountingEngine from "@/components/game/engines/CountingEngine";
import MemoryEngine from "@/components/game/engines/MemoryEngine";
import BuildingEngine from "@/components/game/engines/BuildingEngine";
import MagicToysEngine from "@/components/game/engines/MagicToysEngine";
import OddOneOutEngine from "@/components/game/engines/OddOneOutEngine";
import PatternNextEngine from "@/components/game/engines/PatternNextEngine";
import FaceBuilderEngine from "@/components/game/engines/FaceBuilderEngine";
import WhatsMissingEngine from "@/components/game/engines/WhatsMissingEngine";
import SituationFeelingsEngine from "@/components/game/engines/SituationFeelingsEngine";
import SoundMemoryEngine from "@/components/game/engines/SoundMemoryEngine";
import GenericEngine from "@/components/game/engines/GenericEngine";
import { getBuildTemplate } from "@/components/game/engines/buildingLogic";

interface GameEngineProps {
  game: GameConfig;
  onInteraction: () => void;
  onComplete: (score: number, socialScore?: number, metrics?: unknown) => void;
}

const engineComponents: Record<string, ComponentType<GameEngineProps>> = {
  sandbox: PlaygroundEngine,
  slide: PlaygroundEngine,
  bench: PlaygroundEngine,
  matching: MatchingEngine,
  sequence: SequenceEngine,
  sorting: SortingEngine,
  tapping: TappingEngine,
  social: SocialEngine,
  building: BuildingEngine,
  recognition: RecognitionEngine,
  counting: CountingEngine,
  memory: MemoryEngine,
  "magic-toys": MagicToysEngine,
  "odd-one-out": OddOneOutEngine,
  "pattern-next": PatternNextEngine,
  "face-builder": FaceBuilderEngine,
  "whats-missing": WhatsMissingEngine,
  "situation-feelings": SituationFeelingsEngine,
  "sound-memory": SoundMemoryEngine,
  listen: GenericEngine,
};

const matchingEmojiSets: Record<string, string[]> = {
  animals: ["animals-dog", "animals-cat", "animals-rabbit", "animals-frog", "animals-fox", "animals-bear", "animals-koala", "animals-lion"],
  food: ["food-apple", "food-banana", "food-pizza", "food-ice-cream", "food-cake", "food-donut", "food-carrot", "food-grapes"],
  vehicles: ["vehicles-car", "vehicles-bus", "vehicles-rocket", "vehicles-plane", "vehicles-train", "vehicles-motorbike", "vehicles-bike", "vehicles-boat"],
  emotions: ["emotions-happy", "emotions-sad", "emotions-surprised", "emotions-angry", "emotions-loved", "emotions-tired", "emotions-excited", "emotions-laughing"],
  nature: ["nature-flower", "nature-sunflower", "nature-tree", "nature-leaf", "nature-rainbow", "nature-star", "nature-moon", "nature-sun"],
  clothes: ["clothes-shirt", "clothes-pants", "clothes-socks", "clothes-coat", "clothes-scarf", "clothes-dress", "clothes-shoes", "clothes-hat"],
  tools: ["tools-hammer", "tools-brush", "tools-wrench", "tools-ruler", "tools-spoon", "tools-pencil", "tools-scissors", "tools-tape"],
  music: ["music-guitar", "music-piano", "music-violin", "music-drum", "music-voice", "music-headphones", "music-note", "music-bell"],
  shapes: ["shapes-circle", "shapes-square", "shapes-triangle", "shapes-star", "shapes-diamond", "shapes-oval", "shapes-rectangle", "shapes-heart"],
  letters: ["letters-a", "letters-b", "letters-c", "letters-d", "letters-e", "letters-f", "letters-g", "letters-h"],
  numbers: ["numbers-one", "numbers-two", "numbers-three", "numbers-four", "numbers-five", "numbers-six", "numbers-seven", "numbers-eight"],
  colors: ["colors-red", "colors-blue", "colors-green", "colors-yellow", "colors-purple", "colors-orange", "colors-black", "colors-white"],
  textures: ["textures-soft", "textures-rough", "textures-smooth", "textures-bumpy", "textures-sticky", "textures-fuzzy", "textures-hard", "textures-wet"],
  seasons: ["seasons-spring", "seasons-summer", "seasons-autumn", "seasons-winter", "seasons-rain", "seasons-snow", "seasons-wind", "seasons-sun"],
  "body parts": ["body parts-hand", "body parts-foot", "body parts-eye", "body parts-ear", "body parts-nose", "body parts-mouth", "body parts-knee", "body parts-arm"],
  default: ["matching-red", "matching-blue", "matching-green", "matching-yellow", "matching-purple", "matching-orange", "matching-black", "matching-white"],
};

const recognitionTargets: Record<string, string[]> = {
  "red things": ["apple", "red car", "strawberry", "rose"],
  "blue things": ["blue block", "fish", "blue dot"],
  "round objects": ["ball", "circle", "cookie"],
  "square objects": ["square", "tile", "box"],
  "learn animals": ["dog", "cat", "frog", "rabbit"],
  "learn emotions": ["happy", "surprised", "sad", "angry"],
  "learn colors": ["red", "blue", "green"],
  "learn shapes": ["triangle", "square", "star"],
  default: ["star"],
};

const sortingItemMap: Record<string, string[]> = {
  farm: ["🐄", "🐑", "🐓", "🚜"],
  city: ["🏙️", "🚕", "🚦", "🏢"],
};

function normalizeCategory(value: string) {
  return value.toLowerCase().replace(/\s+/g, "-");
}

async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

function renderGame(game: GameConfig, onComplete = vi.fn()) {
  const Engine = engineComponents[game.engine];
  const utils = render(<Engine game={game} onInteraction={vi.fn()} onComplete={onComplete} />);
  return { ...utils, onComplete };
}

function getMatchingDeck(game: GameConfig) {
  const pairs = Number(game.config.pairs || 4);
  const theme = String(game.config.theme || "default");
  const emojis = matchingEmojiSets[theme] || matchingEmojiSets.default;
  return shuffleItems([...emojis.slice(0, pairs), ...emojis.slice(0, pairs)]);
}

async function playGame(game: GameConfig, onComplete: ReturnType<typeof vi.fn>, container: HTMLElement) {
  switch (game.engine) {
    case "sandbox":
    case "slide":
    case "bench": {
      let safety = 0;
      while (!onComplete.mock.calls.length && safety < 12) {
        const buttons = screen.getAllByRole("button");
        fireEvent.click(buttons[buttons.length - 1]);
        safety += 1;
      }
      break;
    }
    case "building": {
      const template = getBuildTemplate(game.config as { scene?: string; template?: string[] });
      for (const piece of template) {
        fireEvent.click(screen.getByRole("button", { name: `piece ${piece}` }));
      }
      break;
    }
    case "matching": {
      const deck = getMatchingDeck(game);
      const pairs = new Map<string, number[]>();
      deck.forEach((emoji, index) => {
        pairs.set(emoji, [...(pairs.get(emoji) || []), index]);
      });

      for (const indexes of pairs.values()) {
        const [first, second] = indexes;
        const buttons = Array.from(container.querySelectorAll("button")) as HTMLButtonElement[];
        fireEvent.click(buttons[first]);
        fireEvent.click(buttons[second]);
        await advance(600);
      }
      break;
    }
    case "sequence": {
      const length = Number(game.config.length || game.config.steps || 4);
      let buttons = screen.queryAllByRole("button");
      let safety = 0;
      while (buttons.length === 0 && safety < 12) {
        await advance(700);
        buttons = screen.queryAllByRole("button");
        safety += 1;
      }
      expect(buttons.length).toBeGreaterThan(0);
      for (let index = 0; index < length; index += 1) {
        fireEvent.click(buttons[index % buttons.length]);
      }
      break;
    }
    case "sorting": {
      let safety = 0;
      while (!onComplete.mock.calls.length && safety < 16) {
        fireEvent.click(screen.getAllByRole("button")[0]);
        safety += 1;
      }
      break;
    }
    case "tapping": {
      await advance(31000);
      break;
    }
    case "social": {
      let safety = 0;
      while (!onComplete.mock.calls.length && safety < 8) {
        fireEvent.click(screen.getAllByRole("button")[0]);
        await advance(1600);
        safety += 1;
      }
      break;
    }
    case "recognition": {
      for (const button of screen.getAllByRole("button")) {
        if (onComplete.mock.calls.length) break;
        fireEvent.click(button);
      }
      break;
    }
    case "counting": {
      fireEvent.click(screen.getAllByRole("button")[0]);
      await advance(600);
      break;
    }
    case "memory": {
      await advance(2000);
      fireEvent.click(screen.getAllByRole("button")[0]);
      break;
    }
    case "magic-toys": {
      for (const button of screen.getAllByRole("button")) {
        if (onComplete.mock.calls.length) break;
        fireEvent.click(button);
      }
      break;
    }
    case "odd-one-out":
    case "pattern-next":
    case "face-builder":
    case "situation-feelings":
    case "listen": {
      let safety = 0;
      while (!onComplete.mock.calls.length && safety < 40) {
        for (const button of screen.getAllByRole("button")) {
          if (onComplete.mock.calls.length) break;
          fireEvent.click(button);
        }
        safety += 1;
      }
      break;
    }
    case "sound-memory": {
      let safety = 0;
      while (!onComplete.mock.calls.length && safety < 80) {
        await advance(1400);
        for (const button of screen.getAllByRole("button")) {
          if (onComplete.mock.calls.length) break;
          fireEvent.click(button);
          await advance(40);
        }
        safety += 1;
      }
      break;
    }
    case "whats-missing": {
      let safety = 0;
      while (!onComplete.mock.calls.length && safety < 14) {
        await advance(3600);
        for (const button of screen.getAllByRole("button")) {
          if (onComplete.mock.calls.length) break;
          fireEvent.click(button);
        }
        safety += 1;
      }
      break;
    }
    default:
      throw new Error(`Unhandled engine ${game.engine}`);
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(Math, "random").mockReturnValue(0);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("game engine smoke coverage", () => {
  for (const game of allGames) {
    it(`completes ${game.id} ${game.name}`, async () => {
      const { container, onComplete } = renderGame(game);
      await playGame(game, onComplete, container);
      expect(onComplete).toHaveBeenCalled();
    });
  }
});

describe("regressions", () => {
  it("recognition games expose an educational target and teaching rule", () => {
    const recognitionGames = allGames.filter((game) => game.engine === "recognition");

    for (const game of recognitionGames) {
      const { unmount } = renderGame(game);
      expect(screen.getByText(/Find \d+ correct item/i)).toBeInTheDocument();
      expect(
        screen.getAllByText(/recognition|matching|vocabulary|awareness|symmetry|pattern|discrimination|generalization|knowledge|planning/i).length,
      ).toBeGreaterThan(0);
      unmount();
    }
  });

  it("generated social, language, and emotion games teach the named theme", () => {
    const generatedGames = allGames.filter((game) => game.engine === "social" && !["greetings", "sharing"].includes(String(game.config.theme || "")));

    for (const game of generatedGames.slice(0, 20)) {
      const { unmount } = renderGame(game);
      expect(screen.getByText(new RegExp(`Practice: ${String(game.config.theme || "").replace(/-/g, " ")}`, "i"))).toBeInTheDocument();
      unmount();
    }
  });

  it("building catalog scenes use scene-specific templates instead of one generic model", () => {
    const sceneGames = allGames.filter((game) => game.engine === "building" && game.config.scene);
    const templates = new Set(sceneGames.map((game) => getBuildTemplate(game.config as { scene?: string; template?: string[] }).join("|")));

    expect(templates.size).toBeGreaterThan(5);
  });

  it("core cognitive games show their learning purpose before play", () => {
    const matchingGame = allGames.find((game) => game.engine === "matching" && game.config.theme === "colors");
    const memoryGame = allGames.find((game) => game.engine === "memory" && game.config.theme === "words");
    const sequenceGame = allGames.find((game) => game.engine === "sequence" && game.config.theme === "daily routine");

    expect(matchingGame).toBeDefined();
    expect(memoryGame).toBeDefined();
    expect(sequenceGame).toBeDefined();

    const matching = renderGame(matchingGame as GameConfig);
    expect(screen.getByText(/Vocabulary matching/i)).toBeInTheDocument();
    expect(screen.getByText(/Look, say the word/i)).toBeInTheDocument();
    matching.unmount();

    const memory = renderGame(memoryGame as GameConfig);
    expect(screen.getByText(/Working memory/i)).toBeInTheDocument();
    expect(screen.getByText(/Say the name quietly/i)).toBeInTheDocument();
    memory.unmount();

    const sequence = renderGame(sequenceGame as GameConfig);
    expect(screen.getByText(/Pattern and routine sequencing/i)).toBeInTheDocument();
    expect(screen.getByText(/Watch the order/i)).toBeInTheDocument();
    sequence.unmount();
  });

  it("recognition games complete after finding only the intended answers", () => {
    const game: GameConfig = {
      id: "recognition-round",
      name: "Round Objects",
      emoji: "o",
      category: "colors-shapes",
      engine: "recognition",
      description: "",
      skills: [],
      difficulty: "easy",
      estimatedMinutes: 1,
      supportsShared: false,
      supportsMultiplayer: false,
      config: { theme: "round objects" },
    };

    const onComplete = vi.fn();
    renderGame(game, onComplete);

    for (const token of recognitionTargets["round objects"]) {
      fireEvent.click(screen.getByRole("button", { name: token }));
    }

    expect(onComplete).toHaveBeenCalledWith(
      100,
      undefined,
      expect.objectContaining({
        completedSuccessfully: true,
        accuracy: 100,
        correctTrials: recognitionTargets["round objects"].length,
        errors: 0,
      }),
    );
  });

  it("sorting keeps a stable deck order while the player advances", () => {
    const game: GameConfig = {
      id: "sorting-stable",
      name: "Sort Farm vs City",
      emoji: "o",
      category: "sorting",
      engine: "sorting",
      description: "",
      skills: [],
      difficulty: "easy",
      estimatedMinutes: 1,
      supportsShared: false,
      supportsMultiplayer: false,
      config: { categories: ["Farm", "City"] },
    };

    const expected = shuffleItems(
      ["farm", "city"].flatMap((category) => sortingItemMap[category])
    );
    const onComplete = vi.fn();
    renderGame(game, onComplete);

    for (const emoji of expected) {
      expect(screen.getByText(emoji)).toBeInTheDocument();
      fireEvent.click(screen.getAllByRole("button", { name: /Farm|City/ })[0]);
    }

    expect(onComplete).toHaveBeenCalled();
  });

  it("tapping games spawn visible targets before the countdown ends", async () => {
    const game: GameConfig = {
      id: "tap-bubbles",
      name: "Tap Bubbles",
      emoji: "👆",
      category: "motor-skills",
      engine: "tapping",
      description: "",
      skills: [],
      difficulty: "easy",
      estimatedMinutes: 1,
      supportsShared: false,
      supportsMultiplayer: false,
      config: { theme: "bubbles", speed: "medium" },
    };

    renderGame(game);

    await advance(50);

    expect(screen.getAllByRole("button", { name: "bubbles target" }).length).toBeGreaterThan(0);
  });

  it("building shape games require the next correct piece", () => {
    const game: GameConfig = {
      id: "shape-build",
      name: "Build a Triangle",
      emoji: "[]",
      category: "building",
      engine: "building",
      description: "",
      skills: [],
      difficulty: "easy",
      estimatedMinutes: 1,
      supportsShared: true,
      supportsMultiplayer: false,
      config: { template: ["/\\", "[]", "/\\"], pieceOptions: ["/\\", "[]", "o"] },
    };

    const onComplete = vi.fn();
    renderGame(game, onComplete);

    fireEvent.click(screen.getByRole("button", { name: "piece o" }));
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "piece /\\" }));
    fireEvent.click(screen.getByRole("button", { name: "piece []" }));
    fireEvent.click(screen.getByRole("button", { name: "piece /\\" }));

    expect(onComplete).toHaveBeenCalled();
  });
});
