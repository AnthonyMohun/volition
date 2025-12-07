// Core data types for the application

export interface ImageAttachment {
  dataUrl: string;
  name: string;
  type: string;
  size: number;
  caption?: string;
}

export interface CanvasPath {
  drawMode: boolean;
  strokeColor: string;
  strokeWidth: number;
  paths: { x: number; y: number }[];
}

export interface DrawingData {
  paths: CanvasPath[];
  dataUrl?: string; // Thumbnail for display
  width: number | string;
  height: number | string;
}

export type NoteContentType = "text" | "drawing" | "both";

export interface StickyNote {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  isConcept: boolean;
  image?: ImageAttachment;
  drawing?: DrawingData;
  contentType?: NoteContentType;
  details?: string;
  createdAt: number;
  // Source question - permanently displayed on note when created from AI panel
  questionId?: string;
  sourceQuestion?: string;
  // Flag to enable immediate edit mode on creation
  isNewNote?: boolean;
  // Refine phase structured fields
  targetAudience?: string;
  platform?: string[];
  physicalFormat?: string[];
  keyBenefits?: string;
  mainFeatures?: string;
}

// Connection type for linking notes together
export type ConnectionType = "relates" | "causes" | "supports" | "contradicts";

export interface NoteConnection {
  id: string;
  fromNoteId: string;
  toNoteId: string;
  type: ConnectionType;
  label?: string;
  createdAt: number;
}

export const CONNECTION_TYPES: Record<
  ConnectionType,
  { label: string; emoji: string; color: string }
> = {
  relates: { label: "Relates to", emoji: "🔗", color: "#60a5fa" }, // blue
  causes: { label: "Leads to", emoji: "➡️", color: "#34d399" }, // green
  supports: { label: "Supports", emoji: "💪", color: "#a78bfa" }, // purple
  contradicts: { label: "Contradicts", emoji: "⚡", color: "#f87171" }, // red
};

export interface AIQuestion {
  id: string;
  text: string;
  fromAI: boolean;
  answered: boolean;
  pinned?: boolean;
  timestamp: number;
}

export interface Concept {
  id: string;
  title: string;
  noteIds: string[];
  description: string;
  createdAt: number;
}

export interface ConceptEvaluation {
  conceptId: string;
  aiScore: number;
  aiReasons: string[];
  studentScore?: number;
  studentNotes?: string;
}

// Self-evaluation types for interactive student assessment
export interface SelfEvaluationCriteria {
  id: string;
  label: string;
  emoji: string;
  description: string;
  lowLabel: string;
  highLabel: string;
  color: string;
}

export interface SelfEvaluationRating {
  criteriaId: string;
  score: number; // 1-5
  reflection?: string;
}

export interface ConceptSelfEvaluation {
  conceptId: string;
  ratings: SelfEvaluationRating[];
  overallReflection?: string;
  completedAt?: number;
}

// Growth-based feedback tiers (replaces numeric scores for student-facing display)
export type GrowthTier = "seed" | "sprout" | "tree" | "forest";

export interface GrowthTierInfo {
  tier: GrowthTier;
  emoji: string;
  label: string;
  description: string;
  color: string; // Tailwind-friendly gradient start color
  encouragement: string;
}

export const GROWTH_TIERS: Record<GrowthTier, GrowthTierInfo> = {
  seed: {
    tier: "seed",
    emoji: "🌱",
    label: "Seed",
    description: "Needs more detail",
    color: "#a3e635", // lime-400
    encouragement:
      "Your idea needs more detail to fully evaluate. Try adding specifics about how it works or who it helps!",
  },
  sprout: {
    tier: "sprout",
    emoji: "🌿",
    label: "Sprout",
    description: "On the right track",
    color: "#4ade80", // green-400
    encouragement:
      "You're on the right track! A bit more thought will strengthen your concept.",
  },
  tree: {
    tier: "tree",
    emoji: "🌳",
    label: "Tree",
    description: "Well-developed",
    color: "#2dd4bf", // teal-400
    encouragement:
      "Solid work! Your concept shows clear thinking and could move forward confidently.",
  },
  forest: {
    tier: "forest",
    emoji: "🌲",
    label: "Forest",
    description: "Ready to present",
    color: "#61ABC4", // accent teal
    encouragement:
      "Excellent! Your concept is well-developed and ready to present!",
  },
};

