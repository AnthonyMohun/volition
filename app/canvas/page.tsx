"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";
import { DraggableNote } from "@/components/draggable-note";
import { AIQuestionPanel } from "@/components/ai-question-panel";
import {
  DndContext,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import { Plus, ArrowRight, Home, RotateCcw } from "lucide-react";
import { STICKY_COLORS } from "@/lib/types";

export default function CanvasPage() {
  const router = useRouter();
  const { state, addNote, updateNote, deleteNote, setPhase, resetSession } = useSession();
  const [selectedColor, setSelectedColor] = useState(STICKY_COLORS[0]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (!state.hmwStatement) {
      router.push("/");
    }
  }, [state.hmwStatement, router]);

  const handleAddNote = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();
    const x = Math.random() * (canvasRect.width - 300) + 50;
    const y = Math.random() * (canvasRect.height - 200) + 50;

    addNote({
      id: `note-${Date.now()}`,
      text: "New note...",
      x,
      y,
      color: selectedColor,
      isConcept: false,
      createdAt: Date.now(),
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const noteId = active.id as string;

    const note = state.notes.find((n) => n.id === noteId);
    if (note) {
      updateNote(noteId, {
        x: note.x + delta.x,
        y: note.y + delta.y,
      });
    }

    setIsDragging(false);
    setDraggedNoteId(null);
  };

  const handleDragStart = (event: { active: { id: string | number } }) => {
    setIsDragging(true);
    setDraggedNoteId(event.active.id as string);
  };

  const conceptNotes = state.notes.filter((n) => n.isConcept);

  const handleProceedToReview = () => {
    if (conceptNotes.length >= 3) {
      setPhase("review");
      router.push("/review");
    }
  };

  const handleStartNewProject = () => {
    if (confirm("Start a new project? This will clear all your current work.")) {
      resetSession();
      router.push("/");
    }
  };

  if (!state.hmwStatement) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <div className="glass border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
            title="Back to home"
          >
            <Home className="w-5 h-5 text-gray-300" />
          </button>
          <button
            onClick={handleStartNewProject}
            className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors group"
            title="Start a new project"
          >
            <RotateCcw className="w-5 h-5 text-gray-300 group-hover:text-orange-400 transition-colors" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-100">
              Ideation Canvas
            </h1>
            <p className="text-sm text-gray-400 max-w-2xl truncate">
              {state.hmwStatement}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 glass-light rounded-lg border border-yellow-400/30">
            <span className="text-sm font-medium text-yellow-400">
              {conceptNotes.length} concept
              {conceptNotes.length !== 1 ? "s" : ""}
            </span>
          </div>
          <button
            onClick={handleProceedToReview}
            disabled={conceptNotes.length < 3}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium silver-glow"
          >
            Review Concepts
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Canvas */}
        <div
          className="flex-1 relative overflow-auto texture-overlay"
          ref={canvasRef}
        >
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="min-h-full min-w-full relative p-8">
              {state.notes.map((note) => (
                <div
                  key={note.id}
                  style={{ position: "absolute", left: note.x, top: note.y }}
                >
                  <DraggableNote
                    note={note}
                    onUpdate={(updates) => updateNote(note.id, updates)}
                    onDelete={() => deleteNote(note.id)}
                  />
                </div>
              ))}
            </div>
          </DndContext>

          {/* Floating toolbar */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-3 flex items-center gap-4 z-20 border border-gray-700/50">
            <button
              onClick={handleAddNote}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-full hover:from-purple-500 hover:to-pink-500 transition-all shadow-md hover:shadow-lg silver-glow"
              title="Add sticky note"
            >
              <Plus className="w-5 h-5" />
            </button>
            <div className="flex gap-2">
              {STICKY_COLORS.map((color) => {
                // Map light colors to their dark mode display colors
                const colorMap: Record<string, string> = {
                  "#fef3c7": "#2a2520",
                  "#fecaca": "#2a2020",
                  "#bbf7d0": "#1e2a23",
                  "#bfdbfe": "#1e2328",
                  "#e9d5ff": "#252028",
                  "#fbcfe8": "#2a2025",
                };
                const displayColor = colorMap[color.toLowerCase()] || color;

                // Get accent border color
                const accentMap: Record<string, string> = {
                  "#fef3c7": "#facc15",
                  "#fecaca": "#f87171",
                  "#bbf7d0": "#4ade80",
                  "#bfdbfe": "#60a5fa",
                  "#e9d5ff": "#a855f7",
                  "#fbcfe8": "#ec4899",
                };
                const accentColor = accentMap[color.toLowerCase()] || "#888";

                return (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full transition-all backdrop-blur-sm ${
                      selectedColor === color
                        ? "scale-110 shadow-lg ring-2 ring-offset-2 ring-offset-[#0a0a0a]"
                        : "hover:scale-105 border-2 border-gray-700/50"
                    }`}
                    style={{
                      backgroundColor: displayColor,
                      ...(selectedColor === color && {
                        borderColor: accentColor,
                        boxShadow: `0 0 20px ${accentColor}40`,
                        borderWidth: "2px",
                        borderStyle: "solid",
                      }),
                    }}
                    title="Select note color"
                  />
                );
              })}
            </div>
          </div>

          {state.notes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-gray-500">
                <Plus className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">
                  Click the + button to add your first sticky note
                </p>
                <p className="text-sm mt-2">
                  Respond to the AI's questions with your ideas
                </p>
              </div>
            </div>
          )}
        </div>

        {/* AI Question Panel */}
        <AIQuestionPanel />
      </div>
    </div>
  );
}
