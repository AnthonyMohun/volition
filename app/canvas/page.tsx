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
  ListRestart,
  Mic,
  HelpCircle,
} from "lucide-react";
import { VoiceCommandsHelp } from "@/components/voice-commands-help";
import { AnimatePresence, motion } from "framer-motion";
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
    setVoiceMode,
  } = useSession();
  const [selectedColor, setSelectedColor] = useState(STICKY_COLORS[0]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const spaceKeyDownRef = useRef(false);
  const panTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPinchDistanceRef = useRef<number | null>(null);
  const lastPinchCenterRef = useRef<{ x: number; y: number } | null>(null);
  const [showVoiceHelpTooltip, setShowVoiceHelpTooltip] = useState(false);
  const [showVoiceHelpPopover, setShowVoiceHelpPopover] = useState(false);
  const micHelpButtonRef = useRef<HTMLButtonElement | null>(null);
  const micHelpPopoverRef = useRef<HTMLDivElement | null>(null);

  // Canvas navigation state
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [gridSnap, setGridSnap] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showAlignment, setShowAlignment] = useState(true);
  // Controls are handled with internal collapsed/open state in the CanvasControls component
  const [previewNote, setPreviewNote] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const isRecording = state.voiceMode || false;
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
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        // Zoom with ctrl/cmd + wheel, zooming towards cursor position
        const container = containerRef.current;
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        // Get cursor position relative to viewport
        const cursorViewX = e.clientX - containerRect.left;
        const cursorViewY = e.clientY - containerRect.top;

        // Convert cursor position to canvas coordinates (world space)
        const cursorCanvasX = (cursorViewX - panX) / zoom;
        const cursorCanvasY = (cursorViewY - panY) / zoom;

        const delta = -e.deltaY * 0.01;
        const newZoom = Math.max(0.25, Math.min(2, zoom + delta));

        // Adjust pan so the canvas coordinates under cursor stay the same
        const newPanX = cursorViewX - cursorCanvasX * newZoom;
        const newPanY = cursorViewY - cursorCanvasY * newZoom;

        setZoom(newZoom);
        setPanX(newPanX);
        setPanY(newPanY);
      } else {
        // Pan with wheel
        setPanX((prev) => prev - e.deltaX);
        setPanY((prev) => prev - e.deltaY);
      }
    },
    [zoom, panX, panY]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Pan with mouse drag (left, middle, or shift+left)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || e.button === 0) {
        e.preventDefault();
        // Delay panning to allow for double click
        panTimeoutRef.current = setTimeout(() => {
          setIsPanning(true);
          setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
        }, 100);
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
    if (panTimeoutRef.current) {
      clearTimeout(panTimeoutRef.current);
      panTimeoutRef.current = null;
    }
    if (isPanning) {
      setIsPanning(false);
    }
  }, [isPanning]);

  // Touch gesture handlers for iPad
  const getTouchDistance = (touch1: React.Touch, touch2: React.Touch) => {
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const getTouchCenter = (touch1: React.Touch, touch2: React.Touch) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      // Don't start canvas panning if we're dragging a note
      if (isDragging) return;

      e.preventDefault(); // Prevent default touch behaviors

      if (e.touches.length === 1) {
        // Single finger - potential pan or tap
        const touch = e.touches[0];
        const container = containerRef.current;
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        // Start panning immediately for touch
        setIsPanning(true);
        setPanStart({ x: touch.clientX - panX, y: touch.clientY - panY });
      } else if (e.touches.length === 2) {
        // Two fingers - start pinch gesture
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        lastPinchDistanceRef.current = getTouchDistance(touch1, touch2);
        lastPinchCenterRef.current = getTouchCenter(touch1, touch2);
        setIsPanning(false); // Stop any single-finger panning
      }
    },
    [panX, panY, isDragging]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      // Don't handle canvas touch moves if we're dragging a note
      if (isDragging) return;

      e.preventDefault(); // Prevent scrolling/zooming

      if (e.touches.length === 1 && isPanning) {
        // Single finger pan
        const touch = e.touches[0];
        setPanX(touch.clientX - panStart.x);
        setPanY(touch.clientY - panStart.y);
      } else if (e.touches.length === 2) {
        // Pinch gesture
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        const currentDistance = getTouchDistance(touch1, touch2);
        const currentCenter = getTouchCenter(touch1, touch2);

        if (lastPinchDistanceRef.current && lastPinchCenterRef.current) {
          // Calculate zoom
          const scaleChange = currentDistance / lastPinchDistanceRef.current;
          const newZoom = Math.max(0.25, Math.min(2, zoom * scaleChange));

          // Calculate pan adjustment to zoom towards pinch center
          const container = containerRef.current;
          if (container) {
            const containerRect = container.getBoundingClientRect();
            const pinchViewX = currentCenter.x - containerRect.left;
            const pinchViewY = currentCenter.y - containerRect.top;

            // Convert pinch center to canvas coordinates
            const pinchCanvasX = (pinchViewX - panX) / zoom;
            const pinchCanvasY = (pinchViewY - panY) / zoom;

            // Adjust pan so pinch center stays in place
            const newPanX = pinchViewX - pinchCanvasX * newZoom;
            const newPanY = pinchViewY - pinchCanvasY * newZoom;

            setZoom(newZoom);
            setPanX(newPanX);
            setPanY(newPanY);
          }

          lastPinchDistanceRef.current = currentDistance;
          lastPinchCenterRef.current = currentCenter;
        }
      }
    },
    [isPanning, panStart, zoom, panX, panY, isDragging]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      // Don't handle canvas touch end if we're dragging a note
      if (isDragging) return;

      if (e.touches.length === 0) {
        // All fingers lifted
        setIsPanning(false);
        lastPinchDistanceRef.current = null;
        lastPinchCenterRef.current = null;
      } else if (e.touches.length === 1) {
        // One finger remaining - could switch to single finger pan
        lastPinchDistanceRef.current = null;
        lastPinchCenterRef.current = null;

        // Continue with single finger panning
        const touch = e.touches[0];
        setPanStart({ x: touch.clientX - panX, y: touch.clientY - panY });
      }
    },
    [panX, panY, isDragging]
  );

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

  // Global Spacebar push-to-talk (single owner in page.tsx)
  useEffect(() => {
    const handlePTTKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;

      // Ignore when typing in inputs / contentEditable
      const active = document.activeElement as HTMLElement | null;
      if (
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.isContentEditable)
      ) {
        return;
      }

      if (!spaceKeyDownRef.current) {
        e.preventDefault();
        spaceKeyDownRef.current = true;
        setVoiceMode(true);
        setShowVoiceHelpTooltip(true);
      }
    };

    const handlePTTKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if (spaceKeyDownRef.current) {
        spaceKeyDownRef.current = false;
        setVoiceMode(false);
        setShowVoiceHelpTooltip(false);
      }
    };

    const handleWindowBlur = () => {
      if (spaceKeyDownRef.current) {
        spaceKeyDownRef.current = false;
        setVoiceMode(false);
        setShowVoiceHelpTooltip(false);
      }
    };

    window.addEventListener("keydown", handlePTTKeyDown);
    window.addEventListener("keyup", handlePTTKeyUp);
    window.addEventListener("blur", handleWindowBlur);
    return () => {
      window.removeEventListener("keydown", handlePTTKeyDown);
      window.removeEventListener("keyup", handlePTTKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [setVoiceMode]);

  // Close help popover when clicking outside
  useEffect(() => {
    if (!showVoiceHelpPopover) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (
        micHelpButtonRef.current?.contains(target) ||
        micHelpPopoverRef.current?.contains(target)
      ) {
        return;
      }
      setShowVoiceHelpPopover(false);
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [showVoiceHelpPopover]);

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

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (panTimeoutRef.current) {
      clearTimeout(panTimeoutRef.current);
      panTimeoutRef.current = null;
    }
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const cursorViewX = e.clientX - containerRect.left;
    const cursorViewY = e.clientY - containerRect.top;

    const canvasX = (cursorViewX - panX) / zoom;
    const canvasY = (cursorViewY - panY) / zoom;

    const x = gridSnap ? snapToGrid(canvasX, GRID_SIZE, true) : canvasX;
    const y = gridSnap ? snapToGrid(canvasY, GRID_SIZE, true) : canvasY;

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
    if (conceptNotes.length >= 2) {
      // If only 2 concepts, show warning
      if (conceptNotes.length === 2) {
        const proceed = confirm(
          "Having 3+ concepts gives you more options to compare and strengthens your final selection.\n\nContinue with just 2 concepts?"
        );
        if (!proceed) return;
      }
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
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-teal-50 to-yellow-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-white to-blue-50/50 border-b-3 border-blue-200 px-6 py-5 flex items-center justify-between shadow-lg z-20">
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
              {state.hmwStatement}
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
            disabled={conceptNotes.length < 2}
            className="fun-button-primary flex items-center gap-2 text-sm font-black disabled:opacity-50 disabled:cursor-not-allowed py-3 px-6 shadow-lg hover:shadow-blue"
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
          className="flex-1 relative overflow-hidden bg-gradient-to-br from-blue-50/30 via-transparent to-teal-50/30 touch-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleCanvasClick}
          onClick={(e) => {
            // Blur any focused element when clicking on canvas (not on notes)
            // This allows textarea onBlur to trigger and exit edit mode
            const target = e.target as HTMLElement;
            if (!target.closest('[data-note]')) {
              (document.activeElement as HTMLElement)?.blur();
            }
          }}
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
                    onDelete={() => deleteNote(note)}
                  />
                </div>
              ))}
            </DndContext>

            {state.notes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p className="text-2xl font-black text-gray-700 mb-4">
                    Respond to the AI's questions with your ideas
                  </p>
                  <button
                    onClick={handleAddNote}
                    className="bg-gradient-to-br from-blue-500 to-teal-500 text-white px-6 py-3 rounded-2xl hover:from-blue-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-teal transform hover:scale-105 active:scale-95 font-bold flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Create your first sticky note
                  </button>
                  <p className="text-sm text-gray-600 mt-4 font-medium">
                    Or double-click anywhere on the canvas to create a note
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Floating toolbar */}
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20">
            <div className="fun-card px-6 py-4 flex items-center gap-5 shadow-2xl">
              <div className="flex gap-3">
                {STICKY_COLORS.map((color) => {
                  // Map light colors to their fun mode display colors
                  const colorMap: Record<string, string> = {
                    "#fef3c7": "#fbbf24", // yellow
                    "#fecaca": "#f87171", // red
                    "#bbf7d0": "#34d399", // green
                    "#bfdbfe": "#60a5fa", // blue
                    "#dbeafe": "#3b82f6", // light blue
                    "#dcfce7": "#14b8a6", // light teal
                  };
                  const displayColor = colorMap[color.toLowerCase()] || color;

                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-2xl transition-all relative ${
                        selectedColor === color
                          ? "hover:scale-110 border-3 border-white shadow-md after:absolute after:-bottom-3.5 after:left-1/2 after:-translate-x-1/2 after:w-2 after:h-1 after:bg-gray-400 after:rounded-full after:transition-all after:duration-300"
                          : "hover:scale-110 border-3 border-white shadow-md after:absolute after:-bottom-3.5 after:left-1/2 after:-translate-x-1/2 after:w-2 after:h-1 after:bg-gray-400 after:rounded-full after:transition-all after:duration-300 after:opacity-0"
                      }`}
                      style={{
                        backgroundColor: displayColor,
                      }}
                      title="Select note color"
                    />
                  );
                })}
              </div>
              <div className="border-l-3 border-blue-200 h-10 mx-2" />
              <div className="flex items-center gap-3 ml-2">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className={`p-2.5 rounded-xl transition-all shadow-sm ${
                    canUndo
                      ? "text-gray-600 hover:bg-teal-50 hover:text-teal-600 hover:scale-110"
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
                      ? "text-gray-600 hover:bg-teal-50 hover:text-teal-600 hover:scale-110"
                      : "text-gray-300"
                  }`}
                  title="Redo (Ctrl/Cmd + Y / Shift + Cmd + Z)"
                >
                  <RotateCw className="w-5 h-5" />
                </button>
              </div>
              <div className="border-l-3 border-blue-200 h-10 mx-2" />
              <div className="flex items-center gap-3 ml-2">
                <div className="relative flex items-center">
                  <AnimatePresence>
                    {(state.voiceTranscript && state.voiceMode) ||
                    showVoiceHelpTooltip ? (
                      <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 ${
                          state.voiceTranscript
                            ? "p-3 bg-white border-2 border-blue-200 rounded-2xl shadow-lg"
                            : ""
                        }`}
                      >
                        {state.voiceTranscript ? (
                          <p className="text-sm text-gray-700 font-bold">
                            <span className="text-gray-400">💬</span>{" "}
                            {state.voiceTranscript}
                          </p>
                        ) : (
                          <VoiceCommandsHelp compact />
                        )}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                  <button
                    onPointerDown={() => setVoiceMode(true)}
                    onPointerUp={() => setVoiceMode(false)}
                    onPointerLeave={() => isRecording && setVoiceMode(false)}
                    onTouchStart={() => setVoiceMode(true)}
                    onTouchEnd={() => setVoiceMode(false)}
                    className={`p-2.5 rounded-xl transition-all shadow-sm ${
                      isRecording
                        ? "bg-red-100 text-red-600 animate-pulse"
                        : "text-gray-500 hover:bg-teal-50 hover:text-teal-600"
                    }`}
                    title={
                      isRecording
                        ? "Release to stop speaking"
                        : "Hold to speak (or hold spacebar)"
                    }
                    aria-label={
                      isRecording
                        ? "Recording"
                        : "Press and hold to record (spacebar)"
                    }
                    aria-pressed={isRecording}
                  >
                    <Mic className="w-5 h-5" />
                  </button>

                  <button
                    ref={micHelpButtonRef}
                    onClick={() => {
                      setShowVoiceHelpPopover((prev) => !prev);
                    }}
                    className={`absolute top-0 right-0 -mt-1 -mr-1 p-1 rounded-full transition-all ${
                      showVoiceHelpPopover
                        ? "text-teal-600"
                        : "text-gray-400 hover:text-gray-500"
                    }`}
                    title="Voice commands help"
                  >
                    <HelpCircle className="w-3 h-3" />
                  </button>

                  <AnimatePresence>
                    {showVoiceHelpPopover && (
                      <motion.div
                        ref={micHelpPopoverRef}
                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        className="absolute bottom-full mb-2 right-0 z-50"
                      >
                        <VoiceCommandsHelp />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              {/* Moved toolbar toggle into CanvasControls; the full panel is managed internally */}
            </div>
          </div>

          {/* Canvas Controls */}
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
