import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { StickyNote } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Image compression utility
export async function compressImage(
  file: File,
  maxWidth = 1024,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
              resolve(reader.result as string);
            };
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
  });
}

// Standard note dimensions used across the app
const NOTE_WIDTH = 256;
const NOTE_HEIGHT = 200;
const NOTE_PADDING = 24; // Gap between notes

// Check if two rectangles overlap (with padding)
function rectsOverlap(
  x1: number,
  y1: number,
  w1: number,
  h1: number,
  x2: number,
  y2: number,
  w2: number,
  h2: number,
  padding: number
): boolean {
  // Two rectangles do NOT overlap if one is completely to the left, right, above, or below the other
  const noOverlap =
    x1 + w1 + padding <= x2 || // rect1 is to the left of rect2
    x2 + w2 + padding <= x1 || // rect2 is to the left of rect1
    y1 + h1 + padding <= y2 || // rect1 is above rect2
    y2 + h2 + padding <= y1; // rect2 is above rect1

  return !noOverlap;
}

// Check if a position overlaps with any existing notes
function hasCollision(
  x: number,
  y: number,
  existingNotes: StickyNote[]
): boolean {
  for (const note of existingNotes) {
    if (
      rectsOverlap(
        x,
        y,
        NOTE_WIDTH,
        NOTE_HEIGHT,
        note.x,
        note.y,
        NOTE_WIDTH,
        NOTE_HEIGHT,
        NOTE_PADDING
      )
    ) {
      return true;
    }
  }
  return false;
}

// Find a non-overlapping position for a new note using grid-based placement
export function findNonOverlappingPosition(
  existingNotes: StickyNote[],
  preferredX: number,
  preferredY: number,
  noteWidth = NOTE_WIDTH,
  noteHeight = NOTE_HEIGHT,
  maxAttempts = 200
): { x: number; y: number } {
  // If no existing notes, place at preferred position (centered)
  if (existingNotes.length === 0) {
    return { x: preferredX - noteWidth / 2, y: preferredY - noteHeight / 2 };
  }

  // Calculate the bounding box of existing notes
  const notesMinX = Math.min(...existingNotes.map((n) => n.x));
  const notesMaxX = Math.max(...existingNotes.map((n) => n.x + NOTE_WIDTH));
  const notesMinY = Math.min(...existingNotes.map((n) => n.y));
  const notesMaxY = Math.max(...existingNotes.map((n) => n.y + NOTE_HEIGHT));

  const notesCenterX = (notesMinX + notesMaxX) / 2;
  const notesCenterY = (notesMinY + notesMaxY) / 2;

  // Grid spacing for note placement
  const gridSpacingX = NOTE_WIDTH + NOTE_PADDING;
  const gridSpacingY = NOTE_HEIGHT + NOTE_PADDING;

  // Calculate starting position - use notes center if preferred position is far away
  const distToNotesCenter = Math.sqrt(
    Math.pow(preferredX - notesCenterX, 2) +
      Math.pow(preferredY - notesCenterY, 2)
  );

  // Determine the spiral center based on whether we're close to notes or not
  let spiralCenterX: number;
  let spiralCenterY: number;

  if (distToNotesCenter > 600) {
    // Start from notes center if viewport is far from notes
    spiralCenterX = notesCenterX - noteWidth / 2;
    spiralCenterY = notesCenterY - noteHeight / 2;
  } else {
    // Start from preferred position
    spiralCenterX = preferredX - noteWidth / 2;
    spiralCenterY = preferredY - noteHeight / 2;
  }

  // Check the center position first
  if (!hasCollision(spiralCenterX, spiralCenterY, existingNotes)) {
    return { x: spiralCenterX, y: spiralCenterY };
  }

  // Spiral search: check positions in expanding rings
  // Pattern: right, down, left, up - expanding outward
  // Ring 1: (1,0), (1,1), (0,1), (-1,1), (-1,0), (-1,-1), (0,-1), (1,-1)
  // Ring 2: (2,0), (2,1), (2,2), (1,2), (0,2), (-1,2), (-2,2), ...etc

  for (let ring = 1; ring <= Math.ceil(Math.sqrt(maxAttempts)); ring++) {
    // Check all positions in this ring
    // Top edge: from (ring, -ring) to (ring, ring)
    for (let i = -ring; i <= ring; i++) {
      const testX = spiralCenterX + ring * gridSpacingX;
      const testY = spiralCenterY + i * gridSpacingY;
      if (!hasCollision(testX, testY, existingNotes)) {
        return { x: testX, y: testY };
      }
    }

    // Bottom edge: from (-ring, -ring) to (-ring, ring)
    for (let i = -ring; i <= ring; i++) {
      const testX = spiralCenterX - ring * gridSpacingX;
      const testY = spiralCenterY + i * gridSpacingY;
      if (!hasCollision(testX, testY, existingNotes)) {
        return { x: testX, y: testY };
      }
    }

    // Left edge: from (-ring+1, -ring) to (ring-1, -ring) - excluding corners
    for (let i = -ring + 1; i <= ring - 1; i++) {
      const testX = spiralCenterX + i * gridSpacingX;
      const testY = spiralCenterY - ring * gridSpacingY;
      if (!hasCollision(testX, testY, existingNotes)) {
        return { x: testX, y: testY };
      }
    }

    // Right edge: from (-ring+1, ring) to (ring-1, ring) - excluding corners
    for (let i = -ring + 1; i <= ring - 1; i++) {
      const testX = spiralCenterX + i * gridSpacingX;
      const testY = spiralCenterY + ring * gridSpacingY;
      if (!hasCollision(testX, testY, existingNotes)) {
        return { x: testX, y: testY };
      }
    }
  }

  // Fallback: place to the right of the rightmost note
  return {
    x: notesMaxX + NOTE_PADDING,
    y: notesMinY,
  };
}

