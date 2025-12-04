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

// HMW Builder Socratic prompts - guides students through crafting their challenge
export const HMW_BUILDER_SYSTEM_PROMPT = `You are a friendly design coach helping a student craft their "How Might We" challenge statement.

CRITICAL RULES:
- Ask ONE question at a time
- Keep questions under 15 words
- NEVER assume or add information the student hasn't provided
- ONLY reference what they explicitly told you
- Ask open, neutral questions - don't lead them toward specific answers
- Don't fill in blanks or guess context

Your goal is to help them define:
1. WHO has the problem (target user)
2. WHAT the problem or need is (in their words)
3. WHERE/WHEN it happens (context)`;

// Refine page Socratic prompts - helps scaffold concept descriptions
export const REFINE_SCAFFOLD_SYSTEM_PROMPT = `You are a friendly design coach helping a student describe their concept clearly.

RULES:
- Ask ONE focused question at a time
- Keep questions under 15 words
- Reference their specific idea
- Help them think concretely about their concept
- Be encouraging and build on what they've already said

Help them articulate:
- What the concept does (core functionality)
- Who benefits and how
- What makes it unique or valuable`;

// Select page guidance prompts - helps students make informed choices
export const SELECT_GUIDANCE_SYSTEM_PROMPT = `You are a friendly design coach helping a student choose which concepts to develop further.

RULES:
- Give brief, helpful guidance (under 30 words)
- Reference their specific concepts
- Highlight interesting trade-offs
- Be encouraging about all options
- Don't make the decision for them`;

// Generate a draft description from conversation answers
export const GENERATE_DESCRIPTION_PROMPT = `Based on the student's answers, write a clear 2-3 sentence concept description. Be concise and capture the essence of their idea. Write in a neutral, descriptive tone. Only output the description, nothing else.`;

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

// HMW Builder AI functions
export async function askHMWBuilderQuestion(
  previousAnswers: { question: string; answer: string }[],
  currentStep: "who" | "what" | "context"
): Promise<string> {
  const stepPrompts = {
    who: "Ask who they are designing for. Simple, open question. Under 10 words. Don't assume anything.",
    what: "Ask what problem or challenge this person faces. Use ONLY the exact words they gave you. Don't add context like 'studying' or 'at work' unless they said it. Under 15 words.",
    context:
      "Ask when or where this problem is most difficult. Use only their exact words. Don't assume situations. Under 15 words.",
  };

  const conversationHistory = previousAnswers
    .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)
    .join("\n\n");

  try {
    const response = await askAI(
      [
        { role: "system", content: HMW_BUILDER_SYSTEM_PROMPT },
        {
          role: "user",
          content: conversationHistory
            ? `Previous conversation:\n${conversationHistory}\n\n${stepPrompts[currentStep]}`
            : stepPrompts[currentStep],
        },
      ],
      0.7,
      100
    );
    return response.trim();
  } catch (error) {
    console.error("HMW builder question failed:", error);
    // Fallback questions - neutral and non-leading
    const fallbacks = {
      who: "Who are you designing for?",
      what: "What challenge do they face?",
      context: "When or where does this happen?",
    };
    return fallbacks[currentStep];
  }
}

export async function generateHMWStatement(
  answers: { question: string; answer: string }[]
): Promise<string> {
  const conversationHistory = answers
    .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)
    .join("\n\n");

  try {
    const response = await askAI(
      [
        {
          role: "system",
          content:
            "You craft clear 'How Might We' statements for design challenges. Output only the HMW statement, nothing else. Keep it under 20 words.",
        },
        {
          role: "user",
          content: `Based on this conversation, generate a clear HMW statement:\n\n${conversationHistory}`,
        },
      ],
      0.5,
      80
    );
    return response.trim();
  } catch (error) {
    console.error("HMW generation failed:", error);
    return "";
  }
}

// Refine page AI functions
export async function askRefineQuestion(
  conceptTitle: string,
  conceptText: string,
  previousAnswers: { question: string; answer: string }[],
  questionIndex: number
): Promise<string> {
  const questionFocus = [
    "Ask what this concept does in simple terms. One question, under 15 words.",
    "Ask who would use this and why they'd care. One question, under 15 words.",
    "Ask what makes this different or special. One question, under 15 words.",
  ];

  const conversationHistory = previousAnswers
    .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)
    .join("\n\n");

  try {
    const response = await askAI(
      [
        { role: "system", content: REFINE_SCAFFOLD_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Concept: "${conceptTitle}"\nOriginal note: "${conceptText}"\n\n${
            conversationHistory
              ? `Previous answers:\n${conversationHistory}\n\n`
              : ""
          }${questionFocus[Math.min(questionIndex, questionFocus.length - 1)]}`,
        },
      ],
      0.7,
      100
    );
    return response.trim();
  } catch (error) {
    console.error("Refine question failed:", error);
    const fallbacks = [
      "What does this concept actually do?",
      "Who would benefit from this?",
      "What makes this unique?",
    ];
    return fallbacks[Math.min(questionIndex, fallbacks.length - 1)];
  }
}

export async function generateConceptDescription(
  conceptTitle: string,
  originalNote: string,
  answers: { question: string; answer: string }[]
): Promise<string> {
  const conversationHistory = answers
    .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)
    .join("\n\n");

  try {
    const response = await askAI(
      [
        { role: "system", content: GENERATE_DESCRIPTION_PROMPT },
        {
          role: "user",
          content: `Concept: "${conceptTitle}"\nOriginal idea: "${originalNote}"\n\nStudent's answers:\n${conversationHistory}`,
        },
      ],
      0.5,
      200
    );
    return response.trim();
  } catch (error) {
    console.error("Description generation failed:", error);
    return "";
  }
}

