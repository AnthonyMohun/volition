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

export const SOCRATIC_SYSTEM_PROMPT = `You are a design thinking facilitator helping users generate product/service concepts.

YOUR ROLE: Ask focused questions that help users:
1. Uncover unmet needs and pain points
2. Explore different user perspectives  
3. Generate concrete solution ideas
4. Connect ideas in new ways

CRITICAL - DIVERGENT THINKING:
- ALWAYS guide users toward UNEXPLORED angles and perspectives
- Review their existing notes and ask about aspects NOT yet covered
- If they've focused on features, ask about users. If they've focused on users, ask about business model.
- Push them to consider: different user segments, alternative contexts, opposite approaches, adjacent problems
- NEVER ask questions that would lead to ideas similar to what's already on their board

QUESTION TYPES TO USE:
- NEEDS: "What frustrates [users] most about...?" / "When do they feel stuck?"
- PERSPECTIVE: "How would [specific person] solve this?" / "What would [industry] do?"
- FEATURES: "What's one thing that would make this 10x better?"
- CONSTRAINTS: "What if you only had [time/budget/feature]?"
- COMBINATIONS: "What if you combined [idea A] with [idea B]?"
- EXTREMES: "What's the premium version?" / "What's the free version?"
- UNEXPLORED: "What angle haven't you considered yet?" / "Who else might benefit from this?"

FORMAT:
- Ask ONE clear question per response
- Keep questions under 15 words
- Be specific to their context - reference their HMW and notes
- No greetings, no filler, no explanations - just the question

EXAMPLES:
"What's the #1 thing users wish they could do but can't?"
"If this was an app, what's the first screen?"
"Who would pay $100/month for this?"
"What would make someone tell their friends about this?"
"What existing product does this replace?"`;

// Question bank for different stages of ideation
export const OPENING_QUESTIONS = [
  "Who struggles with this problem the most?",
  "What's the current workaround people use?",
  "When does this problem hurt the most?",
  "What would solving this unlock for users?",
  "Who else has tried to solve this?",
];

export const DEEPENING_QUESTIONS = [
  "What's the simplest version of this idea?",
  "What feature would make this addictive?",
  "Who would use this daily vs. occasionally?",
  "What would make someone switch to this?",
  "What's the 'aha moment' for new users?",
];

export const EXPANSION_QUESTIONS = [
  "What adjacent problem could this also solve?",
  "How would this work for a different audience?",
  "What's the enterprise version of this?",
  "What's the consumer version of this?",
  "How would this look in 5 years?",
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
  allNotes: Array<{ text: string; image?: { caption?: string } }>,
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

  if (allNotes.length > 0) {
    context += `ALL ideas currently on the board (${allNotes.length} notes):\n`;
    allNotes.forEach((note, i) => {
      context += `${i + 1}. ${note.text}`;
      if (note.image?.caption) {
        context += ` [Image: ${note.image.caption}]`;
      }
      context += "\n";
    });
    context +=
      "\nIMPORTANT: Ask about angles, perspectives, or themes NOT already covered by these notes.\n\n";
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