// AI Concept Evaluation interface for iteration canvas
export interface AIConceptEvaluationForCanvas {
  conceptId: string;
  overallScore: number;
  criteria: {
    problemFit: { score: number; feedback: string };
    originality: { score: number; feedback: string };
    feasibility: { score: number; feedback: string };
  };
  strengths: string[];
  improvements: string[];
  summary?: string;
}

// Build iteration canvas from final concepts with AI feedback as connected notes
export function buildIterationCanvas(
  concepts: StickyNote[],
  aiEvaluations: AIConceptEvaluationForCanvas[],
  hmwStatement: string
): { notes: StickyNote[]; connections: NoteConnection[] } {
  const notes: StickyNote[] = [];
  const connections: NoteConnection[] = [];

  // Layout constants - column layout for easy scanning
  const CONCEPT_COLUMN_X = 800; // Center column for concepts
  const STRENGTHS_COLUMN_X = 200; // Left column for strengths (green)
  const IMPROVEMENTS_COLUMN_X = 1400; // Right column for improvements (amber)
  const VERTICAL_SPACING = 280; // Space between notes vertically
  const CONCEPT_VERTICAL_SPACING = 600; // Space between concept groups
  const START_Y = 200;

  // Colors
  const STRENGTH_COLOR = "#bbf7d0"; // green-200
  const IMPROVEMENT_COLOR = "#fef3c7"; // amber-100

  concepts.forEach((concept, conceptIdx) => {
    const aiEval = aiEvaluations.find((e) => e.conceptId === concept.id);
    const baseY = START_Y + conceptIdx * CONCEPT_VERTICAL_SPACING;

    // Create concept note (center column)
    const conceptNote: StickyNote = {
      ...concept,
      id: `iter-concept-${concept.id}-${Date.now()}`,
      x: CONCEPT_COLUMN_X,
      y: baseY,
      isConcept: true,
      createdAt: Date.now(),
    };
    notes.push(conceptNote);

    if (aiEval) {
      // Calculate vertical offset to center feedback notes around concept
      const maxFeedbackCount = Math.max(
        aiEval.strengths.length,
        aiEval.improvements.length
      );
      const feedbackOffset = ((maxFeedbackCount - 1) * VERTICAL_SPACING) / 2;

      // Create strength notes (left column, green)
      aiEval.strengths.forEach((strength, i) => {
        const strengthNote: StickyNote = {
          id: `iter-strength-${concept.id}-${i}-${Date.now()}`,
          text: strength,
          x: STRENGTHS_COLUMN_X,
          y: baseY - feedbackOffset + i * VERTICAL_SPACING,
          color: STRENGTH_COLOR,
          isConcept: false,
          sourceQuestion: "What's Working ✓",
          createdAt: Date.now() + i,
        };
        notes.push(strengthNote);

        // Connect concept to strength
        connections.push({
          id: `iter-conn-str-${concept.id}-${i}-${Date.now()}`,
          fromNoteId: conceptNote.id,
          toNoteId: strengthNote.id,
          type: "supports",
          createdAt: Date.now() + i,
        });
      });

      // Create improvement notes (right column, amber)
      aiEval.improvements.forEach((improvement, i) => {
        const improvementNote: StickyNote = {
          id: `iter-improve-${concept.id}-${i}-${Date.now()}`,
          text: improvement,
          x: IMPROVEMENTS_COLUMN_X,
          y: baseY - feedbackOffset + i * VERTICAL_SPACING,
          color: IMPROVEMENT_COLOR,
          isConcept: false,
          sourceQuestion: "Room to Grow →",
          createdAt: Date.now() + i + 100,
        };
        notes.push(improvementNote);

        // Connect concept to improvement
        connections.push({
          id: `iter-conn-imp-${concept.id}-${i}-${Date.now()}`,
          fromNoteId: conceptNote.id,
          toNoteId: improvementNote.id,
          type: "relates",
          createdAt: Date.now() + i + 100,
        });
      });
    }
  });

  return { notes, connections };
}

