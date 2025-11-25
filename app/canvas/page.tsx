"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";
import { DraggableNote } from "@/components/draggable-note";
import { AIQuestionPanel } from "@/components/ai-question-panel";
import { CanvasControls } from "@/components/canvas-controls";
import { CanvasMinimap } from "@/components/canvas-minimap";
import { snapToGrid, calculateAlignmentGuides } from "@/components/canvas-grid";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragMoveEvent,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import {
  Plus,
  ArrowRight,
  RotateCcw,
  RotateCw,
  Menu,
  ListRestart,
} from "lucide-react";
import { STICKY_COLORS } from "@/lib/types";

export default function CanvasPage() {
  const router = useRouter();
  const {
    state,
    addNote,
    updateNote,
    deleteNote,
    setPhase,
    resetSession,
    undo,
    redo,
    canUndo,
    canRedo,
    setViewport,
    clearExampleSessionFlag,
  } = useSession();
  const [selectedColor, setSelectedColor] = useState(STICKY_COLORS[0]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Canvas navigation state
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [gridSnap, setGridSnap] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showAlignment, setShowAlignment] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [previewNote, setPreviewNote] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const [alignmentGuides, setAlignmentGuides] = useState<{
    vertical: number[];
    horizontal: number[];
  }>({ vertical: [], horizontal: [] });

  const GRID_SIZE = 40;
  const CANVAS_WIDTH = 4000;
  const CANVAS_HEIGHT = 3000;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Initialize pan to center of canvas on mount
  useEffect(() => {
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      // Center the canvas: show canvas center (CANVAS_WIDTH/2, CANVAS_HEIGHT/2)
      // at viewport center (containerRect.width/2, containerRect.height/2)
      setPanX(containerRect.width / 2 - CANVAS_WIDTH / 2);
      setPanY(containerRect.height / 2 - CANVAS_HEIGHT / 2);
    }
  }, []);

  useEffect(() => {
    if (!state.hmwStatement) {
      router.push("/");
    }
  }, [state.hmwStatement, router]);

  // Update viewport info in session whenever pan/zoom changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const centerX = (containerRect.width / 2 - panX) / zoom;
    const centerY = (containerRect.height / 2 - panY) / zoom;
    setViewport?.({ centerX, centerY, zoom });
  }, [panX, panY, zoom, setViewport]);

  // Zoom functions
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.25, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.25, 0.25));
  }, []);

  const handleFitToContent = useCallback(() => {
    if (state.notes.length === 0 || !containerRef.current) return;

    const padding = 100;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    state.notes.forEach((note) => {
      minX = Math.min(minX, note.x);
      minY = Math.min(minY, note.y);
      maxX = Math.max(maxX, note.x + 256); // note width
      maxY = Math.max(maxY, note.y + 200); // approximate note height
    });

    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;
    const containerRect = containerRef.current.getBoundingClientRect();

    const zoomX = containerRect.width / contentWidth;
    const zoomY = containerRect.height / contentHeight;
    const newZoom = Math.min(Math.min(zoomX, zoomY, 1), 2);

    setZoom(newZoom);
    // Center the content in the viewport
    const contentCenterX = minX + contentWidth / 2 - padding;
    const contentCenterY = minY + contentHeight / 2 - padding;
    setPanX(containerRect.width / 2 - contentCenterX * newZoom);
    setPanY(containerRect.height / 2 - contentCenterY * newZoom);
  }, [state.notes]);

  // Fit to content when loading example session
  useEffect(() => {
    if (
      state.isExampleSession &&
      state.notes.length > 0 &&
      containerRef.current
    ) {
      handleFitToContent();
      // Reset the flag to avoid triggering again
      clearExampleSessionFlag();
    }
  }, [
    state.isExampleSession,
    state.notes.length,
    containerRef.current,
    clearExampleSessionFlag,
    handleFitToContent,
  ]);

  const handleResetView = useCallback(() => {
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      setZoom(1);
      setPanX(containerRect.width / 2 - CANVAS_WIDTH / 2);
      setPanY(containerRect.height / 2 - CANVAS_HEIGHT / 2);
    }
  }, []);

  // Pan with mouse wheel + drag
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      // Zoom with ctrl/cmd + wheel
      const delta = -e.deltaY * 0.01;
      setZoom((prev) => Math.max(0.25, Math.min(2, prev + delta)));
    } else {
      // Pan with wheel
      setPanX((prev) => prev - e.deltaX);
      setPanY((prev) => prev - e.deltaY);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Pan with space + drag or middle mouse button
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        e.preventDefault();
        setIsPanning(true);
        setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
      }
    },
    [panX, panY]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPanX(e.clientX - panStart.x);
        setPanY(e.clientY - panStart.y);
      }
    },
    [isPanning, panStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "z":
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case "y":
            e.preventDefault();
            redo();
            break;
          case "=":
          case "+":
            e.preventDefault();
            handleZoomIn();
            break;
          case "-":
            e.preventDefault();
            handleZoomOut();
            break;
          case "0":
            e.preventDefault();
            handleFitToContent();
            break;
          case "r":
            e.preventDefault();
            handleResetView();
            break;
          case "m":
            e.preventDefault();
            setShowMinimap((prev) => !prev);
            break;
          case "g":
            e.preventDefault();
            setGridSnap((prev) => !prev);
            break;
          case "a":
            e.preventDefault();
            setShowAlignment((prev) => !prev);
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleFitToContent, handleResetView]);

  const handleAddNote = () => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    // Calculate position accounting for zoom and pan
    // Screen center to canvas coordinates: (screenX - panX) / zoom
    const centerX = (containerRect.width / 2 - panX) / zoom;
    const centerY = (containerRect.height / 2 - panY) / zoom;

    const x = centerX + (Math.random() - 0.5) * 300;
    const y = centerY + (Math.random() - 0.5) * 200;

    addNote({
      id: `note-${Date.now()}`,
      text: "New note...",
      x: gridSnap ? snapToGrid(x, GRID_SIZE, true) : x,
      y: gridSnap ? snapToGrid(y, GRID_SIZE, true) : y,
      color: selectedColor,
      isConcept: false,
      createdAt: Date.now(),
    });
  };

  const handleDragMove = (event: DragMoveEvent) => {
    if (!draggedNoteId) return;

    const draggedNote = state.notes.find((n) => n.id === draggedNoteId);
    if (!draggedNote) return;

    const newX = draggedNote.x + event.delta.x / zoom;
    const newY = draggedNote.y + event.delta.y / zoom;

    const otherNotes = state.notes
      .filter((n) => n.id !== draggedNoteId)
      .map((n) => ({ x: n.x, y: n.y, width: 256, height: 200 }));

    let guides = {
      snapX: null as number | null,
      snapY: null as number | null,
      verticalGuides: [] as number[],
      horizontalGuides: [] as number[],
    };
    // Compute alignment guides only if alignment toggled on
    if (showAlignment) {
      const calculated = calculateAlignmentGuides(
        { x: newX, y: newY, width: 256, height: 200 },
        otherNotes,
        15 / zoom
      );
      guides = { ...calculated };
      setAlignmentGuides({
        vertical: calculated.verticalGuides,
        horizontal: calculated.horizontalGuides,
      });
    } else {
      setAlignmentGuides({ vertical: [], horizontal: [] });
    }

    // If alignment snap found, use it for preview; otherwise if gridSnap -> snap to grid
    let px: number | null = null;
    let py: number | null = null;
    if (showAlignment && (guides.snapX !== null || guides.snapY !== null)) {
      px = guides.snapX ?? newX;
      py = guides.snapY ?? newY;
    } else if (gridSnap) {
      px = Math.round(newX / GRID_SIZE) * GRID_SIZE;
      py = Math.round(newY / GRID_SIZE) * GRID_SIZE;
    }

    if (px !== null && py !== null) {
      setPreviewNote({ id: draggedNoteId, x: px, y: py });
    } else {
      setPreviewNote(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const noteId = active.id as string;

    const note = state.notes.find((n) => n.id === noteId);
    if (note) {
      let newX = note.x + delta.x / zoom;
      let newY = note.y + delta.y / zoom;

      // Compute alignment guides (use same threshold as during drag)
      const otherNotes = state.notes
        .filter((n) => n.id !== noteId)
        .map((n) => ({ x: n.x, y: n.y, width: 256, height: 200 }));

      let finalX = newX;
      let finalY = newY;

      const guides = calculateAlignmentGuides(
        { x: newX, y: newY, width: 256, height: 200 },
        otherNotes,
        15 / zoom
      );

      // If alignment guides exist and toggle is on, prefer them
      const hasAlignmentSnap =
        showAlignment && (guides.snapX !== null || guides.snapY !== null);
      if (hasAlignmentSnap) {
        if (guides.snapX !== null) finalX = guides.snapX;
        if (guides.snapY !== null) finalY = guides.snapY;
      } else if (gridSnap) {
        // Apply grid snapping if enabled and no alignment snap found
        finalX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
        finalY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
      }
      // Round values to avoid fractional pixel jumps
      finalX = Math.round(finalX * 100) / 100;
      finalY = Math.round(finalY * 100) / 100;
      updateNote(noteId, { x: finalX, y: finalY });
      setPreviewNote(null);
    }

    setIsDragging(false);
    setDraggedNoteId(null);
    setAlignmentGuides({ vertical: [], horizontal: [] });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
    setDraggedNoteId(event.active.id as string);
  };

  const conceptNotes = state.notes.filter((n) => n.isConcept);

  const handleProceedToSelect = () => {
    if (conceptNotes.length >= 3) {
      setPhase("select");
      router.push("/select");
    }
  };

  const handleStartNewProject = () => {
    if (
      confirm("Start a new project? This will clear all your current work.")
    ) {
      resetSession();
      router.push("/");
    }
  };

  if (!state.hmwStatement) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-white to-purple-50/50 border-b-3 border-purple-200 px-6 py-5 flex items-center justify-between shadow-lg z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={handleStartNewProject}
            className="p-3 hover:bg-gradient-to-br hover:from-orange-50 hover:to-red-50 rounded-2xl transition-all group shadow-sm hover:shadow-md hover:scale-110"
            title="Start a new project"
          >
            <ListRestart className="w-6 h-6 text-gray-400 group-hover:text-orange-500 transition-colors" />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
              <span className="text-2xl">🎨</span>
              Ideation Canvas
            </h1>
            <p className="text-xs text-gray-600 mt-1 font-bold">
              Organize your ideas and concepts on the canvas ✨
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl border-3 border-yellow-300 shadow-md">
            <span className="text-2xl">⭐</span>
            <span className="text-sm font-black text-yellow-700">
              {conceptNotes.length} concept
              {conceptNotes.length !== 1 ? "s" : ""}
            </span>
          </div>
          <button
            onClick={handleProceedToSelect}
            disabled={conceptNotes.length < 3}
            className="fun-button-primary flex items-center gap-2 text-sm font-black disabled:opacity-50 disabled:cursor-not-allowed py-3 px-6 shadow-lg hover:shadow-purple"
          >
            Select Concepts
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* AI Question Panel */}
        <AIQuestionPanel />

        {/* Main Canvas */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden bg-gradient-to-br from-purple-50/30 via-transparent to-pink-50/30"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ cursor: isPanning ? "grabbing" : "default" }}
        >
          <div
            ref={canvasRef}
            className="absolute"
            style={{
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
              transformOrigin: "0 0",
            }}
          >
            {/* Alignment Guides */}
            {isDragging && (
              <>
                {alignmentGuides.vertical.map((x, i) => (
                  <div
                    key={`v-${i}`}
                    className="absolute bg-indigo-400/50"
                    style={{
                      left: x,
                      top: 0,
                      width: 2,
                      height: CANVAS_HEIGHT,
                      pointerEvents: "none",
                    }}
                  />
                ))}
                {alignmentGuides.horizontal.map((y, i) => (
                  <div
                    key={`h-${i}`}
                    className="absolute bg-indigo-400/50"
                    style={{
                      left: 0,
                      top: y,
                      width: CANVAS_WIDTH,
                      height: 2,
                      pointerEvents: "none",
                    }}
                  />
                ))}
              </>
            )}

            {/* Preview ghost for snapping */}
            {previewNote &&
              (() => {
                const noteObj = state.notes.find(
                  (n) => n.id === previewNote.id
                );
                const color = noteObj?.color || "#ffffff";
                const getFunColor = (c: string) => {
                  const colorMap: Record<string, string> = {
                    "#fef3c7": "#fffbeb",
                    "#fecaca": "#fef2f2",
                    "#bbf7d0": "#f0fdf4",
                    "#bfdbfe": "#eff6ff",
                    "#e9d5ff": "#faf5ff",
                    "#fbcfe8": "#fdf2f8",
                  };
                  return colorMap[c] || "#ffffff";
                };

                return (
                  <div
                    className="absolute pointer-events-none opacity-60"
                    style={{ left: previewNote.x, top: previewNote.y }}
                  >
                    <div
                      className="w-64 p-3 rounded-xl border-2 border-indigo-400/60 border-dashed"
                      style={{ backgroundColor: getFunColor(color) }}
                    />
                  </div>
                );
              })()}

            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
            >
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
            </DndContext>

            {state.notes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-gray-500">
                  <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-8 rounded-full shadow-2xl mb-6 inline-block animate-pulse">
                    <Plus className="w-16 h-16 text-purple-500" />
                  </div>
                  <p className="text-2xl font-black text-gray-700 mb-2 flex items-center justify-center gap-2">
                    <span className="text-3xl">✨</span>
                    Click the + button to start!
                  </p>
                  <p className="text-lg mt-3 text-gray-600 font-bold">
                    Respond to the AI's questions with your ideas 💡
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Floating toolbar */}
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20">
            <div className="fun-card px-6 py-4 flex items-center gap-5 shadow-2xl">
              <button
                onClick={handleAddNote}
                className="bg-gradient-to-br from-purple-500 to-pink-500 text-white p-4 rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-purple transform hover:scale-110 active:scale-95"
                title="Add sticky note"
              >
                <Plus className="w-7 h-7" />
              </button>
              <div className="flex gap-3">
                {STICKY_COLORS.map((color) => {
                  // Map light colors to their fun mode display colors
                  const colorMap: Record<string, string> = {
                    "#fef3c7": "#fbbf24", // yellow
                    "#fecaca": "#f87171", // red
                    "#bbf7d0": "#34d399", // green
                    "#bfdbfe": "#60a5fa", // blue
                    "#e9d5ff": "#a78bfa", // purple
                    "#fbcfe8": "#f472b6", // pink
                  };
                  const displayColor = colorMap[color.toLowerCase()] || color;

                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-2xl transition-all ${
                        selectedColor === color
                          ? "scale-125 shadow-lg ring-4 ring-offset-2 ring-offset-white ring-gray-400"
                          : "hover:scale-110 border-3 border-white shadow-md"
                      }`}
                      style={{
                        backgroundColor: displayColor,
                      }}
                      title="Select note color"
                    />
                  );
                })}
              </div>
              <div className="border-l-3 border-purple-200 h-10 mx-2" />
              <div className="flex items-center gap-3 ml-2">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className={`p-2.5 rounded-xl transition-all shadow-sm ${
                    canUndo
                      ? "text-gray-600 hover:bg-purple-50 hover:text-purple-600 hover:scale-110"
                      : "text-gray-300"
                  }`}
                  title="Undo (Ctrl/Cmd + Z)"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className={`p-2.5 rounded-xl transition-all shadow-sm ${
                    canRedo
                      ? "text-gray-600 hover:bg-purple-50 hover:text-purple-600 hover:scale-110"
                      : "text-gray-300"
                  }`}
                  title="Redo (Ctrl/Cmd + Y / Shift + Cmd + Z)"
                >
                  <RotateCw className="w-5 h-5" />
                </button>
              </div>
              <div className="border-l-3 border-purple-200 h-10 mx-2" />
              <button
                onClick={() => setShowControls((prev) => !prev)}
                className={`p-2.5 rounded-xl transition-all shadow-sm hover:scale-110 ${
                  showControls
                    ? "bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600"
                    : "text-gray-400 hover:bg-purple-50"
                }`}
                title={`Toggle toolbar ${showControls ? "shown" : "hidden"}`}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Canvas Controls */}
          {showControls && (
            <CanvasControls
              zoom={zoom}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onFitToContent={handleFitToContent}
              onResetView={handleResetView}
              showMinimap={showMinimap}
              onToggleMinimap={() => setShowMinimap(!showMinimap)}
              showAlignment={showAlignment}
              onToggleAlignment={() => setShowAlignment(!showAlignment)}
              gridSnap={gridSnap}
              onToggleGridSnap={() => setGridSnap(!gridSnap)}
            />
          )}

          {/* Minimap */}
          {showMinimap && containerRef.current && (
            <CanvasMinimap
              notes={state.notes}
              canvasWidth={CANVAS_WIDTH}
              canvasHeight={CANVAS_HEIGHT}
              viewportX={-panX / zoom}
              viewportY={-panY / zoom}
              viewportWidth={containerRef.current.clientWidth}
              viewportHeight={containerRef.current.clientHeight}
              zoom={zoom}
              onViewportMove={(x, y) => {
                setPanX(-x * zoom);
                setPanY(-y * zoom);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