// Map a 0-100 score to a growth tier (keeps internal score, shows friendly tier)
export function scoreToGrowthTier(score: number): GrowthTierInfo {
  if (score >= 81) return GROWTH_TIERS.forest;
  if (score >= 61) return GROWTH_TIERS.tree;
  if (score >= 41) return GROWTH_TIERS.sprout;
  return GROWTH_TIERS.seed;
}

// Map a 1-5 criteria score to growth tier (for individual criteria display)
export function criteriaScoreToGrowthTier(score: number): GrowthTierInfo {
  if (score >= 5) return GROWTH_TIERS.forest;
  if (score >= 4) return GROWTH_TIERS.tree;
  if (score >= 3) return GROWTH_TIERS.sprout;
  return GROWTH_TIERS.seed;
}

export const SELF_EVAL_CRITERIA: SelfEvaluationCriteria[] = [
  {
    id: "problem-fit",
    label: "Problem Fit",
    emoji: "🎯",
    description: "How well does this solve the real problem?",
    lowLabel: "Doesn't quite fit",
    highLabel: "Perfect match!",
    color: "#14b8a6", // teal
  },
  {
    id: "user-love",
    label: "User Love",
    emoji: "💜",
    description: "Would users actually want this?",
    lowLabel: "Meh, maybe",
    highLabel: "They'd love it!",
    color: "#3b82f6", // blue
  },
  {
    id: "doability",
    label: "Doability",
    emoji: "🛠️",
    description: "Can this realistically be built?",
    lowLabel: "Super tricky",
    highLabel: "Totally doable!",
    color: "#60a5fa", // blue
  },
  {
    id: "uniqueness",
    label: "Uniqueness",
    emoji: "✨",
    description: "Is this fresh and original?",
    lowLabel: "Pretty common",
    highLabel: "Super unique!",
    color: "#fbbf24", // yellow
  },
  {
    id: "excitement",
    label: "Excitement",
    emoji: "🚀",
    description: "How excited are YOU about this?",
    lowLabel: "It's okay",
    highLabel: "I'm pumped!",
    color: "#fb923c", // orange
  },
];

export interface SessionState {
  projectId: string;
  hmwStatement: string;
  notes: StickyNote[];
  connections: NoteConnection[];
  questions: AIQuestion[];
  concepts: Concept[];
  evaluations: ConceptEvaluation[];
  currentPhase: "hmw" | "canvas" | "select" | "refine" | "final";
  selectedConceptIds: string[];
  tokenAllocation: Record<string, number>;
  // Viewport: world (canvas) center coordinates and zoom level
  viewport?: {
    centerX: number;
    centerY: number;
    zoom: number;
  };
  createdAt: number;
  isExampleSession?: boolean;
  // Voice mode settings
  voiceMode?: boolean;
  voiceOutputEnabled?: boolean;
  lastSpokenText?: string;
  voiceTranscript?: string;
}

export const INITIAL_SESSION_STATE: SessionState = {
  projectId: "",
  hmwStatement: "",
  notes: [],
  connections: [],
  questions: [],
  concepts: [],
  evaluations: [],
  currentPhase: "hmw",
  selectedConceptIds: [],
  tokenAllocation: {},
  viewport: { centerX: 0, centerY: 0, zoom: 1 },
  createdAt: Date.now(),
  isExampleSession: false,
  voiceMode: false,
  voiceOutputEnabled: true,
  lastSpokenText: "",
  voiceTranscript: "",
};

// Original light colors for reference/mapping
const LIGHT_COLORS = {
  yellow: "#fef3c7",
  red: "#fecaca",
  green: "#bbf7d0",
  blue: "#bfdbfe",
  purple: "#dbeafe",
  pink: "#dcfce7",
};

// Dark mode sticky note colors - these are the base background colors
export const STICKY_COLORS = [
  LIGHT_COLORS.yellow,
  LIGHT_COLORS.blue,
  LIGHT_COLORS.green,
  LIGHT_COLORS.pink,
  LIGHT_COLORS.purple,
  LIGHT_COLORS.red,
];
