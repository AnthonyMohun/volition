// Voice command detection and parsing

export interface VoiceCommand {
  type:
    | "save-note"
    | "next-question"
    | "stop-listening"
    | "mark-concept"
    | "clear-transcript"
    | "none";
  payload?: string;
}

// Command patterns with variations
const COMMAND_PATTERNS: Record<VoiceCommand["type"], RegExp[]> = {
  "save-note": [
    /\b(save this|save that|add note|add this|create note|make a note|note this|capture this|write this down)\b/i,
  ],
  "next-question": [
    /\b(next question|new question|ask me|another question|give me a question|ask another)\b/i,
  ],
  "stop-listening": [
    /\b(stop listening|stop voice|pause listening|mute|turn off voice|voice off)\b/i,
  ],
  "mark-concept": [
    /\b(mark as concept|make this a concept|this is a concept|promote to concept|concept this)\b/i,
  ],
  "clear-transcript": [
    /\b(clear this|clear that|delete this|remove this|erase this|cancel this)\b/i,
  ],
  none: [],
};

/**
 * Parses a transcript to detect voice commands
 * Returns the command type and any relevant payload (text before the command)
 */
export function parseVoiceCommand(transcript: string): VoiceCommand {
  const normalizedTranscript = transcript.trim().toLowerCase();

  // Check each command type
  for (const [type, patterns] of Object.entries(COMMAND_PATTERNS) as [
    VoiceCommand["type"],
    RegExp[]
  ][]) {
    if (type === "none") continue;

    for (const pattern of patterns) {
      const match = normalizedTranscript.match(pattern);
      if (match) {
        // For save-note, extract text before the command as payload
        if (type === "save-note") {
          const index = normalizedTranscript.indexOf(match[0].toLowerCase());
          const textBefore = transcript.slice(0, index).trim();
          return {
            type,
            payload: textBefore || undefined,
          };
        }
        return { type };
      }
    }
  }

  return { type: "none" };
}

/**
 * Check if a transcript contains any command
 */
export function hasCommand(transcript: string): boolean {
  return parseVoiceCommand(transcript).type !== "none";
}

/**
 * Remove command phrases from transcript to get clean content
 */
export function stripCommand(transcript: string): string {
  let result = transcript;

  for (const patterns of Object.values(COMMAND_PATTERNS)) {
    for (const pattern of patterns) {
      result = result.replace(pattern, "").trim();
    }
  }

  // Clean up extra whitespace
  return result.replace(/\s+/g, " ").trim();
}

/**
 * Get a user-friendly label for a command type
 */
export function getCommandLabel(type: VoiceCommand["type"]): string {
  switch (type) {
    case "save-note":
      return "Save as note";
    case "next-question":
      return "Ask next question";
    case "stop-listening":
      return "Stop listening";
    case "mark-concept":
      return "Mark as concept";
    case "clear-transcript":
      return "Clear transcript";
    default:
      return "";
  }
}
