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
