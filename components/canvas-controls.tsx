"use client";

import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Maximize,
  RotateCcw,
  Map,
  AlignJustify,
  Grid3x3,
} from "lucide-react";

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
  return (
    <div className="fixed bottom-24 right-6 w-14 glass rounded-lg p-2 flex flex-col items-start gap-2 z-20 border border-gray-700/50">
      {/* Zoom In */}
      <button
        onClick={onZoomIn}
        disabled={zoom >= 2}
        className="w-full flex items-center justify-start pl-2 p-2 rounded hover:bg-white/10 transition-all text-gray-300 hover:text-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Zoom in (Ctrl/Cmd + +)"
      >
        <ZoomIn className="w-5 h-5" />
      </button>

      {/* Zoom Level Display */}
      <div className="w-full px-2 py-1 text-xs font-medium text-gray-400 text-center">
        {Math.round(zoom * 100)}%
      </div>

      {/* Zoom Out */}
      <button
        onClick={onZoomOut}
        disabled={zoom <= 0.25}
        className="w-full flex items-center justify-start pl-2 p-2 rounded hover:bg-white/10 transition-all text-gray-300 hover:text-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Zoom out (Ctrl/Cmd + -)"
      >
        <ZoomOut className="w-5 h-5" />
      </button>

      <div className="w-full border-t border-gray-700/60 my-1" />

      {/* Fit to Content */}
      <button
        onClick={onFitToContent}
        className="w-full flex items-center justify-start pl-2 p-2 rounded hover:bg-white/10 transition-all text-gray-300 hover:text-gray-100"
        title="Fit to content (Ctrl/Cmd + 0)"
      >
        <Maximize2 className="w-5 h-5" />
      </button>

      {/* Reset View */}
      <button
        onClick={onResetView}
        className="w-full flex items-center justify-start pl-2 p-2 rounded hover:bg-white/10 transition-all text-gray-300 hover:text-gray-100"
        title="Reset view (Ctrl/Cmd + R)"
      >
        <Maximize className="w-5 h-5" />
      </button>

      <div className="w-full border-t border-gray-700/60 my-1" />

      {/* Toggle Minimap */}
      <button
        onClick={onToggleMinimap}
        className={`w-full flex items-center justify-start pl-2 p-2 rounded transition-all ${
          showMinimap
            ? "bg-purple-500/20 text-purple-300"
            : "text-gray-400 hover:bg-white/10 hover:text-gray-100"
        }`}
        title="Toggle minimap (Ctrl/Cmd + M)"
      >
        <Map className="w-5 h-5" />
      </button>
      {/* Divider separating minimap from alignment toggle */}
      <div className="w-full border-t border-gray-700/60 my-1" />
      {/* Toggle Alignment Guides */}
      <button
        onClick={onToggleAlignment}
        className={`w-full flex items-center justify-start pl-2 p-2 rounded transition-all ${
          showAlignment
            ? "bg-purple-500/20 text-purple-300"
            : "text-gray-400 hover:bg-white/10 hover:text-gray-100"
        }`}
        title="Toggle alignment guides"
      >
        <AlignJustify className="w-5 h-5" />
      </button>
      {/* Grid Snap */}
      <button
        onClick={onToggleGridSnap}
        className={`w-full flex items-center justify-start pl-2 p-2 rounded transition-all ${
          gridSnap
            ? "bg-purple-500/20 text-purple-300"
            : "text-gray-400 hover:bg-white/10 hover:text-gray-100"
        }`}
        title="Toggle grid snap (Ctrl/Cmd + G)"
      >
        <Grid3x3 className="w-5 h-5" />
      </button>
    </div>
  );
}
