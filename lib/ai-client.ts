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

export const SOCRATIC_SYSTEM_PROMPT = `You are an expert, friendly Interaction Design mentor. Your task is to guide the user through structured creative thinking methods (such as SCAMPER, Worst Possible Idea, or Forced Connections) to help them generate design concepts and solutions.

YOUR BEHAVIOR:
1. Strictly adhere to the chosen creative method, following its steps/keys sequentially.
2. Ask ONE highly focused, probing question at a time.
3. Your responses MUST ONLY contain the question itself. DO NOT include:
   - Greetings or conversational filler ("Let's start...", "Great!", "I see...")
   - Summaries or recaps
   - Method key prefixes ("SCAMPER - Substitute:", "S -", etc.)
   - Suggested ideas or solutions
   - Explanations of the method
4. Keep your questions clear, concise, and directly related to the current design challenge.
5. Build on previous responses to guide deeper exploration and concept development.
6. Prioritize open-ended questions that encourage divergent thinking.
7. Use SCAMPER techniques (Substitute, Combine, Adapt, Modify, Put to another use, Eliminate, Reverse) to challenge assumptions.

Remember: Your goal is to help the user develop their own concepts through guided discovery, not to provide answers.`;

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
