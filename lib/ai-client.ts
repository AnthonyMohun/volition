/**
 * Uses the local LM to correct and clarify a speech transcript.
 * Returns the improved transcript.
 */
export async function improveTranscript(transcript: string): Promise<string> {
  try {
    const response = await askAI(
      [
        {
          role: "system",
          content:
            "You are a transcription corrector for a voice-driven design app. Given a possibly inaccurate or ambiguous transcript, rewrite it to best reflect what the user likely meant, correcting misheard words and clarifying context. Only return the improved transcript, no explanation.",
        },
        {
          role: "user",
          content: `Original transcript: "${transcript}"`,
        },
      ],
      0.2,
      100
    );
    return response.trim();
  } catch (error) {
    console.warn("Transcript improvement failed, returning original:", error);
    return transcript;
  }
}
// Client-side AI communication utilities

export interface MessageContentText {
  type: "text";
  text: string;
}

export interface MessageContentImage {
  type: "image_url";
  image_url: {
    url: string;
  };
}

export type MessageContent =
  | string
  | (MessageContentText | MessageContentImage)[];

export interface Message {
  role: "system" | "user" | "assistant";
  content: MessageContent;
}

export type MessageRole = "system" | "user" | "assistant";

export interface AIResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}

export type VoiceCommandType =
  | "save-note"
  | "next-question"
  | "delve-deeper"
  | "stop-listening"
  | "mark-concept"
  | "delete-note"
  | "none";

export const SOCRATIC_SYSTEM_PROMPT = `You are a friendly design coach. Your job is to ask ONE short question that helps the student think deeper about their ideas.

RULES:
- Ask only ONE question
- Keep it under 15 words
- Be specific - mention their actual ideas when you can
- Push them to be more concrete and specific
- No explanations, just the question

GOOD QUESTIONS:
- "Who exactly has this problem?"
- "What's the first thing a user would do?"
- "Why would someone choose this?"
- "What makes this different from what exists?"
- "What's the hardest part about building this?"`;

// Simpler prompt for delve deeper
export const DELVE_DEEPER_SYSTEM_PROMPT = `You are a design coach helping someone develop their idea.

RULES:
- Read their idea carefully
- Ask ONE question that builds on what they wrote
- Reference something specific from their idea
- Keep it under 15 words
- Just the question, nothing else`;

// Question banks for different stages
export const OPENING_QUESTIONS = [
  "Who has this problem?",
  "What do people do today to solve this?",
  "When is this problem most frustrating?",
  "Why does this matter?",
];

export const DEEPENING_QUESTIONS = [
  "What's the simplest version of this?",
  "What would make someone use this every day?",
  "What's the main benefit?",
  "What makes this different?",
];

export const EXPANSION_QUESTIONS = [
  "What else could this solve?",
  "Who else might want this?",
  "What's the bigger vision?",
  "What would make this 10x better?",
];

export const UNSTUCK_QUESTIONS = [
  "What's the dream version of this?",
  "What would a competitor never try?",
  "What assumption might be wrong?",
];

export const SYNTHESIS_QUESTIONS = [
  "What connects these ideas?",
  "Which idea excites you most?",
  "What's the core concept here?",
];

export async function askAI(
  messages: Message[],
  temperature = 0.7,
  maxTokens = 150
): Promise<string> {
  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get AI response");
    }

    const data: AIResponse = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error("Invalid response format from AI");
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error("AI request failed:", error);
    throw error;
  }
}

export async function classifyVoiceCommand(
  transcript: string
): Promise<VoiceCommandType> {
  try {
    const response = await askAI(
      [
        {
          role: "system",
          content: `You are a voice command classifier for a design ideation app. Classify the user's spoken input into exactly one of these categories:

- save-note: Saving or capturing an idea/note
- next-question: Requesting the next question from AI
- delve-deeper: Asking to explore or develop an idea further
- stop-listening: Stopping voice input or listening
- mark-concept: Promoting a note to a concept
- delete-note: Deleting or removing a note
- none: Not a command, just regular speech

Return ONLY the category name in lowercase, nothing else. If unsure, return "none".`,
        },
        {
          role: "user",
          content: `Classify this spoken input: "${transcript}"`,
        },
      ],
      0.1,
      50
    ); // Low temperature for consistent classification

    const type = response.trim().toLowerCase() as VoiceCommandType;

    // Validate the response
    const validTypes: VoiceCommandType[] = [
      "save-note",
      "next-question",
      "delve-deeper",
      "stop-listening",
      "mark-concept",
      "delete-note",
      "none",
    ];

    if (validTypes.includes(type)) {
      return type;
    }

    return "none";
  } catch (error) {
    console.warn("AI command classification failed:", error);
    return "none";
  }
}

export function buildConversationContext(
  hmwStatement: string,
  allNotes: Array<{
    id?: string;
    text: string;
    image?: { caption?: string };
    createdAt?: number;
  }>,
  concepts: Array<{
    title: string;
    description: string;
    targetAudience?: string;
    platform?: string[];
    keyBenefits?: string;
    mainFeatures?: string;
  }>,
  connections?: Array<{
    fromNoteId: string;
    toNoteId: string;
    type: string;
    createdAt?: number;
  }>
): string {
  let context = `Challenge: ${hmwStatement}\n\n`;

  if (allNotes.length > 0) {
    context += `Their notes:\n`;
    allNotes.forEach((note, i) => {
      context += `- ${note.text}\n`;
    });
    context += "\n";
  }

  if (concepts.length > 0) {
    context += `Their concepts:\n`;
    concepts.forEach((concept) => {
      context += `- ${concept.title}: ${concept.description}\n`;
    });
  }

  return context;
}
