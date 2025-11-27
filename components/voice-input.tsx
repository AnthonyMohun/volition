"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { parseVoiceCommand, VoiceCommand } from "@/lib/voice-commands";

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface VoiceInputProps {
  onTranscript: (transcript: string, isFinal: boolean) => void;
  onCommand: (command: VoiceCommand, fullTranscript: string) => void;
  isEnabled: boolean;
  onToggle: () => void;
  isMuted?: boolean; // Mutes mic when AI is speaking to prevent feedback
}

export function VoiceInput({
  onTranscript,
  onCommand,
  isEnabled,
  onToggle,
  isMuted = false,
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const accumulatedTranscriptRef = useRef("");
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check browser support
  useEffect(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionAPI);
  }, []);

  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return null;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);

      if (final) {
        // Accumulate the final transcript
        accumulatedTranscriptRef.current += " " + final;
        const fullTranscript = accumulatedTranscriptRef.current.trim();

        // Check for commands in the accumulated transcript
        const command = parseVoiceCommand(fullTranscript);

        if (command.type !== "none") {
          onCommand(command, fullTranscript);
          // Reset accumulated transcript after command
          accumulatedTranscriptRef.current = "";
          setInterimTranscript("");
        } else {
          // Send transcript for context building
          onTranscript(fullTranscript, true);
        }
      } else if (interim) {
        // Send interim results for live preview
        const fullInterim = (
          accumulatedTranscriptRef.current +
          " " +
          interim
        ).trim();
        onTranscript(fullInterim, false);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // "aborted" is normal when we intentionally stop recognition (e.g., when AI speaks)
      // "no-speech" is normal when user is silent
      if (event.error === "aborted" || event.error === "no-speech") {
        setError(null);
        return;
      }

      console.error("Speech recognition error:", event.error);

      if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow microphone access.");
        setIsListening(false);
      } else if (event.error === "network") {
        setError("Network error. Please check your connection.");
      } else {
        setError(`Error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);

      // Auto-restart if still enabled (continuous listening)
      if (isEnabled && recognitionRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          try {
            recognitionRef.current?.start();
          } catch (e) {
            // Ignore start errors
          }
        }, 100);
      }
    };

    return recognition;
  }, [isEnabled, onTranscript, onCommand]);

  // Start/stop recognition based on isEnabled
  useEffect(() => {
    if (isEnabled && isSupported) {
      if (!recognitionRef.current) {
        recognitionRef.current = initRecognition();
      }

      try {
        recognitionRef.current?.start();
      } catch (e) {
        // Already started, ignore
      }
    } else {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      recognitionRef.current?.stop();
      setIsListening(false);
      setInterimTranscript("");
      accumulatedTranscriptRef.current = "";
    }

    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, [isEnabled, isSupported, initRecognition]);

  // Pause/resume recognition when muted (AI speaking)
  useEffect(() => {
    if (!isEnabled || !recognitionRef.current) return;

    if (isMuted) {
      // Stop recognition while AI is speaking
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        // Ignore errors
      }
    } else {
      // Resume recognition after AI stops speaking
      try {
        recognitionRef.current?.start();
      } catch (e) {
        // Already started or other error, ignore
      }
    }
  }, [isMuted, isEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      recognitionRef.current?.stop();
    };
  }, []);

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border-2 border-amber-200 rounded-xl text-amber-700 text-xs">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span className="font-semibold">
          Voice input requires Chrome or Edge
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Mic Toggle Button */}
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shadow-md ${
          isEnabled
            ? "bg-gradient-to-r from-red-500 to-teal-500 text-white hover:from-red-600 hover:to-teal-600"
            : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600"
        }`}
      >
        {isEnabled ? (
          <>
            <motion.div
              animate={{ scale: isListening ? [1, 1.2, 1] : 1 }}
              transition={{ repeat: isListening ? Infinity : 0, duration: 1 }}
            >
              <Mic className="w-4 h-4" />
            </motion.div>
            <span>Stop Voice</span>
          </>
        ) : (
          <>
            <MicOff className="w-4 h-4" />
            <span>Start Voice</span>
          </>
        )}
      </button>

      {/* Listening Indicator */}
      <AnimatePresence>
        {isEnabled && (isListening || isMuted) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className={`flex items-center gap-2 px-3 py-2 border-2 rounded-xl ${
                isMuted
                  ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200"
                  : "bg-gradient-to-r from-blue-50 to-teal-50 border-blue-200"
              }`}
            >
              {/* Pulsing indicator */}
              <div className="flex gap-1">
                {[0, 1].map((i) => (
                  <motion.div
                    key={i}
                    className={`w-1.5 h-4 rounded-full ${
                      isMuted ? "bg-amber-400" : "bg-teal-500"
                    }`}
                    animate={{
                      scaleY: isMuted ? 1 : [1, 1.5, 1],
                    }}
                    transition={{
                      repeat: isMuted ? 0 : Infinity,
                      duration: 0.5,
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </div>
              <span
                className={`text-xs font-bold ${
                  isMuted ? "text-amber-700" : "text-teal-700"
                }`}
              >
                {isMuted ? "Paused (AI speaking)..." : "Listening..."}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 px-3 py-2 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-xs"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="font-semibold">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
