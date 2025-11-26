// Text-to-speech utilities using Web Speech API

interface SpeechOptions {
  rate?: number; // 0.1 to 10, default 1
  pitch?: number; // 0 to 2, default 1
  volume?: number; // 0 to 1, default 1
  voice?: SpeechSynthesisVoice;
}

// Queue for managing speech utterances
let speechQueue: SpeechSynthesisUtterance[] = [];
let isSpeaking = false;

/**
 * Check if speech synthesis is supported
 */
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
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
 * Speak text aloud
 */
export function speak(
  text: string,
  options: SpeechOptions = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isSpeechSynthesisSupported()) {
      reject(new Error("Speech synthesis not supported"));
      return;
    }

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
  if (!isSpeechSynthesisSupported()) return;

  window.speechSynthesis.cancel();
  speechQueue = [];
  isSpeaking = false;
}

/**
 * Check if currently speaking
 */
export function isCurrentlySpeaking(): boolean {
  if (!isSpeechSynthesisSupported()) return false;
  return window.speechSynthesis.speaking;
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
