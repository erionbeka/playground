import React, { createContext, useCallback, useContext, useState } from "react";
import { Difficulty } from "@/data/games";

export type AssignmentType = "homework" | "classwork";

export interface FamilyMember {
  id: string;
  name: string;
  relationship: "parent" | "sibling" | "grandparent" | "aunt-uncle" | "other";
  avatar: string;
  phoneNumber: string;
  password: string;
}

export interface Child {
  id: string;
  name: string;
  avatar: string;
  age: number;
  notes: string;
  diagnosis?: string;
  familyMembers: FamilyMember[];
}

export interface HomeworkAssignment {
  id: string;
  childId: string;
  type: AssignmentType;
  gameIds: string[];
  difficulty: Difficulty;
  mode: "single" | "shared" | "multiplayer";
  notes: string;
  dueDate: string;
  createdAt: string;
  status: "pending" | "in-progress" | "completed";
  completedGames: string[];
  results: GameResult[];
  assignedFamilyMemberId?: string;
}

export interface GameResult {
  gameId: string;
  assignmentId: string;
  completedAt: string;
  durationSeconds: number;
  score: number;
  interactions: number;
  socialScore?: number;
  attentionSpan?: number;
  promptsNeeded?: number;
  emotionalRegulation?: number;
  communicationAttempts?: number;
  turnsCompleted?: number;
  frustrationEvents?: number;
  independenceLevel?: number;
  transitionEase?: number;
}

interface AppState {
  role: "none" | "therapist" | "parent";
  setRole: (r: "none" | "therapist" | "parent") => void;
  children: Child[];
  addChild: (c: Omit<Child, "id">) => void;
  removeChild: (id: string) => void;
  updateChild: (id: string, updates: Partial<Child>) => void;
  assignments: HomeworkAssignment[];
  createAssignment: (a: Omit<HomeworkAssignment, "id" | "createdAt" | "status" | "completedGames" | "results">) => void;
  completeGame: (assignmentId: string, result: Omit<GameResult, "assignmentId">) => void;
  removeGameFromAssignment: (assignmentId: string, gameId: string) => void;
  selectedChildId: string | null;
  setSelectedChildId: (id: string | null) => void;
  currentAssignment: HomeworkAssignment | null;
  setCurrentAssignment: (a: HomeworkAssignment | null) => void;
}

const AppContext = createContext<AppState | null>(null);

const defaultChildren: Child[] = [
  {
    id: "child-1",
    name: "Emma",
    avatar: "👧",
    age: 6,
    notes: "Prefers visual activities",
    diagnosis: "ASD Level 1",
    familyMembers: [
      { id: "fm-1", name: "Sarah", relationship: "parent", avatar: "👩", phoneNumber: "555-0101", password: "emma123" },
      { id: "fm-2", name: "Jake", relationship: "sibling", avatar: "👦", phoneNumber: "555-0102", password: "playtime" },
    ],
  },
  {
    id: "child-2",
    name: "Liam",
    avatar: "👦",
    age: 8,
    notes: "Good with patterns",
    diagnosis: "ASD Level 2",
    familyMembers: [
      { id: "fm-3", name: "Maria", relationship: "parent", avatar: "👩", phoneNumber: "555-0201", password: "liam123" },
      { id: "fm-4", name: "Grandma Rose", relationship: "grandparent", avatar: "👵", phoneNumber: "555-0202", password: "rosehome" },
    ],
  },
  {
    id: "child-3",
    name: "Sofia",
    avatar: "👧",
    age: 5,
    notes: "Loves animals",
    diagnosis: "ASD Level 1",
    familyMembers: [
      { id: "fm-5", name: "Ana", relationship: "parent", avatar: "👩", phoneNumber: "555-0301", password: "sofia123" },
      { id: "fm-6", name: "Mia", relationship: "sibling", avatar: "👧", phoneNumber: "555-0302", password: "animalfun" },
      { id: "fm-7", name: "Uncle Carlos", relationship: "aunt-uncle", avatar: "👨", phoneNumber: "555-0303", password: "carlosplay" },
    ],
  },
];

