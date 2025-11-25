"use client";

import { useRef, useEffect } from "react";
import { StickyNote } from "@/lib/types";

interface CanvasMinimapProps {
  notes: StickyNote[];
  canvasWidth: number;
  canvasHeight: number;
  viewportX: number;
  viewportY: number;
  viewportWidth: number;
  viewportHeight: number;
  zoom: number;
  onViewportMove: (x: number, y: number) => void;
}

export function CanvasMinimap({
  notes,
  canvasWidth,
  canvasHeight,
  viewportX,
  viewportY,
  viewportWidth,
  viewportHeight,
  zoom,
  onViewportMove,
}: CanvasMinimapProps) {
  const minimapRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Minimap dimensions
  const MINIMAP_WIDTH = 200;
  const MINIMAP_HEIGHT = 150;

  // Calculate scale factors
  const scaleX = MINIMAP_WIDTH / canvasWidth;
  const scaleY = MINIMAP_HEIGHT / canvasHeight;

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!minimapRef.current) return;

    const rect = minimapRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scaleX - viewportWidth / zoom / 2;
    const y = (e.clientY - rect.top) / scaleY - viewportHeight / zoom / 2;

    onViewportMove(x, y);
  };

  const handleMinimapDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !minimapRef.current) return;

    const rect = minimapRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scaleX - viewportWidth / zoom / 2;
    const y = (e.clientY - rect.top) / scaleY - viewportHeight / zoom / 2;

    onViewportMove(x, y);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    handleMinimapClick(e);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  return (
    <div className="fixed top-32 right-6 fun-card p-3 z-30">
      <div className="text-xs font-bold text-gray-500 mb-2">Canvas Map</div>
      <div
        ref={minimapRef}
        className="relative bg-gray-100 rounded-lg cursor-pointer overflow-hidden border border-gray-200"
        style={{
          width: MINIMAP_WIDTH,
          height: MINIMAP_HEIGHT,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMinimapDrag}
        onMouseUp={handleMouseUp}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Notes */}
        {notes.map((note) => {
          const colorMap: Record<string, string> = {
            "#fef3c7": "#facc15",
            "#fecaca": "#f87171",
            "#bbf7d0": "#4ade80",
            "#bfdbfe": "#60a5fa",
            "#e9d5ff": "#a855f7",
            "#fbcfe8": "#ec4899",
          };
          const displayColor = colorMap[note.color.toLowerCase()] || "#9ca3af";

          return (
            <div
              key={note.id}
              className="absolute rounded-sm shadow-sm"
              style={{
                left: note.x * scaleX,
                top: note.y * scaleY,
                width: 64 * scaleX,
                height: 40 * scaleY,
                backgroundColor: displayColor,
                opacity: note.isConcept ? 1 : 0.8,
                border: note.isConcept ? "2px solid #facc15" : "none",
              }}
            />
          );
        })}

        {/* Viewport indicator */}
        <div
          className="absolute border-2 border-indigo-500 bg-indigo-500/10 rounded pointer-events-none"
          style={{
            left: viewportX * scaleX,
            top: viewportY * scaleY,
            width: (viewportWidth / zoom) * scaleX,
            height: (viewportHeight / zoom) * scaleY,
          }}
        />
      </div>
    </div>
  );
}
