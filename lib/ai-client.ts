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

export const SOCRATIC_SYSTEM_PROMPT = `You are an expert Interaction Design mentor guiding students through creative thinking methods (SCAMPER, Worst Possible Idea, Forced Connections) to generate design concepts.

CRITICAL RULES:
1. Ask ONE short, focused question at a time (max 15-20 words).
2. Your response must ONLY be the question—nothing else.
3. NEVER include:
   - Filler ("Let's start...", "Great!", "I see...")
   - Recaps or summaries
   - Method labels ("SCAMPER:", "Substitute:", etc.)
   - Ideas or suggestions
   - Explanations
4. Build on the user's previous answer to go deeper.
5. Use open-ended "what if" and "how might" questions.

Your goal: Help users discover their own ideas through sharp, probing questions.`;

export async function askAI(
  messages: Message[],
  temperature = 0.7,
  maxTokens = 8000
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
  recentNotes: Array<{ text: string; image?: { caption?: string } }>,
  concepts: Array<{
    title: string;
    description: string;
    targetAudience?: string;
    platform?: string[];
    keyBenefits?: string;
    mainFeatures?: string;
  }>
): string {
  let context = `Project Context:\nHow Might We: ${hmwStatement}\n\n`;

  if (recentNotes.length > 0) {
    context += `Recent student notes:\n`;
    recentNotes.slice(-5).forEach((note, i) => {
      context += `${i + 1}. ${note.text}`;
      if (note.image?.caption) {
        context += ` [Image: ${note.image.caption}]`;
      }
      context += "\n";
    });
    context += "\n";
  }

  if (concepts.length > 0) {
    context += `Current concepts:\n`;
    concepts.forEach((concept, i) => {
      context += `${i + 1}. ${concept.title}: ${concept.description}\n`;
      if (concept.targetAudience)
        context += `   Target Audience: ${concept.targetAudience}\n`;
      if (concept.platform && concept.platform.length)
        context += `   Platform: ${concept.platform.join(", ")}\n`;
      if (concept.keyBenefits)
        context += `   Key Benefits: ${concept.keyBenefits}\n`;
      if (concept.mainFeatures)
        context += `   Main Features: ${concept.mainFeatures}\n`;
    });
  }

  return context;
}
