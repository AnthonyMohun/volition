"use client";

interface CanvasGridProps {
  zoom: number;
  panX: number;
  panY: number;
  gridSize?: number;
  showGrid: boolean;
}

export function CanvasGrid({
  zoom,
  panX,
  panY,
  gridSize = 20,
  showGrid,
}: CanvasGridProps) {
  if (!showGrid) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px)",
        backgroundSize: `${gridSize}px ${gridSize}px`,
        zIndex: 0,
      }}
    />
  );
}

// Snap position to grid
export function snapToGrid(
  position: number,
  gridSize: number,
  enabled: boolean
): number {
  if (!enabled) return position;
  return Math.round(position / gridSize) * gridSize;
}

// Calculate alignment guides when dragging
export function calculateAlignmentGuides(
  draggingNote: { x: number; y: number; width: number; height: number },
  otherNotes: Array<{ x: number; y: number; width: number; height: number }>,
  threshold: number = 5
): {
  verticalGuides: number[];
  horizontalGuides: number[];
  snapX: number | null;
  snapY: number | null;
} {
  const verticalGuides: number[] = [];
  const horizontalGuides: number[] = [];
  let snapX: number | null = null;
  let snapY: number | null = null;

  const draggingCenterX = draggingNote.x + draggingNote.width / 2;
  const draggingCenterY = draggingNote.y + draggingNote.height / 2;
  const draggingRight = draggingNote.x + draggingNote.width;
  const draggingBottom = draggingNote.y + draggingNote.height;

  otherNotes.forEach((note) => {
    const centerX = note.x + note.width / 2;
    const centerY = note.y + note.height / 2;
    const right = note.x + note.width;
    const bottom = note.y + note.height;

    // Check vertical alignment (X-axis)
    // Left edges
    if (Math.abs(draggingNote.x - note.x) < threshold) {
      verticalGuides.push(note.x);
      if (snapX === null) snapX = note.x;
    }
    // Right edges
    if (Math.abs(draggingRight - right) < threshold) {
      verticalGuides.push(right);
      if (snapX === null) snapX = right - draggingNote.width;
    }
    // Centers
    if (Math.abs(draggingCenterX - centerX) < threshold) {
      verticalGuides.push(centerX);
      if (snapX === null) snapX = centerX - draggingNote.width / 2;
    }

    // Check horizontal alignment (Y-axis)
    // Top edges
    if (Math.abs(draggingNote.y - note.y) < threshold) {
      horizontalGuides.push(note.y);
      if (snapY === null) snapY = note.y;
    }
    // Bottom edges
    if (Math.abs(draggingBottom - bottom) < threshold) {
      horizontalGuides.push(bottom);
      if (snapY === null) snapY = bottom - draggingNote.height;
    }
    // Centers
    if (Math.abs(draggingCenterY - centerY) < threshold) {
      horizontalGuides.push(centerY);
      if (snapY === null) snapY = centerY - draggingNote.height / 2;
    }
  });

  return {
    verticalGuides: [...new Set(verticalGuides)],
    horizontalGuides: [...new Set(horizontalGuides)],
    snapX,
    snapY,
  };
}
