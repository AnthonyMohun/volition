// Core data types for the application

export interface ImageAttachment {
  dataUrl: string;
  name: string;
  type: string;
  size: number;
  caption?: string;
}

export interface StickyNote {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  isConcept: boolean;
  image?: ImageAttachment;
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
