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
  | "daily-living"
  | "sensory"
  | "reasoning";

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
  | "memory"
  | "magic-toys"
  | "odd-one-out"
  | "pattern-next"
  | "face-builder"
  | "whats-missing"
  | "situation-feelings"
  | "sound-memory"
  | "listen";

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
  sensory: { label: "Sensory Play", emoji: "✨", color: "lavender" },
  reasoning: { label: "Thinking", emoji: "🔍", color: "sky" },
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

  const motorThemes = ["Trace Lines", "Connect Dots", "Drag & Drop", "Pinch & Zoom", "Swipe Patterns", "Follow the Path", "Catch the Ball", "Pop & Hold", "Slow Drag", "Circle Draw", "Zig-Zag Trace", "Target Aim", "Spiral Trace", "Rainbow Arc"];
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

  const magicToyGames = [
    { name: "Magic Bubbles", theme: "bubbles", description: "Touch sparkling bubble toys and watch them pop to life" },
    { name: "Music Magic", theme: "instruments", description: "Tap friendly instruments and hear their happy sounds" },
    { name: "Magic Animal Friends", theme: "animals", description: "Say hello to gentle animal friends by touching each one" },
    { name: "Zoom Zoom Magic", theme: "vehicles", description: "Touch cars and rockets and watch them go!" },
    { name: "Magic Garden", theme: "garden", description: "Touch flowers and garden friends to make them bloom" },
    { name: "Magic Weather", theme: "weather", description: "Touch the sun, rainbow, and snow to see weather magic" },
    { name: "Magic Ocean", theme: "ocean", description: "Tap sea turtles, crabs, and fish in your own ocean" },
    { name: "Cosmic Magic", theme: "space", description: "Touch stars and planets for sparkling space surprises" },
  ];
  magicToyGames.forEach((entry) => {
    games.push({
      id: gid(),
      name: entry.name,
      emoji: "✨",
      category: "sensory",
      engine: "magic-toys",
      description: entry.description,
      skills: ["cause-effect", "attention", "sensory"],
      difficulty: "easy",
      estimatedMinutes: 3,
      supportsShared: true,
      supportsMultiplayer: false,
      config: { theme: entry.theme },
    });
  });

  const oddOneOutGames = [
    { name: "Odd Animal Out", theme: "animals", difficulty: "easy" as Difficulty },
    { name: "Odd Food Out", theme: "food", difficulty: "easy" as Difficulty },
    { name: "Odd Vehicle Out", theme: "vehicles", difficulty: "medium" as Difficulty },
    { name: "Odd Shape Out", theme: "shapes", difficulty: "medium" as Difficulty },
    { name: "Odd Color Out", theme: "colors", difficulty: "easy" as Difficulty },
    { name: "Letters or Numbers?", theme: "letters", difficulty: "hard" as Difficulty },
    { name: "Odd Body Part Out", theme: "bodyparts", difficulty: "easy" as Difficulty },
    { name: "Odd Sound Out", theme: "music", difficulty: "medium" as Difficulty },
    { name: "Nature Detective", theme: "nature", difficulty: "medium" as Difficulty },
  ];
  oddOneOutGames.forEach((entry) => {
    games.push({
      id: gid(),
      name: entry.name,
      emoji: "🔍",
      category: "reasoning",
      engine: "odd-one-out",
      description: "Three things match the group. Find the one that does not belong!",
      skills: ["reasoning", "categorization"],
      difficulty: entry.difficulty,
      estimatedMinutes: 4,
      supportsShared: true,
      supportsMultiplayer: false,
      config: { theme: entry.theme },
    });
  });

  const patternNextGames = [
    { name: "Color Patterns", theme: "colors", difficulty: "easy" as Difficulty },
    { name: "Animal Patterns", theme: "animals", difficulty: "easy" as Difficulty },
    { name: "Vehicle Patterns", theme: "vehicles", difficulty: "medium" as Difficulty },
    { name: "Food Patterns", theme: "foods", difficulty: "medium" as Difficulty },
    { name: "Shape Patterns", theme: "shapes", difficulty: "hard" as Difficulty },
    { name: "Feeling Patterns", theme: "feelings", difficulty: "hard" as Difficulty },
  ];
  patternNextGames.forEach((entry) => {
    games.push({
      id: gid(),
      name: `Next: ${entry.name}`,
      emoji: "🔮",
      category: "sequences",
      engine: "pattern-next",
      description: "Say the pattern out loud, then choose what comes next!",
      skills: ["patterns", "prediction", "sequencing"],
      difficulty: entry.difficulty,
      estimatedMinutes: 4,
      supportsShared: true,
      supportsMultiplayer: false,
      config: { theme: entry.theme },
    });
  });

  const faceBuilderGames = [
    { name: "Build a Smile", difficulty: "easy" as Difficulty },
    { name: "Feeling Faces", difficulty: "medium" as Difficulty },
    { name: "Emotion Detective", difficulty: "hard" as Difficulty },
  ];
  faceBuilderGames.forEach((entry) => {
    games.push({
      id: gid(),
      name: entry.name,
      emoji: "🧩",
      category: "emotions",
      engine: "face-builder",
      description: "Pick the right mouth to build each feeling face",
      skills: ["emotional-awareness", "visual discrimination"],
      difficulty: entry.difficulty,
      estimatedMinutes: 5,
      supportsShared: true,
      supportsMultiplayer: false,
      config: {},
    });
  });

  games.push(
    { id: gid(), name: "Sort Sky Land Water", emoji: "📦", category: "sorting", engine: "sorting", description: "Sort animals and things into sky, land, and water groups", skills: ["categorization", "cognitive"], difficulty: "medium", estimatedMinutes: 6, supportsShared: true, supportsMultiplayer: true, config: { categories: ["Sky", "Land", "Water"] } },
    { id: gid(), name: "Sort Fruits Veggies Sweets", emoji: "📦", category: "sorting", engine: "sorting", description: "Sort foods into fruits, vegetables, and sometimes-sweets", skills: ["categorization", "healthy-choices"], difficulty: "hard", estimatedMinutes: 6, supportsShared: true, supportsMultiplayer: true, config: { categories: ["Fruits", "Vegetables", "Sweets"] } }
  );

  games.push(
    { id: gid(), name: "Sort Sky Land Water", emoji: "📦", category: "sorting", engine: "sorting", description: "Sort animals and things into sky, land, and water groups", skills: ["categorization", "cognitive"], difficulty: "medium", estimatedMinutes: 6, supportsShared: true, supportsMultiplayer: true, config: { categories: ["Sky", "Land", "Water"] } },
    { id: gid(), name: "Sort Fruits Veggies Sweets", emoji: "📦", category: "sorting", engine: "sorting", description: "Sort foods into fruits, vegetables, and sometimes-sweets", skills: ["categorization", "healthy-choices"], difficulty: "hard", estimatedMinutes: 6, supportsShared: true, supportsMultiplayer: true, config: { categories: ["Fruits", "Vegetables", "Sweets"] } }
  );

  const newMatchThemes = [
    ["Sea Life Match", "sea life"],
    ["Bug Match", "bugs"],
    ["Weather Match", "weather"],
    ["Space Match", "space"],
    ["Sports Match", "sports"],
    ["School Match", "school"],
    ["House Match", "house"],
    ["Garden Match", "garden"],
  ] as const;
  newMatchThemes.forEach(([name, theme], idx) => {
    games.push({
      id: gid(), name, emoji: "🧩", category: "matching", engine: "matching",
      description: `Find matching pairs of ${theme} pictures`,
      skills: ["memory", "visual discrimination"], difficulty: idx < 4 ? "easy" : "medium",
      estimatedMinutes: 4, supportsShared: true, supportsMultiplayer: true,
      config: { theme, pairs: idx < 4 ? 3 : 4 },
    });
  });

  const newMemoryThemes = [
    ["Remember Vehicles", "vehicles"],
    ["Remember Snacks", "food"],
    ["Remember Toys", "toys"],
    ["Remember Weather", "weather"],
    ["Remember Sea Friends", "sea"],
    ["Remember Instruments", "music"],
    ["Remember School Bag", "school"],
    ["Remember the Garden", "garden"],
  ] as const;
  newMemoryThemes.forEach(([name, theme], idx) => {
    games.push({
      id: gid(), name, emoji: "🧠", category: "memory", engine: "memory",
      description: `Watch the ${theme} cards, then recall what you saw`,
      skills: ["memory", "focus"], difficulty: idx < 4 ? "easy" : "medium",
      estimatedMinutes: 4, supportsShared: false, supportsMultiplayer: false,
      config: { theme },
    });
  });

  const newCountThemes = [
    ["Count Ducks", "ducks"],
    ["Count Cookies", "cookies"],
    ["Count Hearts", "hearts"],
    ["Count Frogs", "frogs"],
    ["Count Books", "books"],
    ["Count Eggs", "eggs"],
  ] as const;
  newCountThemes.forEach(([name, theme], idx) => {
    games.push({
      id: gid(), name, emoji: "🔢", category: "counting", engine: "counting",
      description: `Count the ${theme} one by one`,
      skills: ["numeracy", "attention"], difficulty: idx < 3 ? "easy" : "medium",
      estimatedMinutes: 4, supportsShared: false, supportsMultiplayer: false,
      config: { theme, max: idx < 3 ? 5 : 8 },
    });
  });

  const newTapThemes = [
    ["Fireworks Tap", "fireworks", "fast"],
    ["Heart Catch", "hearts", "slow"],
  ] as const;
  newTapThemes.forEach(([name, theme, speed]) => {
    games.push({
      id: gid(), name, emoji: "👆", category: "tapping", engine: "tapping",
      description: `Tap the ${theme} as they appear`,
      skills: ["motor", "attention"], difficulty: speed === "fast" ? "medium" : "easy",
      estimatedMinutes: 3, supportsShared: false, supportsMultiplayer: true,
      config: { theme, speed },
    });
  });

  const newOddThemes = [
    ["Weather Detective", "weather", "medium" as Difficulty],
    ["Ocean Odd One", "sea", "medium" as Difficulty],
  ] as const;
  newOddThemes.forEach(([name, theme, diff]) => {
    games.push({
      id: gid(), name, emoji: "🔍", category: "reasoning", engine: "odd-one-out",
      description: "Three things match. Find the different one!",
      skills: ["reasoning", "categorization"], difficulty: diff,
      estimatedMinutes: 4, supportsShared: true, supportsMultiplayer: false,
      config: { theme },
    });
  });

  const newPatternThemes = [
    ["Weather Patterns", "weather", "easy" as Difficulty],
    ["Fruit Patterns", "fruits", "easy" as Difficulty],
  ] as const;
  newPatternThemes.forEach(([name, theme, diff]) => {
    games.push({
      id: gid(), name: `Next: ${name}`, emoji: "🔮", category: "sequences", engine: "pattern-next",
      description: "Say the pattern out loud, then choose what comes next!",
      skills: ["patterns", "prediction"], difficulty: diff,
      estimatedMinutes: 4, supportsShared: true, supportsMultiplayer: false,
      config: { theme },
    });
  });

  games.push(
    { id: gid(), name: "Froebel Gift Patterns", emoji: "🔮", category: "sequences", engine: "pattern-next", description: "Continue the patterns hidden in Froebel's gift shapes", skills: ["patterns", "geometry"], difficulty: "hard", estimatedMinutes: 5, supportsShared: true, supportsMultiplayer: false, config: { theme: "froebel" } },
    { id: gid(), name: "Froebel Shadow Forms", emoji: "🧩", category: "colors-shapes", engine: "matching", description: "Match each gift shape to its shadow — form of beauty", skills: ["visual discrimination", "symmetry"], difficulty: "medium", estimatedMinutes: 5, supportsShared: true, supportsMultiplayer: true, config: { theme: "shapes", pairs: 4, variant: "shadow" } },
    { id: gid(), name: "Froebel Shadow Colors", emoji: "🧩", category: "colors-shapes", engine: "matching", description: "Match color cards to their quiet shadows", skills: ["visual discrimination", "symmetry"], difficulty: "medium", estimatedMinutes: 5, supportsShared: true, supportsMultiplayer: true, config: { theme: "colors", pairs: 4, variant: "shadow" } },
    { id: gid(), name: "Froebel Form Order", emoji: "🔢", category: "daily-living", engine: "sequence", description: "Order the gift shapes exactly as they appeared", skills: ["sequencing", "geometry"], difficulty: "medium", estimatedMinutes: 5, supportsShared: false, supportsMultiplayer: false, config: { theme: "shapes", length: 4 } },
    { id: gid(), name: "Sort Pets vs Wild", emoji: "📦", category: "sorting", engine: "sorting", description: "Which animals live with people and which are wild?", skills: ["categorization", "cognitive"], difficulty: "easy", estimatedMinutes: 5, supportsShared: true, supportsMultiplayer: true, config: { categories: ["Pets", "Wild"] } },
    { id: gid(), name: "Sort Summer vs Winter", emoji: "📦", category: "sorting", engine: "sorting", description: "Sort hot day things from snowy day things", skills: ["categorization", "seasons"], difficulty: "easy", estimatedMinutes: 5, supportsShared: true, supportsMultiplayer: true, config: { categories: ["Summer", "Winter"] } }
  );

  const whatsMissingGames = [
    ["Who Disappeared? Animal Friends", "animals"],
    ["Snack Surprise", "food"],
    ["Toy Box Trick", "toys"],
    ["Garage Whodunit", "vehicles"],
  ] as const;
  whatsMissingGames.forEach(([name, theme], idx) => {
    games.push({
      id: gid(), name, emoji: "🕵️", category: "memory", engine: "whats-missing",
      description: "Watch the friends, then spot who disappeared",
      skills: ["working memory", "visual closure"], difficulty: idx < 2 ? "easy" : "medium",
      estimatedMinutes: 4, supportsShared: false, supportsMultiplayer: false,
      config: { theme },
    });
  });

  const situationFeelingGames = [
    { name: "Happy or Sad?", difficulty: "easy" as Difficulty },
    { name: "How Would You Feel?", difficulty: "medium" as Difficulty },
    { name: "Feeling Detective", difficulty: "hard" as Difficulty },
  ];
  situationFeelingGames.forEach((entry) => {
    games.push({
      id: gid(), name: entry.name, emoji: "💛", category: "emotions", engine: "situation-feelings",
      description: "Hear a little story, then pick the feeling that fits",
      skills: ["emotional awareness", "perspective taking"], difficulty: entry.difficulty,
      estimatedMinutes: 5, supportsShared: true, supportsMultiplayer: false,
      config: {},
    });
  });

  games.push(
    { id: gid(), name: "Froebel Gift Order II", emoji: "🔢", category: "daily-living", engine: "sequence", description: "Longer gift-shape chains for steady hands and minds", skills: ["sequencing", "geometry"], difficulty: "hard", estimatedMinutes: 6, supportsShared: false, supportsMultiplayer: false, config: { theme: "froebel", length: 5 } },
    { id: gid(), name: "Froebel Gift Order III", emoji: "🔢", category: "daily-living", engine: "sequence", description: "The full Froebel solids in order — sphere to pyramid", skills: ["sequencing", "geometry"], difficulty: "hard", estimatedMinutes: 6, supportsShared: false, supportsMultiplayer: false, config: { theme: "froebel", length: 4 } }
  );

  const phase3Chains: Array<[string, string, number, Difficulty]> = [
    ["Crossing the Street", "crossing the street", 5, "hard"],
    ["School Morning Ready", "school morning", 5, "hard"],
    ["Clean the Spill", "cleaning a spill", 4, "medium"],
    ["Answering the Phone", "answering the phone", 4, "hard"],
    ["Bedtime Wind-Down II", "bedtime steps", 6, "medium"],
  ];
  phase3Chains.forEach(([name, theme, length, diff]) => {
    games.push({
      id: gid(), name, emoji: "🏠", category: "daily-living", engine: "sequence",
      description: `A real ${String(theme)} routine — every step in order`,
      skills: ["sequencing", "daily-living", "independence"], difficulty: diff as Difficulty,
      estimatedMinutes: 6, supportsShared: true, supportsMultiplayer: false,
      config: { theme, length },
    });
  });

  const soundMemoryGames: Array<[string, string, Difficulty]> = [
    ["Rainbow Notes I", "rainbow", "easy"],
    ["Animal Chimes", "animals", "medium"],
    ["Night Tones", "night", "medium"],
    ["Rainbow Notes II", "rainbow", "hard"],
  ];
  soundMemoryGames.forEach(([name, theme, diff]) => {
    games.push({
      id: gid(), name, emoji: "🎵", category: "memory", engine: "sound-memory",
      description: "Listen to the melody, then play it back on the bells",
      skills: ["auditory memory", "sequencing"], difficulty: diff,
      estimatedMinutes: 5, supportsShared: false, supportsMultiplayer: false,
      config: { theme },
    });
  });

  games.push(
    { id: gid(), name: "Match Animals: Shadow", emoji: "🧩", category: "matching", engine: "matching", description: "Shadow-match generalization for animal experts", skills: ["visual discrimination", "generalization"], difficulty: "medium", estimatedMinutes: 4, supportsShared: true, supportsMultiplayer: true, config: { theme: "animals", pairs: 4, variant: "shadow" } },
    { id: gid(), name: "Match Food: Shadow", emoji: "🧩", category: "matching", engine: "matching", description: "Snack shadows — same food, new look", skills: ["visual discrimination", "generalization"], difficulty: "medium", estimatedMinutes: 4, supportsShared: true, supportsMultiplayer: true, config: { theme: "food", pairs: 4, variant: "shadow" } },
    { id: gid(), name: "Match Vehicles: Shadow", emoji: "🧩", category: "matching", engine: "matching", description: "Vehicle shadows roll the same way", skills: ["visual discrimination", "generalization"], difficulty: "medium", estimatedMinutes: 4, supportsShared: true, supportsMultiplayer: true, config: { theme: "vehicles", pairs: 4, variant: "shadow" } },
    { id: gid(), name: "Count Apples II", emoji: "🔢", category: "counting", engine: "counting", description: "Bigger apple groups for counting pros", skills: ["numeracy"], difficulty: "medium", estimatedMinutes: 4, supportsShared: false, supportsMultiplayer: false, config: { theme: "apples", max: 10 } },
    { id: gid(), name: "Count Ducks II", emoji: "🔢", category: "counting", engine: "counting", description: "More ducks on the pond", skills: ["numeracy"], difficulty: "medium", estimatedMinutes: 4, supportsShared: false, supportsMultiplayer: false, config: { theme: "ducks", max: 10 } },
    { id: gid(), name: "Count Stars II", emoji: "🔢", category: "counting", engine: "counting", description: "A sky full of stars to count", skills: ["numeracy"], difficulty: "medium", estimatedMinutes: 4, supportsShared: false, supportsMultiplayer: false, config: { theme: "stars", max: 12 } },
    { id: gid(), name: "Odd Animal Challenge", emoji: "🔍", category: "reasoning", engine: "odd-one-out", description: "Trickier animal groups — look very closely", skills: ["reasoning"], difficulty: "hard", estimatedMinutes: 5, supportsShared: true, supportsMultiplayer: false, config: { theme: "animals" } },
    { id: gid(), name: "Odd Food Challenge", emoji: "🔍", category: "reasoning", engine: "odd-one-out", description: "Sneaky snack sets for sharp eyes", skills: ["reasoning"], difficulty: "hard", estimatedMinutes: 5, supportsShared: true, supportsMultiplayer: false, config: { theme: "food" } },
    { id: gid(), name: "Next: Colors II", emoji: "🔮", category: "sequences", engine: "pattern-next", description: "Color patterns, one step trickier", skills: ["patterns"], difficulty: "medium", estimatedMinutes: 4, supportsShared: true, supportsMultiplayer: false, config: { theme: "colors" } },
    { id: gid(), name: "Who Disappeared II: Animals", emoji: "🕵️", category: "memory", engine: "whats-missing", description: "Quicker flash cards, sharper eyes", skills: ["working memory"], difficulty: "hard", estimatedMinutes: 4, supportsShared: false, supportsMultiplayer: false, config: { theme: "animals" } }
  );

  const playgroundWorlds = [
    ["Picnic in the Park", "picnic", "sandbox", "🍇"],
    ["Beach Day Play", "beach", "sandbox", "🏖️"],
    ["Space Walk Adventure", "spacewalk", "slide", "👨‍🚀"],
    ["Farm Chores Friends", "farmchores", "bench", "🌾"],
    ["Quiet Library Trip", "library", "sandbox", "📚"],
    ["The Bus Ride", "busride", "slide", "🚌"],
    ["Art Class Creations", "artclass", "sandbox", "🎨"],
    ["Pet Care Helpers", "petcare", "bench", "🐾"],
    ["Rainy Day Fort", "rainyday", "sandbox", "🌧️"],
    ["Garden Explorers", "garden", "bench", "🌻"],
  ] as const;
  playgroundWorlds.forEach(([name, theme, engine, emoji]) => {
    games.push({
      id: gid(), name, emoji, category: "playground", engine,
      description: "A guided play routine through a brand-new world",
      skills: ["turn-taking", "sequencing", "imagination"], difficulty: "easy",
      estimatedMinutes: 4, supportsShared: true, supportsMultiplayer: true,
      config: { theme },
    });
  });

  const magicWorlds = [
    ["Forest Magic", "forest", "🌲"],
    ["Bakery Magic", "bakery", "🥐"],
    ["Dinosaur Magic", "dinosaurs", "🦕"],
    ["Circus Magic", "circus", "🎪"],
    ["Pond Magic", "pond", "🐸"],
    ["Winter Magic", "winter", "⛄"],
    ["Jungle Magic", "jungle", "🐒"],
    ["Bedroom Magic", "bedroom", "🛏️"],
    ["Farm Magic", "farmMagic", "🐄"],
    ["Under the Sea Magic", "seaMagic", "🐠"],
  ] as const;
  magicWorlds.forEach(([name, theme, emoji]) => {
    games.push({
      id: gid(), name, emoji, category: "sensory", engine: "magic-toys",
      description: `Touch every ${theme} friend and watch the magic happen`,
      skills: ["cause-effect", "attention", "sensory"], difficulty: "easy",
      estimatedMinutes: 3, supportsShared: true, supportsMultiplayer: false,
      config: { theme },
    });
  });

  const phase4Odd: Array<[string, string, Difficulty]> = [
    ["Instrument Odd One", "instruments", "medium"],
    ["Toy Box Odd One", "toys", "easy"],
  ];
  phase4Odd.forEach(([name, theme, diff]) => {
    games.push({
      id: gid(), name, emoji: "🔍", category: "reasoning", engine: "odd-one-out",
      description: "Three things match. Find the different one!",
      skills: ["reasoning", "categorization"], difficulty: diff,
      estimatedMinutes: 4, supportsShared: true, supportsMultiplayer: false,
      config: { theme },
    });
  });

  const phase4Pattern = [
    ["Sound Patterns", "sounds", "medium" as Difficulty],
    ["Body Patterns", "body", "easy" as Difficulty],
    ["Zoo Patterns", "zoo", "medium" as Difficulty],
    ["Circus Patterns", "circus", "hard" as Difficulty],
  ] as Array<[string, string, Difficulty]>;
  phase4Pattern.forEach(([name, theme, diff]) => {
    games.push({
      id: gid(), name: `Next: ${name}`, emoji: "🔮", category: "sequences", engine: "pattern-next",
      description: "Say the pattern out loud, then choose what comes next!",
      skills: ["patterns", "prediction"], difficulty: diff,
      estimatedMinutes: 4, supportsShared: true, supportsMultiplayer: false,
      config: { theme },
    });
  });

  const phase4Recog: Array<[string, string]> = [
    ["Things That Roll", "things that roll"],
    ["Things We Wear", "things we wear"],
    ["Bathroom Things", "bathroom things"],
    ["School Supplies Hunt", "school supplies"],
  ];
  phase4Recog.forEach(([name, theme], idx) => {
    games.push({
      id: gid(), name, emoji: "🎨", category: "colors-shapes", engine: "recognition",
      description: `Find every one of the ${theme}`,
      skills: ["visual discrimination", "vocabulary"], difficulty: idx < 2 ? "easy" : "medium",
      estimatedMinutes: 4, supportsShared: false, supportsMultiplayer: false,
      config: { theme },
    });
  });

  const phase4Missing: Array<[string, string, Difficulty]> = [
    ["Weather Whodunit", "weather", "medium"],
    ["Ocean Whodunit", "sea", "medium"],
    ["Garden Whodunit", "garden", "easy"],
    ["Classroom Whodunit", "school", "hard"],
  ];
  phase4Missing.forEach(([name, theme, diff]) => {
    games.push({
      id: gid(), name, emoji: "🕵️", category: "memory", engine: "whats-missing",
      description: "Watch the friends, then spot who disappeared",
      skills: ["working memory", "visual closure"], difficulty: diff,
      estimatedMinutes: 4, supportsShared: false, supportsMultiplayer: false,
      config: { theme },
    });
  });

  const phase4Trace: Array<[string, string, Difficulty]> = [
    ["Heart Trace", "heart trace", "easy"],
    ["Star Trace", "star trace", "medium"],
  ];
  phase4Trace.forEach(([name, theme, diff]) => {
    games.push({
      id: gid(), name, emoji: "✋", category: "motor", engine: "tapping",
      description: `Trace the ${theme.replace(" trace", "")} slowly and carefully`,
      skills: ["fine motor", "coordination"], difficulty: diff,
      estimatedMinutes: 4, supportsShared: false, supportsMultiplayer: false,
      config: { theme },
    });
  });

  const phase4Sound: Array<[string, string, Difficulty]> = [
    ["Rainbow Notes III", "rainbow", "hard"],
    ["Night Tones II", "night", "medium"],
  ];
  phase4Sound.forEach(([name, theme, diff]) => {
    games.push({
      id: gid(), name, emoji: "🎵", category: "memory", engine: "sound-memory",
      description: "Listen to the melody, then play it back on the bells",
      skills: ["auditory memory", "sequencing"], difficulty: diff,
      estimatedMinutes: 5, supportsShared: false, supportsMultiplayer: false,
      config: { theme },
    });
  });

  const phase4Seq = [
    ["Morning Routine II", "morning routine", 5],
    ["Washing Hands II", "washing hands", 5],
    ["Getting Dressed II", "getting dressed", 5],
    ["Setting the Table II", "setting the table", 5],
  ] as Array<[string, string, number]>;

  const listenGames: Array<[string, string, Difficulty]> = [
    ["Listen: Animals", "animals", "easy"],
    ["Listen: Colors", "colors", "easy"],
    ["Listen: Food Words", "food", "easy"],
    ["Listen: Action Words", "actions", "medium"],
    ["Listen: Body Parts", "body", "easy"],
    ["Listen: Feelings", "feelings", "medium"],
    ["Listen: Vehicles", "vehicles", "easy"],
    ["Listen: Animals II", "animals", "hard"],
    ["Listen: Feelings II", "feelings", "hard"],
    ["Listen: Actions II", "actions", "hard"],
  ];
  listenGames.forEach(([name, theme, diff]) => {
    games.push({
      id: gid(), name, emoji: "💬", category: "language", engine: "listen",
      description: "Listen to the word, then tap the matching picture",
      skills: ["listening", "vocabulary"], difficulty: diff,
      estimatedMinutes: 4, supportsShared: false, supportsMultiplayer: false,
      config: { theme },
    });
  });

  phase4Seq.forEach(([name, theme, length]) => {
    games.push({
      id: gid(), name, emoji: "🏠", category: "daily-living", engine: "sequence",
      description: `The full ${theme} routine — longer chain, steadier mind`,
      skills: ["sequencing", "daily-living"], difficulty: "hard",
      estimatedMinutes: 6, supportsShared: true, supportsMultiplayer: false,
      config: { theme, length },
    });
  });

  const phase4Match: Array<[string, string, Difficulty]> = [
    ["Circus Match", "circus", "easy"],
    ["Bathroom Match", "bathroom", "easy"],
    ["Kitchen Match", "kitchen", "medium"],
    ["Fruit Match", "fruits", "easy"],
    ["Vegetable Match", "vegetables", "easy"],
    ["Zoo Match", "zoo", "medium"],
    ["Bird Match", "birds", "medium"],
    ["Pet Match", "pets", "easy"],
  ];
  phase4Match.forEach(([name, theme, diff]) => {
    games.push({
      id: gid(), name, emoji: "🧩", category: "matching", engine: "matching",
      description: `Find matching pairs of ${theme} pictures`,
      skills: ["memory", "visual discrimination"], difficulty: diff,
      estimatedMinutes: 4, supportsShared: true, supportsMultiplayer: true,
      config: { theme, pairs: 4 },
    });
  });

  const phase4Flip = [
    ["Match Animals: Flip", "animals"],
    ["Match Sea Life: Flip", "sea life"],
    ["Match Zoo: Flip", "zoo"],
    ["Match Pets: Flip", "pets"],
    ["Match Fruits: Flip", "fruits"],
    ["Match Birds: Flip", "birds"],
  ] as Array<[string, string]>;
  phase4Flip.forEach(([name, theme]) => {
    games.push({
      id: gid(), name, emoji: "🧩", category: "matching", engine: "matching",
      description: `Memory-flip challenge with ${theme}`,
      skills: ["memory"], difficulty: "medium",
      estimatedMinutes: 5, supportsShared: true, supportsMultiplayer: true,
      config: { theme, pairs: 4, variant: "flip" },
    });
  });

  const phase4Shadow = [
    ["Sports Shadows", "sports"],
    ["Space Shadows", "space"],
    ["House Shadows", "house"],
    ["Garden Shadows", "garden"],
  ] as Array<[string, string]>;
  phase4Shadow.forEach(([name, theme]) => {
    games.push({
      id: gid(), name, emoji: "🧩", category: "colors-shapes", engine: "matching",
      description: `${name} — forms of beauty through symmetry`,
      skills: ["visual discrimination", "symmetry"], difficulty: "medium",
      estimatedMinutes: 5, supportsShared: true, supportsMultiplayer: true,
      config: { theme, pairs: 4, variant: "shadow" },
    });
  });

  const phase4Memory: Array<[string, string]> = [
    ["Remember Feelings", "emotions"],
    ["Remember the Circus", "circus"],
    ["Remember Fruit Basket", "fruits"],
    ["Remember Veggies", "vegetables"],
    ["Remember Little Bugs", "bugs"],
    ["Remember Outer Space", "space"],
  ];
  phase4Memory.forEach(([name, theme], idx) => {
    games.push({
      id: gid(), name, emoji: "🧠", category: "memory", engine: "memory",
      description: `Watch the ${theme} cards, then recall what you saw`,
      skills: ["memory", "focus"], difficulty: idx < 3 ? "easy" : "medium",
      estimatedMinutes: 4, supportsShared: false, supportsMultiplayer: false,
      config: { theme },
    });
  });

  const phase4Count: Array<[string, string]> = [
    ["Count Penguins", "penguins"],
    ["Count Monkeys", "monkeys"],
    ["Count Donuts", "donuts"],
    ["Count Cupcakes", "cupcakes"],
    ["Count Presents", "presents"],
    ["Count Candles", "candles"],
    ["Count Bees", "bees"],
    ["Count Ladybugs II", "ladybugs"],
  ];
  phase4Count.forEach(([name, theme], idx) => {
    games.push({
      id: gid(), name, emoji: "🔢", category: "counting", engine: "counting",
      description: `Count the ${theme} one by one`,
      skills: ["numeracy", "attention"], difficulty: idx < 4 ? "easy" : "medium",
      estimatedMinutes: 4, supportsShared: false, supportsMultiplayer: false,
      config: { theme, max: idx < 4 ? 6 : 10 },
    });
  });

  games.push(
    { id: gid(), name: "Sort Wet vs Dry", emoji: "📦", category: "sorting", engine: "sorting", description: "Water things or dry things — sort them out", skills: ["categorization", "science"], difficulty: "easy", estimatedMinutes: 5, supportsShared: true, supportsMultiplayer: true, config: { categories: ["Wet", "Dry"] } },
    { id: gid(), name: "Sort Toys vs Tools", emoji: "📦", category: "sorting", engine: "sorting", description: "Play things and work things in their places", skills: ["categorization", "cognitive"], difficulty: "medium", estimatedMinutes: 5, supportsShared: true, supportsMultiplayer: true, config: { categories: ["Toys", "Tools"] } },
    { id: gid(), name: "Sort Fruits vs Sweets", emoji: "📦", category: "sorting", engine: "sorting", description: "Everyday fruits versus sometimes-sugary treats", skills: ["categorization", "healthy-choices"], difficulty: "medium", estimatedMinutes: 5, supportsShared: true, supportsMultiplayer: true, config: { categories: ["Fruits", "Sweets"] } }
  );

  const newRecognitionThemes = [
    ["Soft Things", "soft things"],
    ["Things That Fly", "things that fly"],
    ["Fruit Hunt", "fruits"],
    ["Animals That Swim", "animals that swim"],
    ["Big Animals", "big animals"],
    ["Yellow Things", "yellow things"],
  ] as const;
  newRecognitionThemes.forEach(([name, theme], idx) => {
    games.push({
      id: gid(), name, emoji: "🎨", category: "colors-shapes", engine: "recognition",
      description: `Find every one of the ${theme}`,
      skills: ["visual discrimination", "vocabulary"], difficulty: idx < 3 ? "easy" : "medium",
      estimatedMinutes: 4, supportsShared: false, supportsMultiplayer: false,
      config: { theme },
    });
  });

  const newCount2 = [
    ["Count Rockets", "rockets"],
    ["Count Balloons", "balloons"],
    ["Count Ladybugs", "ladybugs"],
    ["Count Snowflakes", "snowflakes"],
  ] as const;
  newCount2.forEach(([name, theme], idx) => {
    games.push({
      id: gid(), name, emoji: "🔢", category: "counting", engine: "counting",
      description: `Count the ${theme} one by one`,
      skills: ["numeracy", "attention"], difficulty: idx < 2 ? "easy" : "medium",
      estimatedMinutes: 4, supportsShared: false, supportsMultiplayer: false,
      config: { theme, max: idx < 2 ? 5 : 8 },
    });
  });

  const newTap2 = [
    ["Snowman Tap", "snowman", "slow"],
    ["Acorn Catch", "acorn", "medium"],
  ] as ReadonlyArray<readonly [string, string, string]>;
  newTap2.forEach(([name, theme, speed]) => {
    const pace = speed as string;
    games.push({
      id: gid(), name, emoji: "👆", category: "tapping", engine: "tapping",
      description: `Tap the ${theme} as they appear`,
      skills: ["motor", "attention"], difficulty: pace === "fast" ? "medium" : "easy",
      estimatedMinutes: 3, supportsShared: false, supportsMultiplayer: true,
      config: { theme, speed },
    });
  });

  const newMatch2 = [
    ["Dinosaur Match", "dinosaur"],
    ["Farm Match", "farm"],
    ["Fairy Tale Match", "fairy tale"],
    ["Winter Clothes Match", "winter clothes"],
  ] as const;
  newMatch2.forEach(([name, theme], idx) => {
    games.push({
      id: gid(), name, emoji: "🧩", category: "matching", engine: "matching",
      description: `Find matching pairs of ${theme} pictures`,
      skills: ["memory", "visual discrimination"], difficulty: idx % 2 === 0 ? "easy" : "medium",
      estimatedMinutes: 4, supportsShared: true, supportsMultiplayer: true,
      config: { theme, pairs: 4 },
    });
  });

  const newSort2: Array<[string, string[]]> = [
    ["Sort Sky vs Ground", ["Sky", "Land"]],
    ["Sort Loud vs Quiet Sounds", ["Loud", "Quiet"]],
  ];
  newSort2.forEach(([name, categories]) => {
    games.push({
      id: gid(), name, emoji: "📦", category: "sorting", engine: "sorting",
      description: "Two groups, one rule — sort them all",
      skills: ["categorization", "cognitive"], difficulty: "easy",
      estimatedMinutes: 5, supportsShared: true, supportsMultiplayer: true,
      config: { categories },
    });
  });

  return games;
}

export const allGames = makeGames();

export function getGameById(id: string): GameConfig | undefined {
  return allGames.find((game) => game.id === id);
}
