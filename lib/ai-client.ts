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
  maxTokens = 500
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

export function buildConversationContext(
  hmwStatement: string,
  recentNotes: Array<{ text: string; image?: { caption?: string } }>,
  concepts: Array<{ title: string; description: string }>
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
    });
  }

  return context;
}