const defaultAssignments: HomeworkAssignment[] = [
  {
    id: "hw-1",
    childId: "child-1",
    type: "homework",
    gameIds: ["game-004", "game-016", "game-040"],
    difficulty: "easy",
    mode: "shared",
    notes: "Focus on turn-taking. Parent should play alongside.",
    dueDate: "2026-04-07",
    createdAt: "2026-04-03",
    status: "pending",
    completedGames: [],
    results: [],
    assignedFamilyMemberId: "fm-1",
  },
  {
    id: "hw-2",
    childId: "child-2",
    type: "homework",
    gameIds: ["game-020", "game-055", "game-070"],
    difficulty: "medium",
    mode: "single",
    notes: "Practice sequencing and sorting independently.",
    dueDate: "2026-04-06",
    createdAt: "2026-04-02",
    status: "in-progress",
    completedGames: ["game-020"],
    results: [
      {
        gameId: "game-020",
        assignmentId: "hw-2",
        completedAt: "2026-04-04",
        durationSeconds: 240,
        score: 85,
        interactions: 32,
        attentionSpan: 7,
        promptsNeeded: 3,
        emotionalRegulation: 8,
        communicationAttempts: 5,
        turnsCompleted: 12,
        frustrationEvents: 1,
        independenceLevel: 7,
        transitionEase: 8,
      },
    ],
  },
  {
    id: "hw-3",
    childId: "child-3",
    type: "homework",
    gameIds: ["game-004", "game-008"],
    difficulty: "easy",
    mode: "shared",
    notes: "Animal matching games, her favorite!",
    dueDate: "2026-04-05",
    createdAt: "2026-04-01",
    status: "completed",
    completedGames: ["game-004", "game-008"],
    results: [
      {
        gameId: "game-004",
        assignmentId: "hw-3",
        completedAt: "2026-04-03",
        durationSeconds: 180,
        score: 90,
        interactions: 24,
        socialScore: 8,
        attentionSpan: 8,
        promptsNeeded: 2,
        emotionalRegulation: 9,
        communicationAttempts: 7,
        turnsCompleted: 10,
        frustrationEvents: 0,
        independenceLevel: 8,
        transitionEase: 9,
      },
      {
        gameId: "game-008",
        assignmentId: "hw-3",
        completedAt: "2026-04-04",
        durationSeconds: 200,
        score: 75,
        interactions: 28,
        socialScore: 7,
        attentionSpan: 6,
        promptsNeeded: 4,
        emotionalRegulation: 7,
        communicationAttempts: 5,
        turnsCompleted: 8,
        frustrationEvents: 2,
        independenceLevel: 6,
        transitionEase: 7,
      },
    ],
    assignedFamilyMemberId: "fm-5",
  },
  {
    id: "cw-1",
    childId: "child-1",
    type: "classwork",
    gameIds: ["game-052", "game-053", "game-054"],
    difficulty: "easy",
    mode: "multiplayer",
    notes: "Group session - practice social interactions with peers.",
    dueDate: "2026-04-04",
    createdAt: "2026-04-04",
    status: "pending",
    completedGames: [],
    results: [],
  },
  {
    id: "cw-2",
    childId: "child-2",
    type: "classwork",
    gameIds: ["game-055", "game-056"],
    difficulty: "medium",
    mode: "multiplayer",
    notes: "Clinic session - work on sharing and taking turns with another child.",
    dueDate: "2026-04-04",
    createdAt: "2026-04-04",
    status: "in-progress",
    completedGames: ["game-055"],
    results: [
      {
        gameId: "game-055",
        assignmentId: "cw-2",
        completedAt: "2026-04-04",
        durationSeconds: 300,
        score: 80,
        interactions: 40,
        socialScore: 9,
        attentionSpan: 7,
        promptsNeeded: 2,
        emotionalRegulation: 8,
        communicationAttempts: 12,
        turnsCompleted: 15,
        frustrationEvents: 1,
        independenceLevel: 6,
        transitionEase: 7,
      },
    ],
  },
];

export function AppProvider({ children: childrenNodes }: { children: React.ReactNode }) {
  const [role, setRole] = useState<"none" | "therapist" | "parent">("none");
  const [children, setChildren] = useState<Child[]>(defaultChildren);
  const [assignments, setAssignments] = useState<HomeworkAssignment[]>(defaultAssignments);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [currentAssignment, setCurrentAssignment] = useState<HomeworkAssignment | null>(null);

  const addChild = useCallback((child: Omit<Child, "id">) => {
    setChildren((prev) => [...prev, { ...child, id: `child-${Date.now()}` }]);
  }, []);

  const removeChild = useCallback((id: string) => {
    setChildren((prev) => prev.filter((child) => child.id !== id));
  }, []);

  const updateChild = useCallback((id: string, updates: Partial<Child>) => {
    setChildren((prev) => prev.map((child) => (child.id === id ? { ...child, ...updates } : child)));
  }, []);

  const createAssignment = useCallback(
    (assignment: Omit<HomeworkAssignment, "id" | "createdAt" | "status" | "completedGames" | "results">) => {
      const prefix = assignment.type === "classwork" ? "cw" : "hw";
      setAssignments((prev) => [
        ...prev,
        {
          ...assignment,
          id: `${prefix}-${Date.now()}`,
          createdAt: new Date().toISOString().slice(0, 10),
          status: "pending",
          completedGames: [],
          results: [],
        },
      ]);
    },
    []
  );

  const completeGame = useCallback((assignmentId: string, result: Omit<GameResult, "assignmentId">) => {
    setAssignments((prev) =>
      prev.map((assignment) => {
        if (assignment.id !== assignmentId) return assignment;

        const completedGames = [...assignment.completedGames, result.gameId];
        const results = [...assignment.results, { ...result, assignmentId }];
        const status = completedGames.length >= assignment.gameIds.length ? ("completed" as const) : ("in-progress" as const);

        return { ...assignment, completedGames, results, status };
      })
    );
  }, []);

  const removeGameFromAssignment = useCallback((assignmentId: string, gameId: string) => {
    setAssignments((prev) =>
      prev.flatMap((assignment) => {
        if (assignment.id !== assignmentId) return [assignment];

        const gameIds = assignment.gameIds.filter((id) => id !== gameId);
        if (gameIds.length === 0) return [];

        const completedGames = assignment.completedGames.filter((id) => id !== gameId);
        const results = assignment.results.filter((result) => result.gameId !== gameId);
        const status = completedGames.length === 0 ? "pending" : completedGames.length >= gameIds.length ? "completed" : "in-progress";

        return [{ ...assignment, gameIds, completedGames, results, status }];
      })
    );
  }, []);

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        children,
        addChild,
        removeChild,
        updateChild,
        assignments,
        createAssignment,
        completeGame,
        removeGameFromAssignment,
        selectedChildId,
        setSelectedChildId,
        currentAssignment,
        setCurrentAssignment,
      }}
    >
      {childrenNodes}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
