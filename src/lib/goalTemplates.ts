import { SkillDomain, TherapyGoal } from "@/context/AppContext";

export interface GoalTemplate {
  id: string;
  title: string;
  domain: SkillDomain;
  targetLevel: number;
  notes: string;
}

export const goalTemplates: GoalTemplate[] = [
  {
    id: "goal-social-turn-taking",
    title: "Increase turn-taking in shared play",
    domain: "social",
    targetLevel: 80,
    notes: "Use shared play and waiting games with therapist-reviewed support fading.",
  },
  {
    id: "goal-communication-requests",
    title: "Expand functional communication attempts",
    domain: "communication",
    targetLevel: 78,
    notes: "Target requesting, labeling, or response opportunities during motivating games.",
  },
  {
    id: "goal-attention-complete-task",
    title: "Sustain attention until task completion",
    domain: "attention",
    targetLevel: 75,
    notes: "Use short activities first, then gradually extend independent completion.",
  },
  {
    id: "goal-motor-copy-pattern",
    title: "Improve fine-motor control through model copying",
    domain: "motor",
    targetLevel: 72,
    notes: "Use tapping, tracing, and build-from-model activities with support-level adjustments.",
  },
  {
    id: "goal-sequencing-generalize",
    title: "Generalize sequencing across routines and patterns",
    domain: "sequencing",
    targetLevel: 82,
    notes: "Blend routines, pattern-copying, and construction tasks to support flexible sequencing.",
  },
  {
    id: "goal-regulation-transitions",
    title: "Improve regulation during transitions",
    domain: "emotional-regulation",
    targetLevel: 70,
    notes: "Monitor frustration, cue transitions early, and use calming supports before difficulty increases.",
  },
];

export function buildGoalFromTemplate(template: GoalTemplate): TherapyGoal {
  return {
    id: `goal-${Date.now()}-${template.id}`,
    title: template.title,
    domain: template.domain,
    targetLevel: template.targetLevel,
    status: "active",
    notes: template.notes,
  };
}
