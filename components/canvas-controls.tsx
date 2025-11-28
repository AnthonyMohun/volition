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
  Mic,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { useSession } from "@/lib/session-context";

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
  const { state, setVoiceMode } = useSession();
  const isRecording = state.voiceMode || false;
  const spacePressedRef = useRef(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or a textarea
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable)
      ) {
        return;
      }

      // Spacebar push-to-talk
      if ((e.code === "Space" || e.key === " ") && !spacePressedRef.current) {
        spacePressedRef.current = true;
        e.preventDefault();
        setVoiceMode(true);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " ") {
        spacePressedRef.current = false;
        setVoiceMode(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [setVoiceMode]);
  return (
    <div className="fixed bottom-24 right-6 w-14 fun-card p-2 flex flex-col items-start gap-2 z-20">
      {/* Zoom In */}
      <button
        onClick={onZoomIn}
        disabled={zoom >= 2}
        className="w-full flex items-center justify-start pl-2 p-2 rounded-lg hover:bg-indigo-50 transition-all text-gray-500 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Zoom in (Ctrl/Cmd + +)"
      >
        <ZoomIn className="w-5 h-5" />
      </button>

      {/* Zoom Level Display */}
      <div className="w-full px-2 py-1 text-xs font-bold text-gray-400 text-center flex items-center justify-center">
        {Math.round(zoom * 100)}%
      </div>

      {/* Zoom Out */}
      <button
        onClick={onZoomOut}
        disabled={zoom <= 0.25}
        className="w-full flex items-center justify-start pl-2 p-2 rounded-lg hover:bg-indigo-50 transition-all text-gray-500 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Zoom out (Ctrl/Cmd + -)"
      >
        <ZoomOut className="w-5 h-5" />
      </button>

      <div className="w-full border-t border-gray-200 my-1" />

      {/* Fit to Content */}
      <button
        onClick={onFitToContent}
        className="w-full flex items-center justify-start pl-2 p-2 rounded-lg hover:bg-indigo-50 transition-all text-gray-500 hover:text-indigo-600"
        title="Fit to content (Ctrl/Cmd + 0)"
      >
        <Maximize2 className="w-5 h-5" />
      </button>

      {/* Reset View */}
      <button
        onClick={onResetView}
        className="w-full flex items-center justify-start pl-2 p-2 rounded-lg hover:bg-indigo-50 transition-all text-gray-500 hover:text-indigo-600"
        title="Reset view (Ctrl/Cmd + R)"
      >
        <Maximize className="w-5 h-5" />
      </button>

      <div className="w-full border-t border-gray-200 my-1" />

      {/* Toggle Minimap */}
      <button
        onClick={onToggleMinimap}
        className={`w-full flex items-center justify-start pl-2 p-2 rounded-lg transition-all ${
          showMinimap
            ? "bg-indigo-100 text-indigo-600"
            : "text-gray-500 hover:bg-indigo-50 hover:text-indigo-600"
        }`}
        title="Toggle minimap (Ctrl/Cmd + M)"
      >
        <Map className="w-5 h-5" />
      </button>
      {/* Microphone / Push-to-talk */}
      <div className="w-full border-t border-gray-200 my-1" />
      <button
        onPointerDown={() => setVoiceMode(true)}
        onPointerUp={() => setVoiceMode(false)}
        onPointerLeave={() => isRecording && setVoiceMode(false)}
        onTouchStart={() => setVoiceMode(true)}
        onTouchEnd={() => setVoiceMode(false)}
        className={`w-full flex items-center justify-start pl-2 p-2 rounded-lg transition-all ${
          isRecording
            ? "bg-red-100 text-red-600"
            : "text-gray-500 hover:bg-indigo-50 hover:text-indigo-600"
        } ${isRecording ? "animate-pulse" : ""}`}
        title={
          isRecording
            ? "Release to stop speaking"
            : "Hold to speak (or hold spacebar)"
        }
        aria-label={
          isRecording ? "Recording" : "Press and hold to record (spacebar)"
        }
        aria-pressed={isRecording}
      >
        <Mic className="w-5 h-5" />
      </button>
      {/* Divider separating minimap from alignment toggle */}
      <div className="w-full border-t border-gray-200 my-1" />
      {/* Toggle Alignment Guides */}
      <button
        onClick={onToggleAlignment}
        className={`w-full flex items-center justify-start pl-2 p-2 rounded-lg transition-all ${
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
        className={`w-full flex items-center justify-start pl-2 p-2 rounded-lg transition-all ${
          gridSnap
            ? "bg-indigo-100 text-indigo-600"
            : "text-gray-500 hover:bg-indigo-50 hover:text-indigo-600"
        }`}
        title="Toggle grid snap (Ctrl/Cmd + G)"
      >
        <Grid3x3 className="w-5 h-5" />
      </button>
    </div>
  );
}
