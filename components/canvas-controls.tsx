"use client";

import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Maximize,
  Map,
  AlignJustify,
  Grid3x3,
  Columns3Cog,
} from "lucide-react";
import { useState } from "react";

interface CanvasControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToContent: () => void;
  onResetView: () => void;
  showMinimap: boolean;
  onToggleMinimap: () => void;
  showAlignment: boolean;
  onToggleAlignment: () => void;
  gridSnap: boolean;
  onToggleGridSnap: () => void;
}

export function CanvasControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onFitToContent,
  onResetView,
  showMinimap,
  onToggleMinimap,
  showAlignment,
  onToggleAlignment,
  gridSnap,
  onToggleGridSnap,
}: CanvasControlsProps) {
  // note: voice state is handled in the top toolbar (page.tsx)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Keyboard push-to-talk is handled globally in app/canvas/page.tsx
  return (
    <div className="fixed bottom-4 right-4 z-20 safe-area-bottom">
      {isCollapsed ? (
        <div className="w-12 md:w-14 fun-card p-2 rounded-xl shadow-md flex items-start">
          <button
            className="w-full flex items-center justify-start pl-1 md:pl-2 p-2 rounded-lg text-gray-500 hover:text-indigo-600 touch-target-sm"
            title="Open settings"
            onClick={() => setIsCollapsed(false)}
            aria-expanded={false}
            aria-label="Open Settings"
          >
            <Columns3Cog className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="w-12 md:w-14 fun-card p-2 flex flex-col items-start gap-1 md:gap-2 z-20">
          {/* Zoom In */}
          <button
            onClick={onZoomIn}
            disabled={zoom >= 2}
            className="w-full flex items-center justify-start pl-1 md:pl-2 p-2 rounded-lg hover:bg-indigo-50 transition-all text-gray-500 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed touch-target-sm"
            title="Zoom in (Ctrl/Cmd + +)"
          >
            <ZoomIn className="w-5 h-5" />
          </button>

          {/* Zoom Level Display */}
          <div className="w-full px-1 md:px-2 py-1 text-xs font-bold text-gray-400 text-center flex items-center justify-center">
            {Math.round(zoom * 100)}%
          </div>

          {/* Zoom Out */}
          <button
            onClick={onZoomOut}
            disabled={zoom <= 0.25}
            className="w-full flex items-center justify-start pl-1 md:pl-2 p-2 rounded-lg hover:bg-indigo-50 transition-all text-gray-500 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed touch-target-sm"
            title="Zoom out (Ctrl/Cmd + -)"
          >
            <ZoomOut className="w-5 h-5" />
          </button>

          <div className="w-full border-t border-gray-200 my-1" />

          {/* Fit to Content */}
          <button
            onClick={onFitToContent}
            className="w-full flex items-center justify-start pl-1 md:pl-2 p-2 rounded-lg hover:bg-indigo-50 transition-all text-gray-500 hover:text-indigo-600 touch-target-sm"
            title="Fit to content (Ctrl/Cmd + 0)"
          >
            <Maximize2 className="w-5 h-5" />
          </button>

          {/* Reset View */}
          <button
            onClick={onResetView}
            className="w-full flex items-center justify-start pl-1 md:pl-2 p-2 rounded-lg hover:bg-indigo-50 transition-all text-gray-500 hover:text-indigo-600 touch-target-sm"
            title="Reset view (Ctrl/Cmd + R)"
          >
            <Maximize className="w-5 h-5" />
          </button>

          <div className="w-full border-t border-gray-200 my-1" />

          {/* Toggle Minimap */}
          <button
            onClick={onToggleMinimap}
            className={`w-full flex items-center justify-start pl-1 md:pl-2 p-2 rounded-lg transition-all touch-target-sm ${
              showMinimap
                ? "bg-indigo-100 text-indigo-600"
                : "text-gray-500 hover:bg-indigo-50 hover:text-indigo-600"
            }`}
            title="Toggle minimap (Ctrl/Cmd + M)"
          >
            <Map className="w-5 h-5" />
          </button>
          {/* Microphone control has moved to the top toolbar */}
          {/* Divider separating minimap from alignment toggle */}
          <div className="w-full border-t border-gray-200 my-1" />
          {/* Toggle Alignment Guides */}
          <button
            onClick={onToggleAlignment}
            className={`w-full flex items-center justify-start pl-1 md:pl-2 p-2 rounded-lg transition-all touch-target-sm ${
              showAlignment
                ? "bg-indigo-100 text-indigo-600"
                : "text-gray-500 hover:bg-indigo-50 hover:text-indigo-600"
            }`}
            title="Toggle alignment guides"
          >
            <AlignJustify className="w-5 h-5" />
          </button>
          {/* Grid Snap */}
          <button
            onClick={onToggleGridSnap}
            className={`w-full flex items-center justify-start pl-1 md:pl-2 p-2 rounded-lg transition-all touch-target-sm ${
              gridSnap
                ? "bg-indigo-100 text-indigo-600"
                : "text-gray-500 hover:bg-indigo-50 hover:text-indigo-600"
            }`}
            title="Toggle grid snap (Ctrl/Cmd + G)"
          >
            <Grid3x3 className="w-5 h-5" />
          </button>
          <div className="w-full border-t border-gray-200 my-1" />
          <button
            className="w-full flex items-center justify-start pl-1 md:pl-2 p-2 rounded-lg transition-all text-gray-500 touch-target-sm"
            title="Collapse settings"
            onClick={() => setIsCollapsed(true)}
            aria-expanded={true}
            aria-label="Close Settings"
          >
            <Columns3Cog className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
