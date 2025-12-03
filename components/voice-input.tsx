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

// Local STT server integration
async function transcribeWithLocalServer(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
  formData.append("language", "en-US");
  formData.append("useWhisper", "true"); // Use offline Whisper for reliability

  const response = await fetch("/api/stt", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("STT server request failed");
  }

  const data = await response.json();
  return data.text || data.transcript || "";
}

async function checkLocalSTTServer(): Promise<boolean> {
  try {
    // Create a tiny silent audio blob to test the server
    const response = await fetch("/api/stt", {
      method: "POST",
      body: new FormData(), // Empty form will fail validation but confirm server is up
    });
    // 400 means server is running but rejected empty request - that's fine
    return response.status === 400 || response.ok;
  } catch {
    return false;
  }
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
  const [useLocalServer, setUseLocalServer] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const accumulatedTranscriptRef = useRef("");
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Use a ref to track enabled state to avoid stale closures in recognition callbacks
  const isEnabledRef = useRef(isEnabled);

  // Local server recording state
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Keep the ref in sync with the prop
  useEffect(() => {
    isEnabledRef.current = isEnabled;
  }, [isEnabled]);

  // Check browser support and local server availability
  useEffect(() => {
    const checkSupport = async () => {
      const SpeechRecognitionAPI =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const webSpeechSupported = !!SpeechRecognitionAPI;

      if (webSpeechSupported) {
        setIsSupported(true);
        setUseLocalServer(false);
        return;
      }

      // Web Speech API not available, check local server
      const localServerAvailable = await checkLocalSTTServer();
      if (localServerAvailable) {
        setIsSupported(true);
        setUseLocalServer(true);
        console.log("Using local STT server for voice input");
      } else {
        setIsSupported(false);
        console.warn("Neither Web Speech API nor local STT server available");
      }
    };

    checkSupport();
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
      // Use ref to get current enabled state, not the stale closure value
      if (isEnabledRef.current && recognitionRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          // Double-check we're still enabled before restarting
          if (isEnabledRef.current) {
            try {
              recognitionRef.current?.start();
            } catch (e) {
              // Ignore start errors
            }
          }
        }, 100);
      }
    };

    return recognition;
  }, [onTranscript, onCommand]); // Removed isEnabled - using isEnabledRef instead to avoid stale closures

  // Initialize local server recording (fallback when Web Speech API unavailable)
  const startLocalRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length === 0) return;

        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType,
        });

        try {
          const transcript = await transcribeWithLocalServer(audioBlob);
          if (transcript && transcript.trim()) {
            accumulatedTranscriptRef.current = transcript.trim();
            const command = await parseVoiceCommand(transcript);

            if (command.type !== "none") {
              onCommand(command, transcript);
              accumulatedTranscriptRef.current = "";
            } else {
              onTranscript(transcript, true);
            }
          }
        } catch (err) {
          console.error("Local STT error:", err);
          setError("Failed to transcribe audio");
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect chunks every second
      setIsListening(true);
      setError(null);
    } catch (err) {
      console.error("Failed to start recording:", err);
      setError("Microphone access denied");
    }
  }, [onTranscript, onCommand]);

  const stopLocalRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsListening(false);
  }, []);

  // Start/stop recognition based on isEnabled
  useEffect(() => {
    if (isEnabled && isSupported) {
      if (useLocalServer) {
        // Use local server recording
        startLocalRecording();
      } else {
        // Use Web Speech API
        if (!recognitionRef.current) {
          recognitionRef.current = initRecognition();
        }
        try {
          recognitionRef.current?.start();
        } catch (e) {
          // Already started, ignore
        }
      }
    } else {
      if (useLocalServer) {
        stopLocalRecording();
      } else {
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current);
        }
        recognitionRef.current?.stop();
      }
      setIsListening(false);
      setInterimTranscript("");
      accumulatedTranscriptRef.current = "";
    }

    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, [
    isEnabled,
    isSupported,
    useLocalServer,
    initRecognition,
    startLocalRecording,
    stopLocalRecording,
  ]);

  // Pause/resume recognition when muted (AI speaking)
  useEffect(() => {
    if (!isEnabled) return;

    if (useLocalServer) {
      // For local server, stop/start recording
      if (isMuted) {
        stopLocalRecording();
      } else {
        startLocalRecording();
      }
    } else {
      // For Web Speech API
      if (!recognitionRef.current) return;

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
    }
  }, [
    isMuted,
    isEnabled,
    useLocalServer,
    startLocalRecording,
    stopLocalRecording,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      recognitionRef.current?.stop();
      stopLocalRecording();
    };
  }, [stopLocalRecording]);

  if (!isSupported) {
    // Render nothing - the canvas toolbar will show voice is unavailable
    return null;
  }

  // This component has no visible UI - controls are in canvas floating toolbar
  // It just handles the speech recognition lifecycle
  return null;
}
