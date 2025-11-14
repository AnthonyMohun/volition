// Client-side AI communication utilities

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type MessageRole = 'system' | 'user' | 'assistant'

export interface AIResponse {
  choices: Array<{
    message: {
      role: string
      content: string
    }
  }>
}

export const SOCRATIC_SYSTEM_PROMPT = `You are a Socratic mentor for interaction design students. Your role is to guide students through the ideation process using open-ended questions without providing direct solutions.

Key principles:
1. Ask ONE focused question at a time
2. Never provide complete solutions or final concepts
3. Help students explore assumptions, constraints, and opportunities
4. Encourage reflection on user needs, context, and feasibility
5. Guide towards deeper thinking about their design choices
6. If students share concepts, ask probing questions to help them refine and evaluate
7. Be supportive and encouraging while challenging their thinking
8. Keep questions concise and clear (2-3 sentences max)

Remember: Your goal is to help students develop their own concepts through guided discovery, not to give them answers.`

export async function askAI(
  messages: Message[],
  temperature = 0.7,
  maxTokens = 500
): Promise<string> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get AI response')
    }

    const data: AIResponse = await response.json()
    
    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error('Invalid response format from AI')
    }

    return data.choices[0].message.content
  } catch (error) {
    console.error('AI request failed:', error)
    throw error
  }
}

export function buildConversationContext(
  hmwStatement: string,
  recentNotes: Array<{ text: string; image?: { caption?: string } }>,
  concepts: Array<{ title: string; description: string }>
): string {
  let context = `Project Context:\nHow Might We: ${hmwStatement}\n\n`
  
  if (recentNotes.length > 0) {
    context += `Recent student notes:\n`
    recentNotes.slice(-5).forEach((note, i) => {
      context += `${i + 1}. ${note.text}`
      if (note.image?.caption) {
        context += ` [Image: ${note.image.caption}]`
      }
      context += '\n'
    })
    context += '\n'
  }

  if (concepts.length > 0) {
    context += `Current concepts:\n`
    concepts.forEach((concept, i) => {
      context += `${i + 1}. ${concept.title}: ${concept.description}\n`
    })
  }

  return context
}
