// Text-to-speech utilities using Web Speech API with local server fallback

interface SpeechOptions {
  rate?: number; // 0.1 to 10, default 1
  pitch?: number; // 0 to 2, default 1
  volume?: number; // 0 to 1, default 1
  voice?: SpeechSynthesisVoice;
  useLocalServer?: boolean; // Force using local TTS server
}

// Queue for managing speech utterances
let speechQueue: SpeechSynthesisUtterance[] = [];
let isSpeaking = false;

// Audio element for local TTS playback
let audioElement: HTMLAudioElement | null = null;
let localServerAvailable: boolean | null = null; // Cached availability check

/**
 * Check if browser's Web Speech API is supported
 */
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Check if any TTS method is available (local server or Web Speech API)
 */
export async function isTTSAvailable(): Promise<boolean> {
  const localAvailable = await checkLocalTTSServer();
  if (localAvailable) return true;
  return isSpeechSynthesisSupported();
}

/**
 * Check if local TTS server is available
 */
export async function checkLocalTTSServer(): Promise<boolean> {
  if (localServerAvailable !== null) return localServerAvailable;

  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "test", language: "en" }),
    });
    localServerAvailable = response.ok;
  } catch {
    localServerAvailable = false;
  }
  return localServerAvailable;
}

/**
 * Reset local server availability cache (call if server status changes)
 */
export function resetLocalServerCache(): void {
  localServerAvailable = null;
}

/**
 * Get available voices, preferring English voices
 */
export function getVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  return window.speechSynthesis.getVoices();
}

/**
 * Get a good default English voice
 */
export function getDefaultVoice(): SpeechSynthesisVoice | null {
  const voices = getVoices();

  // Prefer natural/enhanced voices
  const preferredVoices = [
    "Samantha", // macOS
    "Alex", // macOS
    "Google US English", // Chrome
    "Microsoft Zira", // Windows
    "Microsoft David", // Windows
  ];

  for (const preferred of preferredVoices) {
    const voice = voices.find((v) => v.name.includes(preferred));
    if (voice) return voice;
  }

  // Fall back to first English voice
  const englishVoice = voices.find((v) => v.lang.startsWith("en"));
  if (englishVoice) return englishVoice;

  // Last resort: first available voice
  return voices[0] || null;
}

/**
 * Process the speech queue
 */
function processQueue() {
  if (isSpeaking || speechQueue.length === 0) return;

  const utterance = speechQueue.shift();
  if (!utterance) return;

  isSpeaking = true;

  utterance.onend = () => {
    isSpeaking = false;
    processQueue();
  };

  utterance.onerror = () => {
    isSpeaking = false;
    processQueue();
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Speak text using local TTS server (fallback for unsupported browsers)
 */
async function speakWithLocalServer(text: string, volume = 1): Promise<void> {
  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language: "en" }),
    });

    if (!response.ok) {
      throw new Error("Local TTS server request failed");
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    // Clean up previous audio element
    if (audioElement) {
      audioElement.pause();
      URL.revokeObjectURL(audioElement.src);
    }

    audioElement = new Audio(audioUrl);
    audioElement.volume = volume;
    isSpeaking = true;

    return new Promise((resolve, reject) => {
      if (!audioElement) {
        reject(new Error("Audio element not created"));
        return;
      }

      audioElement.onended = () => {
        isSpeaking = false;
        URL.revokeObjectURL(audioUrl);
        resolve();
      };

      audioElement.onerror = (e) => {
        isSpeaking = false;
        URL.revokeObjectURL(audioUrl);
        reject(new Error(`Audio playback error: ${e}`));
      };

      audioElement.play().catch((err) => {
        isSpeaking = false;
        URL.revokeObjectURL(audioUrl);
        reject(err);
      });
    });
  } catch (error) {
    isSpeaking = false;
    throw error;
  }
}

/**
 * Speak text aloud - prefers local server for consistent quality, falls back to Web Speech API
 */
export async function speak(
  text: string,
  options: SpeechOptions = {}
): Promise<void> {
  const forceWebSpeech = options.useLocalServer === false;

  // Prefer local server for consistent high-quality voice across all devices
  if (!forceWebSpeech) {
    const serverAvailable = await checkLocalTTSServer();
    if (serverAvailable) {
      return speakWithLocalServer(text, options.volume ?? 1);
    }
  }

  // Fall back to Web Speech API
  const webSpeechSupported = isSpeechSynthesisSupported();
  if (!webSpeechSupported) {
    throw new Error(
      "Speech synthesis not supported and local server unavailable"
    );
  }

  // Use Web Speech API
  return new Promise((resolve, reject) => {
    // Cancel any existing speech
    window.speechSynthesis.cancel();
    speechQueue = [];

    const utterance = new SpeechSynthesisUtterance(text);

    // Apply options
    utterance.rate = options.rate ?? 1;
    utterance.pitch = options.pitch ?? 1;
    utterance.volume = options.volume ?? 1;

    // Set voice
    if (options.voice) {
      utterance.voice = options.voice;
    } else {
      const defaultVoice = getDefaultVoice();
      if (defaultVoice) {
        utterance.voice = defaultVoice;
      }
    }

    utterance.onend = () => {
      isSpeaking = false;
      resolve();
    };

    utterance.onerror = (event) => {
      isSpeaking = false;
      reject(new Error(`Speech error: ${event.error}`));
    };

    speechQueue.push(utterance);
    processQueue();
  });
}

/**
 * Stop all speech immediately
 */
export function stopSpeaking(): void {
  // Stop local audio if playing
  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
  }

  // Stop Web Speech API
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }

  speechQueue = [];
  isSpeaking = false;
}

/**
 * Check if currently speaking
 */
export function isCurrentlySpeaking(): boolean {
  // Check local audio
  if (audioElement && !audioElement.paused) {
    return true;
  }
  // Check Web Speech API
  if (isSpeechSynthesisSupported()) {
    return window.speechSynthesis.speaking;
  }
  return isSpeaking;
}

/**
 * Pause speech
 */
export function pauseSpeaking(): void {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.pause();
}

/**
 * Resume speech
 */
export function resumeSpeaking(): void {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.resume();
}
