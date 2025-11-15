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
    <div className="fixed top-24 right-6 glass rounded-lg p-3 z-30 border border-gray-700/50">
      <div className="text-xs font-medium text-gray-400 mb-2">Canvas Map</div>
      <div
        ref={minimapRef}
        className="relative bg-black/30 rounded cursor-pointer overflow-hidden"
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
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
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
          const displayColor = colorMap[note.color.toLowerCase()] || "#888";

          return (
            <div
              key={note.id}
              className="absolute rounded-sm"
              style={{
                left: note.x * scaleX,
                top: note.y * scaleY,
                width: 64 * scaleX,
                height: 40 * scaleY,
                backgroundColor: displayColor,
                opacity: note.isConcept ? 1 : 0.6,
                border: note.isConcept ? "1px solid #facc15" : "none",
              }}
            />
          );
        })}

        {/* Viewport indicator */}
        <div
          className="absolute border-2 border-purple-400 bg-purple-400/10 rounded pointer-events-none"
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
