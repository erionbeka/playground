export type GameCategory =
  | "playground"
  | "matching"
  | "sequences"
  | "sorting"
  | "tapping"
  | "social"
  | "building"
  | "colors-shapes"
  | "counting"
  | "memory"
  | "emotions"
  | "language"
  | "motor"
  | "daily-living";

export type GameEngine =
  | "sandbox"
  | "slide"
  | "bench"
  | "matching"
  | "sequence"
  | "sorting"
  | "tapping"
  | "social"
  | "building"
  | "recognition"
  | "counting"
  | "memory";

export type Difficulty = "easy" | "medium" | "hard";

export interface GameConfig {
  id: string;
  name: string;
  emoji: string;
  category: GameCategory;
  engine: GameEngine;
  description: string;
  skills: string[];
  difficulty: Difficulty;
  estimatedMinutes: number;
  supportsShared: boolean;
  supportsMultiplayer: boolean;
  config: Record<string, unknown>;
}

const categoryMeta: Record<GameCategory, { label: string; emoji: string; color: string }> = {
  playground: { label: "Playground", emoji: "🏖️", color: "sky" },
  matching: { label: "Matching", emoji: "🧩", color: "lavender" },
  sequences: { label: "Sequences", emoji: "🔢", color: "coral" },
  sorting: { label: "Sorting", emoji: "📦", color: "mint" },
  tapping: { label: "Tapping", emoji: "👆", color: "sunshine" },
  social: { label: "Social", emoji: "🤝", color: "coral" },
  building: { label: "Building", emoji: "🏗️", color: "sky" },
  "colors-shapes": { label: "Colors & Shapes", emoji: "🎨", color: "lavender" },
  counting: { label: "Counting", emoji: "🔢", color: "mint" },
  memory: { label: "Memory", emoji: "🧠", color: "sunshine" },
  emotions: { label: "Emotions", emoji: "😊", color: "coral" },
  language: { label: "Language", emoji: "💬", color: "sky" },
  motor: { label: "Motor Skills", emoji: "✋", color: "mint" },
  "daily-living": { label: "Daily Living", emoji: "🏠", color: "lavender" },
};

export { categoryMeta };

