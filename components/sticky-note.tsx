"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { StickyNote as StickyNoteType, DrawingData } from "@/lib/types";
import {
  Trash2,
  Image as ImageIcon,
  Star,
  X,
  FileText,
  Pencil,
  Type,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DrawingCanvas, DrawingCanvasHandle } from "./drawing-canvas";
import { motion } from "framer-motion";

interface StickyNoteProps {
  note: StickyNoteType;
  onUpdate: (updates: Partial<StickyNoteType>) => void;
  onDelete: () => void;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function StickyNote({
  note,
  onUpdate,
  onDelete,
  isDragging,
  dragHandleProps,
}: StickyNoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(note.text);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsText, setDetailsText] = useState(note.details || "");
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [showDrawingModal, setShowDrawingModal] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isRecordingDetails, setIsRecordingDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const drawingCanvasRef = useRef<DrawingCanvasHandle>(null);
  const detailsRecognitionRef = useRef<any>(null);

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
    if (editText.trim()) {
      onUpdate({ text: editText.trim() });
      setIsEditing(false);
    }
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

  // Get accent color for borders and highlights
  const getAccentColor = (color: string) => {
    const accentMap: Record<string, string> = {
      "#fef3c7": "#fbbf24", // yellow
      "#fecaca": "#f87171", // red
      "#bbf7d0": "#34d399", // green
      "#bfdbfe": "#60a5fa", // blue
      "#dbeafe": "#3b82f6", // light blue
      "#dcfce7": "#14b8a6", // light teal
    };
    return accentMap[color] || "#e5e7eb";
  };

  // Get shadow color for depth
  const getShadowColor = (color: string) => {
    const shadowMap: Record<string, string> = {
      "#fef3c7": "rgba(251, 191, 36, 0.4)", // yellow
      "#fecaca": "rgba(248, 113, 113, 0.4)", // red
      "#bbf7d0": "rgba(52, 211, 153, 0.4)", // green
      "#bfdbfe": "rgba(96, 165, 250, 0.4)", // blue
      "#dbeafe": "rgba(59, 130, 246, 0.4)", // blue
      "#dcfce7": "rgba(20, 184, 166, 0.4)", // teal
    };
    return shadowMap[color] || "rgba(163, 177, 198, 0.3)";
  };

  return (
    <>
      <div
        {...dragHandleProps}
        className={cn(
          "w-56 md:w-64 p-4 md:p-5 rounded-3xl transition-all cursor-move relative no-select",
          isDragging && "opacity-60 scale-95",
          note.isConcept &&
            "ring-4 ring-yellow-400/40 ring-offset-4 ring-offset-white/50 scale-105",
          !note.isConcept && "hover:-translate-y-2 hover:scale-102"
        )}
        style={{
          backgroundColor: getFunColor(note.color),
          borderWidth: "3px",
          borderStyle: "solid",
          borderColor: getAccentColor(note.color),
          boxShadow: note.isConcept
            ? `12px 12px 24px ${getShadowColor(
                note.color
              )}, -4px -4px 12px rgba(255, 255, 255, 0.8), inset 2px 2px 4px rgba(255, 255, 255, 0.5), inset -2px -2px 4px ${getShadowColor(
                note.color
              )}`
            : `8px 8px 16px ${getShadowColor(
                note.color
              )}, -2px -2px 8px rgba(255, 255, 255, 0.6), inset 1px 1px 2px rgba(255, 255, 255, 0.3)`,
        }}
      >
        {/* Concept star badge */}
        {note.isConcept && (
          <div className="absolute -top-3 -right-3 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full p-2 shadow-lg animate-pulse">
            <Star className="w-5 h-5 text-white fill-current drop-shadow-md" />
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={toggleConcept}
            onPointerDown={(e) => e.stopPropagation()}
            className={cn(
              "p-2 md:p-2 rounded-xl hover:scale-110 transition-all shadow-sm touch-target-sm",
              note.isConcept
                ? "text-yellow-600 bg-yellow-100/80"
                : "text-gray-400 hover:text-yellow-500 hover:bg-white/50"
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
              className="p-2 rounded-xl hover:bg-white/60 hover:scale-110 transition-all text-gray-500 hover:text-gray-700 shadow-sm touch-target-sm"
              title="Attach image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleOpenDrawing}
              onPointerDown={(e) => e.stopPropagation()}
              className={cn(
                "p-2 rounded-xl hover:bg-white/60 hover:scale-110 transition-all shadow-sm touch-target-sm",
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
                className="p-2 rounded-xl hover:bg-white/60 hover:scale-110 transition-all text-teal-500 hover:text-teal-700 shadow-sm touch-target-sm"
                title="Edit concept details"
              >
                <FileText className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onDelete}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-2 rounded-xl hover:bg-red-100 hover:scale-110 text-red-400 hover:text-red-600 transition-all shadow-sm touch-target-sm"
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

        {/* Text Content */}
        {isEditing ? (
          <div className="space-y-2" onPointerDown={(e) => e.stopPropagation()}>
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onFocus={(e) => {
                e.currentTarget.select();
              }}
              className="w-full p-3 border-2 border-gray-300 rounded-xl text-sm resize-none bg-white/70 text-gray-800 focus:border-teal-400 focus:ring-4 focus:ring-teal-200 focus:bg-white transition-all placeholder:text-gray-400 font-semibold shadow-inner"
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
            className="text-sm text-gray-800 whitespace-pre-wrap break-words cursor-text leading-relaxed font-bold"
            onClick={() => setIsEditing(true)}
            onPointerDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
          >
            {note.text}
          </p>
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
              <p className="text-sm text-gray-600 mb-5 font-medium">
                Provide more information about this concept to help the AI
                evaluate it better.
              </p>
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
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 px-5 py-3 border-3 border-gray-200 text-gray-600 rounded-2xl hover:bg-gray-50 transition-all text-sm font-black shadow-sm"
                >
                  Skip for now
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
            className="fixed inset-0 bg-teal-900/30 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setShowDrawingModal(false)}
          >
            <div
              className={cn(
                "fun-card w-full transition-all duration-300 flex flex-col",
                isFullScreen ? "fixed inset-4 max-w-none z-[60]" : "max-w-2xl"
              )}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: getFunColor(note.color),
                padding: isFullScreen ? "24px" : "48px",
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