// Refine page AI function - suggest concept extras
export async function suggestConceptExtras(
  conceptTitle: string,
  conceptDescription: string,
  hmwStatement: string
): Promise<{
  targetAudience: string;
  platforms: string[];
  keyBenefits: string;
  mainFeatures: string;
}> {
  try {
    const response = await askAI(
      [
        {
          role: "system",
          content: `You suggest practical details for design concepts. Output ONLY valid JSON with these exact keys: targetAudience (string), platforms (array of strings from: "Virtual Reality", "Mobile", "Tablet", "Web", "Desktop"), keyBenefits (string), mainFeatures (string). Keep each field concise (under 30 words).`,
        },
        {
          role: "user",
          content: `Challenge: ${hmwStatement}\n\nConcept: "${conceptTitle}"\nDescription: ${conceptDescription}\n\nSuggest target audience, platforms, key benefits, and main features for this concept.`,
        },
      ],
      0.6,
      250
    );

    // Parse JSON response
    const cleaned = response.trim().replace(/```json|```/g, "");
    const parsed = JSON.parse(cleaned);
    return {
      targetAudience: parsed.targetAudience || "",
      platforms: Array.isArray(parsed.platforms) ? parsed.platforms : [],
      keyBenefits: parsed.keyBenefits || "",
      mainFeatures: parsed.mainFeatures || "",
    };
  } catch (error) {
    console.error("Suggest extras failed:", error);
    return {
      targetAudience: "",
      platforms: [],
      keyBenefits: "",
      mainFeatures: "",
    };
  }
}

// Select page AI functions
export async function getSelectionGuidance(
  hmwStatement: string,
  concepts: Array<{ title: string; text: string; details?: string }>,
  selectedCount: number
): Promise<string> {
  const conceptList = concepts
    .map(
      (c, i) =>
        `${i + 1}. ${c.title}: ${c.text}${
          c.details ? ` (${c.details.slice(0, 50)}...)` : ""
        }`
    )
    .join("\n");

  try {
    const response = await askAI(
      [
        { role: "system", content: SELECT_GUIDANCE_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Challenge: ${hmwStatement}\n\nConcepts to choose from:\n${conceptList}\n\nThey've selected ${selectedCount} so far. Give a brief tip to help them decide (under 30 words).`,
        },
      ],
      0.7,
      80
    );
    return response.trim();
  } catch (error) {
    console.error("Selection guidance failed:", error);
    return "Consider which concept you're most excited to develop further.";
  }
}

// Canvas AI functions - expand note ideas
export const EXPAND_NOTE_SYSTEM_PROMPT = `You are a design coach helping expand a quick note into richer content.

RULES:
- Build directly on what the student wrote
- Add 2-3 specific details or angles they might not have considered
- Keep it brief - under 50 words total
- Write in their voice, as if you're adding to their note
- Don't add questions, just expand the idea`;

export async function expandNoteIdea(
  noteText: string,
  hmwStatement: string
): Promise<string> {
  try {
    const response = await askAI(
      [
        { role: "system", content: EXPAND_NOTE_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Challenge: ${hmwStatement}\n\nTheir note: "${noteText}"\n\nExpand this idea with 2-3 specific details (under 50 words, write as if adding to their note):`,
        },
      ],
      0.7,
      100
    );
    return response.trim();
  } catch (error) {
    console.error("Note expansion failed:", error);
    return "";
  }
}

// Canvas AI - analyze what's missing from the ideation session
export const GAP_ANALYSIS_SYSTEM_PROMPT = `You are a design coach reviewing a student's ideation notes.

RULES:
- Identify ONE specific gap or angle they haven't explored
- Be encouraging and specific
- Keep it under 25 words
- Frame it as an opportunity, not criticism`;

export async function analyzeIdeationGaps(
  hmwStatement: string,
  notes: string[]
): Promise<string> {
  const notesList = notes.map((n, i) => `${i + 1}. ${n}`).join("\n");

  try {
    const response = await askAI(
      [
        { role: "system", content: GAP_ANALYSIS_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Challenge: ${hmwStatement}\n\nTheir notes so far:\n${notesList}\n\nWhat's ONE angle they haven't explored yet? (under 25 words):`,
        },
      ],
      0.7,
      60
    );
    return response.trim();
  } catch (error) {
    console.error("Gap analysis failed:", error);
    return "Try thinking about this problem from a completely different perspective.";
  }
}
