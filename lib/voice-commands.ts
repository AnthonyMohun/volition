// Voice command detection and parsing

export interface VoiceCommand {
  type:
    | "save-note"
    | "next-question"
    | "delve-deeper"
    | "stop-listening"
    | "mark-concept"
    | "delete-note"
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
  "delve-deeper": [
    /\b(delve deeper|deepen this|explore this|develop this|go deeper|dig deeper|elaborate on this)\b/i,
  ],
  "stop-listening": [
    /\b(stop listening|stop voice|pause listening|mute|turn off voice|voice off)\b/i,
  ],
  "mark-concept": [
    /\b(mark as concept|make this a concept|this is a concept|promote to concept|concept this)\b/i,
  ],
  "delete-note": [
    /\b(delete that|remove that|erase that|delete this|remove this|erase this|undo that|take that back)\b/i,
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
    case "delve-deeper":
      return "Delve deeper";
    case "stop-listening":
      return "Stop listening";
    case "mark-concept":
      return "Mark as concept";
    case "delete-note":
      return "Delete last note";
    default:
      return "";
  }
}
