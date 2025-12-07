"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { StickyNote as StickyNoteType } from "@/lib/types";
import {
  Trash2,
  Image as ImageIcon,
  Star,
  X,
  FileText,
  Pencil,
  Mic,
  Maximize2,
  Minimize2,
  Eye,
  Loader2,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DrawingCanvas, DrawingCanvasHandle } from "./drawing-canvas";
import { motion, AnimatePresence } from "framer-motion";

interface StickyNoteProps {
  note: StickyNoteType;
  onUpdate: (updates: Partial<StickyNoteType>) => void;
  onDelete: () => void;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  onDelveDeeper?: (noteText: string) => void;
  isDelvingDeeper?: boolean;
  // Link mode props
  onStartLinking?: (noteId: string) => void;
  isLinkingFrom?: boolean;
  isLinkingMode?: boolean; // true when any note is being linked
  connectionCount?: number;
}

export function StickyNote({
  note,
  onUpdate,
  onDelete,
  isDragging,
  dragHandleProps,
  onDelveDeeper,
  isDelvingDeeper,
  onStartLinking,
  isLinkingFrom,
  isLinkingMode,
  connectionCount = 0,
}: StickyNoteProps) {
  // Start in edit mode if this is a newly created note
  const [isEditing, setIsEditing] = useState(note.isNewNote || false);
  const [editText, setEditText] = useState(note.isNewNote ? "" : note.text);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsText, setDetailsText] = useState(note.details || "");
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [showDrawingModal, setShowDrawingModal] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isRecordingDetails, setIsRecordingDetails] = useState(false);
  const [isNoteHovered, setIsNoteHovered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const drawingCanvasRef = useRef<DrawingCanvasHandle>(null);
  const detailsRecognitionRef = useRef<any>(null);

  // Clear the isNewNote flag after the component mounts to prevent re-entering edit mode
  useEffect(() => {
    if (note.isNewNote) {
      // Small delay to ensure edit mode is active, then clear the flag
      const timer = setTimeout(() => {
        onUpdate({ isNewNote: false });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [note.isNewNote, onUpdate]);

  // Speech recognition for details modal
  const startDetailsRecording = useCallback(() => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert("Speech recognition is not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setDetailsText((prev) =>
          prev ? prev + " " + finalTranscript : finalTranscript
        );
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "aborted" && event.error !== "no-speech") {
        console.error("Speech recognition error:", event.error);
      }
      setIsRecordingDetails(false);
    };

    recognition.onend = () => {
      setIsRecordingDetails(false);
    };

    detailsRecognitionRef.current = recognition;
    recognition.start();
    setIsRecordingDetails(true);
  }, []);

  const stopDetailsRecording = useCallback(() => {
    if (detailsRecognitionRef.current) {
      detailsRecognitionRef.current.stop();
      detailsRecognitionRef.current = null;
    }
    setIsRecordingDetails(false);
  }, []);

  // Cleanup speech recognition on unmount or modal close
  useEffect(() => {
    return () => {
      if (detailsRecognitionRef.current) {
        detailsRecognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (!showDetailsModal && detailsRecognitionRef.current) {
      detailsRecognitionRef.current.stop();
      setIsRecordingDetails(false);
    }
  }, [showDetailsModal]);

  const handleTextSave = () => {
    const trimmedText = editText.trim();
    // Allow saving empty text only if there's a source question
    if (trimmedText || note.sourceQuestion) {
      onUpdate({ text: trimmedText || "" });
    } else if (!trimmedText && !note.sourceQuestion) {
      // If empty and no source question, restore original text or set placeholder
      setEditText(note.text || "New note...");
    }
    setIsEditing(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    try {
      const { compressImage } = await import("@/lib/image-compress");
      const compressedFile = await compressImage(file);
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onload = () => {
        onUpdate({
          image: {
            dataUrl: reader.result as string,
            name: compressedFile.name,
            type: compressedFile.type,
            size: compressedFile.size,
          },
        });
      };
      reader.onerror = (error) => {
        console.error("Failed to read compressed image:", error);
        alert("Failed to process image");
      };
    } catch (error) {
      console.error("Failed to process image:", error);
      alert("Failed to process image");
    }
  };

  const handleRemoveImage = () => {
    onUpdate({ image: undefined });
  };

  const toggleConcept = () => {
    if (!note.isConcept) {
      // When marking as concept, open the details modal
      setShowDetailsModal(true);
      setDetailsText(note.details || "");
    }
    onUpdate({ isConcept: !note.isConcept });
  };

  const handleSaveDetails = () => {
    onUpdate({ details: detailsText.trim() });
    setShowDetailsModal(false);
  };

  const handleOpenDrawing = () => {
    setShowDrawingModal(true);
  };

  const handleSaveDrawing = async () => {
    if (drawingCanvasRef.current) {
      const drawing = await drawingCanvasRef.current.save();
      if (drawing) {
        onUpdate({
          drawing,
          contentType:
            note.text && note.text !== "New note..." ? "both" : "drawing",
        });
      }
    }
    setShowDrawingModal(false);
  };

  const handleRemoveDrawing = () => {
    onUpdate({
      drawing: undefined,
      contentType: note.text ? "text" : undefined,
    });
  };

  // Fun mode color palette with vibrant pastel colors
  const getFunColor = (color: string) => {
    const colorMap: Record<string, string> = {
      "#fef3c7": "#fef3c7", // yellow
      "#fecaca": "#fecaca", // red
      "#bbf7d0": "#bbf7d0", // green
      "#bfdbfe": "#bfdbfe", // blue
      "#dbeafe": "#dbeafe", // light blue
      "#dcfce7": "#dcfce7", // light teal
    };
    return colorMap[color] || "#ffffff";
  };

  // Soft gradient palette per sticky to match the site's glassy aesthetic
  const NOTE_PALETTE: Record<
    string,
    {
      surfaceFrom: string;
      surfaceTo: string;
      border: string;
      glow: string;
      text: string;
      badge: string;
    }
  > = {
    "#fef3c7": {
      surfaceFrom: "#fff3ce",
      surfaceTo: "#ffd88a",
      border: "#f4b740",
      glow: "rgba(244, 183, 64, 0.35)",
      text: "#7a4a00",
      badge: "#f8c76a",
    },
    "#fecaca": {
      surfaceFrom: "#ffe1dc",
      surfaceTo: "#ffb3a8",
      border: "#f25c5c",
      glow: "rgba(242, 92, 92, 0.35)",
      text: "#7d1f1f",
      badge: "#ff9f99",
    },
    "#bbf7d0": {
      surfaceFrom: "#e1fbec",
      surfaceTo: "#baf1d4",
      border: "#36b27a",
      glow: "rgba(54, 178, 122, 0.32)",
      text: "#0f4a34",
      badge: "#8fd9b4",
    },
    "#bfdbfe": {
      surfaceFrom: "#e3ecff",
      surfaceTo: "#bcd4ff",
      border: "#4f8bff",
      glow: "rgba(79, 139, 255, 0.34)",
      text: "#1c3e82",
      badge: "#9fc0ff",
    },
    "#dbeafe": {
      surfaceFrom: "#ecebff",
      surfaceTo: "#cbc6ff",
      border: "#7d6bff",
      glow: "rgba(125, 107, 255, 0.32)",
      text: "#2f2f7a",
      badge: "#b6a8ff",
    },
    "#dcfce7": {
      surfaceFrom: "#ddf7f3",
      surfaceTo: "#b8ebe1",
      border: "#2eb7b0",
      glow: "rgba(46, 183, 176, 0.34)",
      text: "#0f4a49",
      badge: "#8adad2",
    },
  };

  const getNotePalette = (color: string) =>
    NOTE_PALETTE[color] || {
      surfaceFrom: "#f4f7fb",
      surfaceTo: "#e8eef9",
      border: "#d2d9e8",
      glow: "rgba(120, 144, 180, 0.28)",
      text: "#1f2937",
      badge: "#e2e8f0",
    };

  const palette = getNotePalette(note.color);

  return (
    <>
      <div
        {...dragHandleProps}
        onMouseEnter={() => setIsNoteHovered(true)}
        onMouseLeave={() => setIsNoteHovered(false)}
        className={cn(
          "w-56 md:w-64 p-4 md:p-5 rounded-2xl transition-all cursor-move relative no-select overflow-visible backdrop-blur-xl border",
          isDragging && "opacity-60 scale-95",
          !isDragging && "hover:-translate-y-1 hover:scale-[1.01]"
        )}
        style={{
          backgroundImage: `linear-gradient(145deg, ${palette.surfaceFrom} 0%, ${palette.surfaceTo} 100%)`,
          borderColor: palette.border,
          borderWidth: "1.5px",
          boxShadow: note.isConcept
            ? `0 18px 38px -22px ${palette.glow}, 0 12px 24px -18px rgba(25, 57, 94, 0.2), 0 0 0 6px ${palette.border}33`
            : `0 16px 32px -24px ${palette.glow}, 0 8px 18px -18px rgba(25, 57, 94, 0.18)`,
          color: palette.text,
          WebkitBackdropFilter: "blur(12px)",
          backdropFilter: "blur(12px)",
          isolation: "isolate",
        }}
      >
        {/* Concept star badge */}
        {note.isConcept && (
          <div
            className="absolute -top-4 -right-4 rounded-full p-2.5 shadow-xl animate-pulse"
            style={{
              backgroundImage: `linear-gradient(135deg, ${palette.badge} 0%, ${palette.border} 100%)`,
              boxShadow: `0 14px 26px -14px ${palette.glow}`,
            }}
          >
            <Star className="w-5 h-5 text-white fill-current drop-shadow-md" />
          </div>
        )}
        {note.isConcept && (
          <div className="absolute -top-4 left-0 flex items-center gap-2 pointer-events-none">
            <span className="bg-amber-500 text-white text-xs font-black tracking-wide px-3 py-1 rounded-full shadow-lg ring-2 ring-white/70">
              Concept
            </span>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={toggleConcept}
            onPointerDown={(e) => e.stopPropagation()}
            className={cn(
              "p-2 md:p-2 rounded-xl transition-all touch-target-sm border",
              note.isConcept
                ? "text-amber-600 bg-white/80 border-white/60 shadow-sm"
                : "text-gray-400 hover:text-amber-500 bg-white/50 border-white/60 hover:shadow-sm"
            )}
            title={note.isConcept ? "Remove from concepts" : "Mark as concept"}
          >
            <Star
              className={cn(
                "w-5 h-5 transition-all",
                note.isConcept && "fill-current drop-shadow-sm"
              )}
            />
          </button>
          <div className="flex gap-1 md:gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-2 rounded-xl border border-white/70 bg-white/60 hover:bg-white/80 hover:scale-105 transition-all text-gray-500 hover:text-gray-700 shadow-sm touch-target-sm"
              title="Attach image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleOpenDrawing}
              onPointerDown={(e) => e.stopPropagation()}
              className={cn(
                "p-2 rounded-xl border border-white/70 bg-white/60 hover:bg-white/80 hover:scale-105 transition-all shadow-sm touch-target-sm",
                note.drawing
                  ? "text-blue-500 hover:text-blue-700"
                  : "text-gray-500 hover:text-gray-700"
              )}
              title={note.drawing ? "Edit sketch" : "Add sketch"}
            >
              <Pencil className="w-4 h-4" />
            </button>
            {note.isConcept && (
              <button
                onClick={() => {
                  setShowDetailsModal(true);
                  setDetailsText(note.details || "");
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="p-2 rounded-xl border border-white/70 bg-white/60 hover:bg-white/80 hover:scale-105 transition-all text-cyan-500 hover:text-cyan-700 shadow-sm touch-target-sm"
                title="Edit concept details"
              >
                <FileText className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onDelete}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-2 rounded-xl border border-white/70 bg-white/60 hover:bg-red-50 hover:scale-105 text-red-400 hover:text-red-600 transition-all shadow-sm touch-target-sm"
              title="Delete note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image */}
        {note.image && (
          <div className="mb-3 relative group">
            <img
              src={note.image.dataUrl}
              alt={note.image.caption || "Note attachment"}
              className="w-full h-32 object-cover rounded-lg cursor-pointer border border-gray-200 hover:border-gray-300 transition-colors"
              onClick={() => setShowImagePreview(true)}
              onPointerDown={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={handleRemoveImage}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute top-1.5 right-1.5 p-1 bg-white text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-red-50"
            >
              <X className="w-3 h-3" />
            </button>
            {note.image.caption && (
              <p className="text-xs text-gray-500 mt-1.5 italic">
                {note.image.caption}
              </p>
            )}
          </div>
        )}

        {/* Drawing */}
        {note.drawing?.dataUrl && (
          <div className="mb-3 relative group">
            <img
              src={note.drawing.dataUrl}
              alt="Sketch"
              className="w-full h-32 object-contain rounded-lg cursor-pointer border border-gray-200 hover:border-gray-300 transition-colors bg-white/50"
              onClick={handleOpenDrawing}
              onPointerDown={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={handleRemoveDrawing}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute top-1.5 right-1.5 p-1 bg-white text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-red-50"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-white/80 rounded-md text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-all">
              Click to edit
            </div>
          </div>
        )}

        {/* Source Question - Permanent display when note was created from AI panel */}
        {note.sourceQuestion && (
          <div
            className="mb-3 p-2.5 rounded-xl"
            style={{
              backgroundColor: `${palette.border}1a`,
              border: `1.5px solid ${palette.border}`,
            }}
          >
            <p
              className="text-sm font-bold leading-relaxed"
              style={{ color: palette.text }}
            >
              {note.sourceQuestion}
            </p>
          </div>
        )}

        {/* Text Content */}
        {isEditing ? (
          <div className="space-y-2" onPointerDown={(e) => e.stopPropagation()}>
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onFocus={(e) => {
                // Don't select all for new notes - just focus
                if (!note.isNewNote) {
                  e.currentTarget.select();
                }
              }}
              placeholder="Type your idea here..."
              className="w-full p-3 border rounded-xl text-sm resize-none bg-white/75 text-gray-900 focus:ring-4 focus:ring-blue-100 focus:border-transparent transition-all placeholder:text-gray-400 font-semibold shadow-sm"
              style={{
                borderColor: `${palette.border}80`,
                boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.65)",
              }}
              rows={3}
              autoFocus
              onBlur={handleTextSave}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleTextSave();
                }
              }}
              onDoubleClick={(e) => e.stopPropagation()}
            />
          </div>
        ) : (
          <p
            className="text-sm whitespace-pre-wrap break-words cursor-text leading-relaxed font-semibold"
            style={{ color: palette.text }}
            onClick={() => {
              setEditText(note.text);
              setIsEditing(true);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
          >
            {note.text || (
              <span className="text-gray-400 italic">Click to add text...</span>
            )}
          </p>
        )}

        {/* Delve Deeper Button */}
        {onDelveDeeper && note.text && note.text.trim() && (
          <div className="mt-3 pt-3 border-t border-gray-200/60">
            <div className="flex gap-2">
              {/* Delve Deeper Button */}
              <button
                onClick={() => onDelveDeeper(note.text)}
                onPointerDown={(e) => e.stopPropagation()}
                disabled={isDelvingDeeper}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundImage: isDelvingDeeper
                    ? "none"
                    : `linear-gradient(135deg, ${palette.surfaceFrom} 0%, ${palette.surfaceTo} 100%)`,
                  backgroundColor: isDelvingDeeper
                    ? "#f3f4f6"
                    : "rgba(255,255,255,0.92)",
                  color: isDelvingDeeper ? "#9ca3af" : palette.text,
                  border: `1.5px solid ${palette.border}`,
                  boxShadow: isDelvingDeeper
                    ? "none"
                    : `0 12px 24px -18px ${palette.glow}`,
                }}
                title="Ask AI to help you explore this idea deeper"
              >
                {isDelvingDeeper ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" />
                    <span>Delve Deeper</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Link Button Footer - visible on hover only when NOT in linking mode */}
        {onStartLinking && (
          <AnimatePresence>
            {(isNoteHovered || isLinkingFrom) && !isLinkingMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="mt-3 pt-3 border-t border-gray-200/60 flex justify-center overflow-hidden"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartLinking(note.id);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all relative",
                    isLinkingFrom
                      ? "bg-blue-500 text-white shadow-lg scale-110"
                      : "text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                  )}
                  title={
                    isLinkingFrom
                      ? "Click another note to link"
                      : "Link to another note"
                  }
                >
                  <Link2 className="w-4 h-4" />
                  {connectionCount > 0 && !isLinkingFrom && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {connectionCount}
                    </span>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Image Preview Modal */}
      {showImagePreview &&
        note.image &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 bg-teal-900/30 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setShowImagePreview(false)}
          >
            <div className="max-w-4xl max-h-full bg-white p-4 rounded-3xl shadow-2xl border-4 border-white">
              <img
                src={note.image.dataUrl}
                alt={note.image.caption || "Note attachment"}
                className="max-w-full max-h-[85vh] object-contain rounded-2xl"
              />
              {note.image.caption && (
                <p className="text-gray-700 text-center mt-4 font-bold">
                  {note.image.caption}
                </p>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Concept Details Modal */}
      {showDetailsModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 bg-teal-900/30 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setShowDetailsModal(false)}
          >
            <div
              className="fun-card p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-black text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-3xl">📝</span>
                Add Concept Details
              </h3>
              <p className="text-sm text-gray-600 mb-4 font-medium">
                Provide more information about this concept to help the AI
                evaluate it better.
              </p>

              {/* Show sticky note content for context */}
              <div
                className="p-4 rounded-2xl mb-5 border-2 border-dashed border-gray-200"
                style={{ backgroundColor: `${note.color}40` }}
              >
                <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wide">
                  Your concept:
                </p>
                <p className="text-sm text-gray-800 font-semibold whitespace-pre-wrap">
                  {note.text || (
                    <span className="italic text-gray-400">No text</span>
                  )}
                </p>
                {note.image && (
                  <img
                    src={note.image.dataUrl}
                    alt={note.image.caption || "Concept image"}
                    className="mt-3 max-h-24 rounded-xl object-cover border-2 border-white shadow-sm"
                  />
                )}
                {note.drawing?.dataUrl && (
                  <img
                    src={note.drawing.dataUrl}
                    alt="Concept sketch"
                    className="mt-3 max-h-24 rounded-xl object-cover border-2 border-white shadow-sm"
                  />
                )}
              </div>

              <div className="relative">
                <textarea
                  value={detailsText}
                  onChange={(e) => setDetailsText(e.target.value)}
                  placeholder="e.g., Why is this concept important? How does it address the HMW? What are its key features?"
                  className="w-full p-4 pr-14 border-3 border-teal-200 rounded-2xl text-sm resize-none bg-white text-gray-800 focus:border-teal-400 focus:ring-4 focus:ring-teal-200 transition-all placeholder:text-gray-400 font-semibold shadow-inner"
                  rows={5}
                  autoFocus
                />
                <button
                  onClick={
                    isRecordingDetails
                      ? stopDetailsRecording
                      : startDetailsRecording
                  }
                  className={`absolute right-3 top-3 p-2 rounded-xl transition-all ${
                    isRecordingDetails
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-teal-100 text-teal-600 hover:bg-teal-200"
                  }`}
                  title={
                    isRecordingDetails ? "Stop recording" : "Start recording"
                  }
                >
                  {isRecordingDetails ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      <Mic className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>
              </div>
              {isRecordingDetails && (
                <p className="text-xs text-teal-600 mt-2 font-semibold animate-pulse">
                  🎤 Listening... speak your concept details
                </p>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 px-5 py-3 border-3 border-gray-200 text-gray-600 rounded-2xl hover:bg-gray-50 transition-all text-sm font-black shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDetails}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-2xl hover:from-blue-600 hover:to-teal-600 transition-all text-sm font-black shadow-lg hover:shadow-teal transform hover:scale-105"
                >
                  Save Details ✨
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Drawing Modal */}
      {showDrawingModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 bg-teal-900/30 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 select-none no-callout"
            onClick={() => setShowDrawingModal(false)}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }}
            style={{
              WebkitUserSelect: "none",
              userSelect: "none",
              WebkitTouchCallout: "none",
            }}
          >
            <div
              className={cn(
                "fun-card w-full transition-all duration-300 flex flex-col select-none no-callout",
                isFullScreen ? "fixed inset-4 max-w-none z-[60]" : "max-w-2xl"
              )}
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }}
              style={{
                backgroundColor: getFunColor(note.color),
                padding: isFullScreen ? "24px" : "48px",
                WebkitUserSelect: "none",
                userSelect: "none",
                WebkitTouchCallout: "none",
                touchAction: "none",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                  <span className="text-3xl">✏️</span>
                  Sketch Your Concept
                </h3>
                <button
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="p-2 rounded-xl hover:bg-black/5 text-gray-600 transition-all"
                  title={isFullScreen ? "Exit full screen" : "Full screen"}
                >
                  {isFullScreen ? (
                    <Minimize2 className="w-5 h-5" />
                  ) : (
                    <Maximize2 className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-6 font-medium">
                Draw out your idea! Use the tools below to sketch.
              </p>

              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <DrawingCanvas
                  ref={drawingCanvasRef}
                  initialDrawing={note.drawing}
                  noteColor={note.color}
                  width={isFullScreen ? "100%" : 520}
                  height={isFullScreen ? "100%" : 380}
                />
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowDrawingModal(false)}
                  className="flex-1 px-5 py-3 border-3 border-gray-200 text-gray-600 rounded-2xl hover:bg-gray-50 transition-all text-sm font-black shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDrawing}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-2xl hover:from-blue-600 hover:to-teal-600 transition-all text-sm font-black shadow-lg transform hover:scale-105"
                >
                  Save Sketch ✨
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
