"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

/**
 * VoiceInput handles speech recognition logic only.
 * The visible UI controls (mic button, spacebar) are in the canvas floating toolbar.
 * This component is rendered hidden in the AI panel but processes voice input.
 */
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

    recognition.onresult = async (event: SpeechRecognitionEvent) => {
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
        const command = await parseVoiceCommand(fullTranscript);

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
    // Render nothing - the canvas toolbar will show voice is unavailable
    return null;
  }

  // This component has no visible UI - controls are in canvas floating toolbar
  // It just handles the speech recognition lifecycle
  return null;
}