function makeGames(): GameConfig[] {
  const games: GameConfig[] = [];
  let id = 1;
  const gid = () => `game-${String(id++).padStart(3, "0")}`;

  games.push(
    { id: gid(), name: "Sandy Shapes", emoji: "🏖️", category: "playground", engine: "sandbox", description: "Place colorful shapes in the sandbox", skills: ["creativity", "motor"], difficulty: "easy", estimatedMinutes: 5, supportsShared: true, supportsMultiplayer: true, config: { theme: "beach" } },
    { id: gid(), name: "Slide Fun", emoji: "🛝", category: "playground", engine: "slide", description: "Take turns going down the slide", skills: ["turn-taking", "patience"], difficulty: "easy", estimatedMinutes: 3, supportsShared: true, supportsMultiplayer: true, config: { speed: "slow" } },
    { id: gid(), name: "Bench Buddies", emoji: "🪑", category: "playground", engine: "bench", description: "Practice social choices at the park bench", skills: ["social", "choices"], difficulty: "easy", estimatedMinutes: 4, supportsShared: true, supportsMultiplayer: true, config: { scenarios: 5 } },
    { id: gid(), name: "Swing Together", emoji: "🎠", category: "playground", engine: "sandbox", description: "Coordinate swinging rhythms together", skills: ["coordination", "rhythm"], difficulty: "medium", estimatedMinutes: 4, supportsShared: true, supportsMultiplayer: true, config: { theme: "swings" } },
    { id: gid(), name: "See-Saw Balance", emoji: "⚖️", category: "playground", engine: "sandbox", description: "Balance the see-saw with a friend", skills: ["cooperation", "physics"], difficulty: "medium", estimatedMinutes: 5, supportsShared: true, supportsMultiplayer: true, config: { theme: "seesaw" } },
  );

  const matchThemes = ["Animals", "Food", "Vehicles", "Emotions", "Nature", "Clothes", "Tools", "Music", "Shapes", "Letters", "Numbers", "Colors", "Textures", "Seasons", "Body Parts"];
  matchThemes.forEach((theme, index) => {
    games.push({
      id: gid(),
      name: `Match ${theme}`,
      emoji: "🧩",
      category: "matching",
      engine: "matching",
      description: `Find matching pairs of ${theme.toLowerCase()}`,
      skills: ["memory", "attention"],
      difficulty: index < 5 ? "easy" : index < 10 ? "medium" : "hard",
      estimatedMinutes: 4,
      supportsShared: true,
      supportsMultiplayer: true,
      config: { theme: theme.toLowerCase(), pairs: index < 5 ? 4 : index < 10 ? 6 : 8 },
    });
  });

  const seqThemes = ["Colors", "Shapes", "Sounds", "Animals", "Numbers", "Patterns", "Dance Moves", "Musical Notes", "Emotions", "Actions", "Vehicles", "Foods", "Seasons", "Daily Routine", "Story Order"];
  seqThemes.forEach((theme, index) => {
    games.push({
      id: gid(),
      name: `${theme} Sequence`,
      emoji: "🔢",
      category: "sequences",
      engine: "sequence",
      description: `Watch and repeat the ${theme.toLowerCase()} pattern`,
      skills: ["memory", "sequencing"],
      difficulty: index < 5 ? "easy" : index < 10 ? "medium" : "hard",
      estimatedMinutes: 5,
      supportsShared: false,
      supportsMultiplayer: false,
      config: { theme: theme.toLowerCase(), length: index < 5 ? 3 : index < 10 ? 4 : 5 },
    });
  });

  const sortThemes = ["Farm vs City", "Hot vs Cold", "Big vs Small", "Living vs Non-living", "Day vs Night", "Healthy vs Unhealthy", "Land vs Water", "Loud vs Quiet", "Soft vs Hard", "Fast vs Slow", "Indoor vs Outdoor", "Happy vs Sad", "Sink vs Float", "Wild vs Domestic", "Fruits vs Vegetables"];
  sortThemes.forEach((theme, index) => {
    games.push({
      id: gid(),
      name: `Sort: ${theme}`,
      emoji: "📦",
      category: "sorting",
      engine: "sorting",
      description: `Sort items into ${theme} categories`,
      skills: ["categorization", "cognitive"],
      difficulty: index < 5 ? "easy" : index < 10 ? "medium" : "hard",
      estimatedMinutes: 5,
      supportsShared: true,
      supportsMultiplayer: true,
      config: { categories: theme.split(" vs "), items: 8 },
    });
  });

  const tapThemes = ["Butterflies", "Bubbles", "Stars", "Fish", "Balloons", "Fireflies", "Leaves", "Snowflakes", "Raindrops", "Birds", "Ladybugs", "Flowers", "Jellyfish", "Rockets", "Clouds"];
  tapThemes.forEach((theme, index) => {
    games.push({
      id: gid(),
      name: `Tap ${theme}`,
      emoji: "👆",
      category: "tapping",
      engine: "tapping",
      description: `Tap the ${theme.toLowerCase()} as they appear`,
      skills: ["motor", "reaction", "attention"],
      difficulty: index < 5 ? "easy" : index < 10 ? "medium" : "hard",
      estimatedMinutes: 3,
      supportsShared: false,
      supportsMultiplayer: true,
      config: { theme: theme.toLowerCase(), speed: index < 5 ? "slow" : index < 10 ? "medium" : "fast" },
    });
  });

  const socialThemes = ["Greetings", "Sharing", "Asking for Help", "Taking Turns", "Saying Please", "Saying Sorry", "Compliments", "Listening", "Eye Contact", "Personal Space", "Joining Play", "Expressing Feelings", "Waiting Patiently", "Reading Body Language", "Cooperative Problem Solving"];
  socialThemes.forEach((theme, index) => {
    games.push({
      id: gid(),
      name: theme,
      emoji: "🤝",
      category: "social",
      engine: "social",
      description: `Practice ${theme.toLowerCase()} in social scenarios`,
      skills: ["social", "communication"],
      difficulty: index < 5 ? "easy" : index < 10 ? "medium" : "hard",
      estimatedMinutes: 5,
      supportsShared: true,
      supportsMultiplayer: true,
      config: { scenarios: 4, theme: theme.toLowerCase() },
    });
  });

  const buildThemes = ["House", "Garden", "Spaceship", "Castle", "Farm", "City", "Ocean Scene", "Forest", "Kitchen", "Classroom", "Hospital", "Fire Station"];
  buildThemes.forEach((theme, index) => {
    games.push({
      id: gid(),
      name: `Build a ${theme}`,
      emoji: "🏗️",
      category: "building",
      engine: "building",
      description: `Place items to build a ${theme.toLowerCase()}`,
      skills: ["creativity", "planning"],
      difficulty: index < 4 ? "easy" : index < 8 ? "medium" : "hard",
      estimatedMinutes: 6,
      supportsShared: true,
      supportsMultiplayer: true,
      config: { scene: theme.toLowerCase(), pieces: 10 },
    });
  });

  const froebelBuilds = [
    {
      name: "Build a Triangle",
      description: "Choose the right pieces to build a triangle shape",
      difficulty: "easy" as Difficulty,
      estimatedMinutes: 4,
      objective: "Build a triangle with three matching edges",
      template: ["/\\", "[]", "/\\"],
      pieceOptions: ["/\\", "[]", "o", "="],
      skills: ["geometry", "spatial reasoning", "planning"],
    },
    {
      name: "Build a Square",
      description: "Place equal pieces to complete a square",
      difficulty: "easy" as Difficulty,
      estimatedMinutes: 4,
      objective: "Build a square using four equal sides",
      template: ["[]", "[]", "[]", "[]"],
      pieceOptions: ["[]", "/\\", "o", "||"],
      skills: ["geometry", "visual-motor", "planning"],
    },
    {
      name: "Build a Rectangle",
      description: "Notice the long and short sides while building a rectangle",
      difficulty: "medium" as Difficulty,
      estimatedMinutes: 5,
      objective: "Build a rectangle with matching opposite sides",
      template: ["[]", "=", "[]", "="],
      pieceOptions: ["[]", "=", "/\\", "o"],
      skills: ["geometry", "spatial reasoning", "sequencing"],
    },
    {
      name: "Build a Diamond",
      description: "Rotate and place angled pieces to build a diamond",
      difficulty: "medium" as Difficulty,
      estimatedMinutes: 5,
      objective: "Build a diamond from angled pieces",
      template: ["/\\", "<>", "\\/", "<>"],
      pieceOptions: ["/\\", "<>", "\\/", "[]"],
      skills: ["geometry", "planning", "visual discrimination"],
    },
    {
      name: "Pattern Block Flower",
      description: "Build a flower from repeated shape pieces",
      difficulty: "medium" as Difficulty,
      estimatedMinutes: 5,
      objective: "Repeat the same shape pattern around the center",
      template: ["o", "/\\", "/\\", "/\\", "/\\"],
      pieceOptions: ["o", "/\\", "[]", "="],
      skills: ["patterns", "spatial reasoning", "attention"],
    },
    {
      name: "Build a Block Bridge",
      description: "Use simple block pieces to build a bridge shape",
      difficulty: "hard" as Difficulty,
      estimatedMinutes: 6,
      objective: "Build a bridge with two supports and a top beam",
      template: ["||", "=", "||", "[]"],
      pieceOptions: ["||", "=", "[]", "/\\"],
      skills: ["planning", "spatial reasoning", "problem solving"],
    },
  ];

  froebelBuilds.forEach((game) => {
    games.push({
      id: gid(),
      name: game.name,
      emoji: "[]",
      category: "building",
      engine: "building",
      description: game.description,
      skills: game.skills,
      difficulty: game.difficulty,
      estimatedMinutes: game.estimatedMinutes,
      supportsShared: true,
      supportsMultiplayer: false,
      config: {
        objective: game.objective,
        template: game.template,
        pieceOptions: game.pieceOptions,
        source: "Froebel-inspired",
      },
    });
  });

  const physicalPlayBuilds = [
    {
      name: "Symmetry Board",
      objective: "Copy the left side so both sides match",
      modelLabel: "Mirror board",
      template: ["[]", "/\\", "/\\", "[]"],
      pieceOptions: ["[]", "/\\", "o", "="],
      difficulty: "easy" as Difficulty,
      skills: ["symmetry", "spatial reasoning", "attention"],
    },
    {
      name: "Copy the Pattern",
      objective: "Copy the repeating shape pattern from the model",
      modelLabel: "ABAB pattern",
      template: ["[]", "o", "[]", "o"],
      pieceOptions: ["[]", "o", "/\\", "="],
      difficulty: "easy" as Difficulty,
      skills: ["patterns", "sequencing", "visual-motor"],
    },
    {
      name: "Block Tower",
      objective: "Stack the tower from bottom to top",
      modelLabel: "Tall tower",
      template: ["[]", "[]", "[]", "/\\"],
      pieceOptions: ["[]", "/\\", "o", "||"],
      difficulty: "medium" as Difficulty,
      skills: ["planning", "motor", "spatial reasoning"],
    },
    {
      name: "Bridge From Model",
      objective: "Build the bridge to match the model",
      modelLabel: "Bridge with two supports",
      template: ["||", "=", "||", "[]"],
      pieceOptions: ["||", "=", "[]", "/\\"],
      difficulty: "medium" as Difficulty,
      skills: ["problem solving", "planning", "spatial reasoning"],
    },
    {
      name: "Stair Step Builder",
      objective: "Build the steps in the right order",
      modelLabel: "Three-step stair",
      template: ["[]", "[]", "=", "="],
      pieceOptions: ["[]", "=", "/\\", "o"],
      difficulty: "medium" as Difficulty,
      skills: ["sequencing", "spatial reasoning", "planning"],
    },
    {
      name: "Shape Mirror Bridge",
      objective: "Place matching pieces on both sides of the center",
      modelLabel: "Mirror bridge",
      template: ["/\\", "[]", "[]", "/\\"],
      pieceOptions: ["/\\", "[]", "o", "T"],
      difficulty: "hard" as Difficulty,
      skills: ["symmetry", "attention", "planning"],
    },
  ];

  physicalPlayBuilds.forEach((game) => {
    games.push({
      id: gid(),
      name: game.name,
      emoji: "[]",
      category: "building",
      engine: "building",
      description: game.objective,
      skills: game.skills,
      difficulty: game.difficulty,
      estimatedMinutes: 5,
      supportsShared: true,
      supportsMultiplayer: false,
      config: {
        objective: game.objective,
        modelLabel: game.modelLabel,
        template: game.template,
        pieceOptions: game.pieceOptions,
        source: "physical-play-inspired",
      },
    });
  });

  const colorShapeThemes = ["Red Things", "Blue Things", "Round Objects", "Square Objects", "Rainbow Sort", "Shape Shadows", "Color Mixing", "Pattern Fill", "Shape Puzzle", "Color Match", "Triangle Hunt", "Symmetry Mirror"];
  colorShapeThemes.forEach((theme, index) => {
    games.push({
      id: gid(),
      name: theme,
      emoji: "🎨",
      category: "colors-shapes",
      engine: "recognition",
      description: `Identify and select ${theme.toLowerCase()}`,
      skills: ["visual", "recognition"],
      difficulty: index < 4 ? "easy" : index < 8 ? "medium" : "hard",
      estimatedMinutes: 4,
      supportsShared: false,
      supportsMultiplayer: false,
      config: { theme: theme.toLowerCase(), items: 8 },
    });
  });

  const countThemes = ["Apples", "Stars", "Fish", "Blocks", "Fingers", "Coins", "Birds", "Flowers", "Cars", "Dots", "Butterflies", "Marbles"];
  countThemes.forEach((theme, index) => {
    games.push({
      id: gid(),
      name: `Count ${theme}`,
      emoji: "🔢",
      category: "counting",
      engine: "counting",
      description: `Count the ${theme.toLowerCase()} on screen`,
      skills: ["numeracy", "attention"],
      difficulty: index < 4 ? "easy" : index < 8 ? "medium" : "hard",
      estimatedMinutes: 4,
      supportsShared: false,
      supportsMultiplayer: false,
      config: { theme: theme.toLowerCase(), max: index < 4 ? 5 : index < 8 ? 10 : 20 },
    });
  });

  const memoryThemes = ["Faces", "Objects", "Words", "Sounds", "Positions", "Stories", "Sequences", "Colors", "Shapes", "Animals"];
  memoryThemes.forEach((theme, index) => {
    games.push({
      id: gid(),
      name: `Remember ${theme}`,
      emoji: "🧠",
      category: "memory",
      engine: "memory",
      description: `Remember and recall ${theme.toLowerCase()}`,
      skills: ["memory", "focus"],
      difficulty: index < 3 ? "easy" : index < 7 ? "medium" : "hard",
      estimatedMinutes: 5,
      supportsShared: false,
      supportsMultiplayer: false,
      config: { theme: theme.toLowerCase(), items: index < 3 ? 4 : index < 7 ? 6 : 8 },
    });
  });

  const emotionThemes = ["Happy Face", "Sad Face", "Angry Face", "Scared Face", "Surprised Face", "Calm Breathing", "Feeling Thermometer", "Emotion Charades", "Mood Match", "Feeling Stories", "Emotion Detective", "Calm Down Corner"];
  emotionThemes.forEach((theme, index) => {
    games.push({
      id: gid(),
      name: theme,
      emoji: "😊",
      category: "emotions",
      engine: "social",
      description: `Identify and express ${theme.toLowerCase()}`,
      skills: ["emotional-awareness", "self-regulation"],
      difficulty: index < 4 ? "easy" : index < 8 ? "medium" : "hard",
      estimatedMinutes: 5,
      supportsShared: true,
      supportsMultiplayer: true,
      config: { theme: theme.toLowerCase(), scenarios: 4 },
    });
  });

  const languageThemes = ["First Words", "Action Words", "Describing Words", "Question Starters", "Story Starters", "Rhyming Fun", "Sentence Builder", "What Comes Next", "Picture Naming", "Category Names", "Following Directions", "Conversation Starter"];
  languageThemes.forEach((theme, index) => {
    games.push({
      id: gid(),
      name: theme,
      emoji: "💬",
      category: "language",
      engine: "social",
      description: `Practice ${theme.toLowerCase()} skills`,
      skills: ["language", "communication", "vocabulary"],
      difficulty: index < 4 ? "easy" : index < 8 ? "medium" : "hard",
      estimatedMinutes: 5,
      supportsShared: true,
      supportsMultiplayer: false,
      config: { theme: theme.toLowerCase(), prompts: 6 },
    });
  });

  const motorThemes = ["Trace Lines", "Connect Dots", "Drag & Drop", "Pinch & Zoom", "Swipe Patterns", "Follow the Path", "Catch the Ball", "Pop & Hold", "Slow Drag", "Circle Draw", "Zig-Zag Trace", "Target Aim"];
  motorThemes.forEach((theme, index) => {
    games.push({
      id: gid(),
      name: theme,
      emoji: "✋",
      category: "motor",
      engine: "tapping",
      description: `Practice ${theme.toLowerCase()} motor skills`,
      skills: ["fine-motor", "coordination", "control"],
      difficulty: index < 4 ? "easy" : index < 8 ? "medium" : "hard",
      estimatedMinutes: 4,
      supportsShared: false,
      supportsMultiplayer: false,
      config: { theme: theme.toLowerCase(), targets: 8 },
    });
  });

  const dailyThemes = ["Morning Routine", "Getting Dressed", "Brushing Teeth", "Eating Meals", "Washing Hands", "Bedtime Steps", "Packing a Bag", "Setting the Table", "Tidying Up", "Going Shopping"];
  dailyThemes.forEach((theme, index) => {
    games.push({
      id: gid(),
      name: theme,
      emoji: "🏠",
      category: "daily-living",
      engine: "sequence",
      description: `Practice the ${theme.toLowerCase()} sequence`,
      skills: ["independence", "sequencing", "daily-living"],
      difficulty: index < 3 ? "easy" : index < 7 ? "medium" : "hard",
      estimatedMinutes: 5,
      supportsShared: true,
      supportsMultiplayer: false,
      config: { theme: theme.toLowerCase(), steps: 6 },
    });
  });

  games.push(
    { id: gid(), name: "Waiting For Turn", emoji: "⏳", category: "social", engine: "social", description: "Practice staying calm and waiting for your turn in common social moments", skills: ["turn-taking", "patience", "self-regulation"], difficulty: "easy", estimatedMinutes: 4, supportsShared: true, supportsMultiplayer: true, config: { theme: "waiting for turn", source: "Otsimo-inspired" } },
    { id: gid(), name: "Sharing Toys", emoji: "🧸", category: "social", engine: "social", description: "Practice friendly sharing choices while playing together", skills: ["sharing", "cooperation", "communication"], difficulty: "easy", estimatedMinutes: 4, supportsShared: true, supportsMultiplayer: true, config: { theme: "sharing toys", source: "Otsimo-inspired" } },
    { id: gid(), name: "Count Along", emoji: "🔢", category: "counting", engine: "counting", description: "Count along with bright stars as they appear on screen", skills: ["counting", "attention", "numeracy"], difficulty: "easy", estimatedMinutes: 4, supportsShared: false, supportsMultiplayer: false, config: { theme: "stars", max: 8, source: "Otsimo-inspired" } },
    { id: gid(), name: "Match Colors", emoji: "🎨", category: "matching", engine: "matching", description: "Find matching pairs of bright colors", skills: ["memory", "visual discrimination"], difficulty: "easy", estimatedMinutes: 4, supportsShared: true, supportsMultiplayer: true, config: { theme: "colors", pairs: 4, source: "Otsimo-inspired" } },
    { id: gid(), name: "Learn Animals", emoji: "🐾", category: "colors-shapes", engine: "recognition", description: "Tap the animal pictures and learn to recognize them", skills: ["recognition", "vocabulary", "attention"], difficulty: "easy", estimatedMinutes: 4, supportsShared: false, supportsMultiplayer: false, config: { theme: "learn animals", source: "Otsimo-inspired" } },
    { id: gid(), name: "Learn Emotions", emoji: "😊", category: "emotions", engine: "recognition", description: "Identify emotional expressions on faces", skills: ["emotional-awareness", "recognition"], difficulty: "easy", estimatedMinutes: 4, supportsShared: true, supportsMultiplayer: false, config: { theme: "learn emotions", source: "Otsimo-inspired" } },
    { id: gid(), name: "Vehicle Puzzle", emoji: "🚗", category: "building", engine: "building", description: "Place the vehicle pieces in order to complete the puzzle", skills: ["planning", "sequencing", "visual-motor"], difficulty: "easy", estimatedMinutes: 5, supportsShared: true, supportsMultiplayer: true, config: { scene: "vehicle puzzle", source: "Otsimo-inspired" } },
    { id: gid(), name: "Animal Memory Cards", emoji: "🧠", category: "memory", engine: "memory", description: "Remember the animal cards and choose the right one", skills: ["memory", "focus", "recognition"], difficulty: "easy", estimatedMinutes: 4, supportsShared: false, supportsMultiplayer: false, config: { theme: "animals", items: 4, source: "Otsimo-inspired" } }
  );

  return games;
}

export const allGames = makeGames();

export function getGamesByCategory(category: GameCategory): GameConfig[] {
  return allGames.filter((game) => game.category === category);
}

export function getGameById(id: string): GameConfig | undefined {
  return allGames.find((game) => game.id === id);
}
