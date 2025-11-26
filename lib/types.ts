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
  width: number;
  height: number;
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
}

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

export const SELF_EVAL_CRITERIA: SelfEvaluationCriteria[] = [
  {
    id: "problem-fit",
    label: "Problem Fit",
    emoji: "🎯",
    description: "How well does this solve the real problem?",
    lowLabel: "Doesn't quite fit",
    highLabel: "Perfect match!",
    color: "#f472b6", // pink
  },
  {
    id: "user-love",
    label: "User Love",
    emoji: "💜",
    description: "Would users actually want this?",
    lowLabel: "Meh, maybe",
    highLabel: "They'd love it!",
    color: "#a78bfa", // purple
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
}

export const INITIAL_SESSION_STATE: SessionState = {
  projectId: "",
  hmwStatement: "",
  notes: [],
  questions: [],
  concepts: [],
  evaluations: [],
  currentPhase: "hmw",
  selectedConceptIds: [],
  tokenAllocation: {},
  viewport: { centerX: 0, centerY: 0, zoom: 1 },
  createdAt: Date.now(),
  isExampleSession: false,
};

// Original light colors for reference/mapping
const LIGHT_COLORS = {
  yellow: "#fef3c7",
  red: "#fecaca",
  green: "#bbf7d0",
  blue: "#bfdbfe",
  purple: "#e9d5ff",
  pink: "#fbcfe8",
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