// Generate HMW sub-questions from improvements for Action Plan mode
export function generateActionPlanQuestions(
  concepts: StickyNote[],
  aiEvaluations: AIConceptEvaluationForCanvas[],
  originalHmw: string
): { conceptId: string; conceptText: string; hmwQuestions: string[] }[] {
  return concepts.map((concept) => {
    const aiEval = aiEvaluations.find((e) => e.conceptId === concept.id);
    const hmwQuestions: string[] = [];

    if (aiEval) {
      // Transform each improvement into a HMW sub-question
      aiEval.improvements.forEach((improvement) => {
        // Parse the improvement and create a HMW question
        const hmwQuestion = transformImprovementToHMW(improvement, concept.text);
        hmwQuestions.push(hmwQuestion);
      });

      // Add questions based on low-scoring criteria
      if (aiEval.criteria.problemFit.score <= 2) {
        hmwQuestions.push(
          `How might we make "${concept.text}" more directly address the original challenge?`
        );
      }
      if (aiEval.criteria.originality.score <= 2) {
        hmwQuestions.push(
          `How might we make "${concept.text}" more unique or differentiated?`
        );
      }
      if (aiEval.criteria.feasibility.score <= 2) {
        hmwQuestions.push(
          `How might we simplify "${concept.text}" to make it more achievable?`
        );
      }
    }

    return {
      conceptId: concept.id,
      conceptText: concept.text,
      hmwQuestions,
    };
  });
}

// Helper to transform an improvement suggestion into a HMW question
function transformImprovementToHMW(improvement: string, conceptText: string): string {
  // Common patterns to transform
  const lowerImprovement = improvement.toLowerCase();
  
  if (lowerImprovement.includes("add") || lowerImprovement.includes("include")) {
    return `How might we ${improvement.toLowerCase()}?`;
  }
  if (lowerImprovement.includes("consider")) {
    return improvement.replace(/consider/i, "How might we explore");
  }
  if (lowerImprovement.includes("need") || lowerImprovement.includes("should")) {
    const cleaned = improvement
      .replace(/needs? to/i, "")
      .replace(/should/i, "")
      .trim();
    return `How might we ${cleaned.toLowerCase()}?`;
  }
  if (lowerImprovement.includes("more")) {
    return `How might we make "${conceptText}" ${improvement.toLowerCase()}?`;
  }
  
  // Default transformation
  return `How might we address: ${improvement}`;
}

// Type for NoteConnection (import from types.ts in actual usage)
import { NoteConnection } from "./types";
