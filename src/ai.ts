import { env } from "./config/config"

// ── Types ────────────────────────────────────────────────────────────────────
export interface RunAIInput {
  type: "chat" | "flashcards"
  userId: string
  vaultId: string
  message?: string // Only required for the "chat" type
  conversationId?: string // Optional: used to fetch chat history
}

/**
 * Represents the user's stored learning profile.
 * Used to personalize the Gemini prompt to match the user's learning style.
 */
/** A persona field can be a plain string or an object with an `answer` key (as stored from questionnaire JSON). */
type PersonaField = string | { answer?: string }

export interface LearningPersona {
  user_id: string
  learning_style: string
  problem_solving: string
  info_entry?: PersonaField
  logic_structure?: PersonaField
  abstraction_level?: PersonaField
  error_correction?: PersonaField
  output_preference?: PersonaField
}

/**
 * Represents a snippet of extracted document text.
 * Associated with a specific vault and user.
 */
export interface DocumentChunk {
  content: string
  embedding?: number[]
  user_id: string
  vault_id: string
}

/**
 * Structure of a single generated flashcard.
 */
export interface Flashcard {
  question: string
  answer: string
  hint: string
}

/**
 * The standard response generated from a "chat" AI operation.
 */
export interface ChatResponse {
  answer: string
  contextUsed: number // Indicates how many chunks were injected into the prompt
}

/**
 * Represents a historical message from the database.
 */
export interface ChatMessage {
  id: string
  conversation_id: string
  role: "user" | "assistant"
  content: string
  created_at: string
  user_id: string
  vault_id: string
}

interface GeminiContent {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
}

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL = env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

// ── Type Guards ───────────────────────────────────────────────────────────────

function isLearningPersona(value: unknown): value is LearningPersona {
  return (
    typeof value === "object" &&
    value !== null &&
    "user_id" in value &&
    "learning_style" in value &&
    "problem_solving" in value
  )
}

function isDocumentChunk(value: unknown): value is DocumentChunk {
  return typeof value === "object" && value !== null && "content" in value
}

function isChatMessage(value: unknown): value is ChatMessage {
  return typeof value === "object" && value !== null && "role" in value && "content" in value
}

function isFlashcard(value: unknown): value is Flashcard {
  return (
    typeof value === "object" &&
    value !== null &&
    "question" in value &&
    "answer" in value &&
    "hint" in value
  )
}

// ── Data Fetching ─────────────────────────────────────────────────────────────

async function getLearningPersona(userId: string): Promise<LearningPersona | null> {
  try {
    // Fetch the persona matching the given user
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/learning_personas?user_id=eq.${userId}&select=*`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      },
    )

    if (response.ok === false) {
      console.error("Error fetching learning persona:", await response.text())
      return null
    }

    const data = (await response.json()) as LearningPersona[]
    if (Array.isArray(data) === false || data.length === 0) {
      return null
    }
    return isLearningPersona(data[0]) ? data[0] : null
  } catch (err) {
    console.error("Error fetching learning persona:", err)
    return null
  }
}

async function retrieveRelevantChunks(
  userId: string,
  vaultId: string,
  message: string,
): Promise<DocumentChunk[]> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_document_chunks`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query_text: message,
        match_count: 8,
        p_user_id: userId,
        p_vault_id: vaultId,
      }),
    })

    if (response.ok === false) {
      const fallback = await fetch(
        `${SUPABASE_URL}/rest/v1/document_chunks?user_id=eq.${userId}&vault_id=eq.${vaultId}&limit=8`,
        {
          headers: {
            apikey: SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
        },
      )
      if (fallback.ok === true) {
        const data = (await fallback.json()) as DocumentChunk[]
        return Array.isArray(data) ? data.filter(isDocumentChunk) : []
      }
      return []
    }

    const data = (await response.json()) as DocumentChunk[]
    return Array.isArray(data) ? data.filter(isDocumentChunk) : []
  } catch (err) {
    console.error("Error retrieving relevant chunks:", err)
    return []
  }
}

async function getAllVaultChunks(userId: string, vaultId: string): Promise<DocumentChunk[]> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/document_chunks?user_id=eq.${userId}&vault_id=eq.${vaultId}`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      },
    )

    if (response.ok === false) {
      return []
    }
    const data = (await response.json()) as DocumentChunk[]
    return Array.isArray(data) ? data.filter(isDocumentChunk) : []
  } catch (err) {
    console.error("Error getting all vault chunks:", err)
    return []
  }
}

async function getChatHistory(conversationId: string): Promise<ChatMessage[]> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/messages?conversation_id=eq.${conversationId}&order=created_at.asc&limit=10`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      },
    )

    if (response.ok === false) {
      return []
    }
    const data = (await response.json()) as ChatMessage[]
    return Array.isArray(data) ? data.filter(isChatMessage) : []
  } catch (err) {
    console.error("Error fetching chat history:", err)
    return []
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveField(field: PersonaField | undefined): string | undefined {
  if (field == null) return undefined
  if (typeof field === "string") return field
  return field.answer ?? undefined
}

function cleanChunkContent(content: string): string {
  return content
    .replace(/\[EXTRACTED_TEXT\]/gi, "")
    .replace(/\[VISUAL_EXPLANATION\]/gi, "")
    .replace(/\*\*[^*]+:\*\*/g, "")
    .replace(/\s{2,}/g, " ")
    .trim()
}

function safeJsonParse(jsonString: string): Flashcard[] | null {
  try {
    let clean = jsonString.trim()
    if (clean.startsWith("```json")) clean = clean.slice(7)
    if (clean.startsWith("```")) clean = clean.slice(3)
    if (clean.endsWith("```")) clean = clean.slice(0, -3)
    const parsed = JSON.parse(clean.trim())
    return Array.isArray(parsed) ? (parsed as Flashcard[]) : null
  } catch {
    return null
  }
}

// ── Prompt Builders ───────────────────────────────────────────────────────────

function buildChatPrompt(
  persona: LearningPersona | null,
  chunks: DocumentChunk[],
  message: string,
  history: ChatMessage[] = [],
): string {
  let prompt =
    "You are Q-Ai, an expert AI tutor specialized in helping students deeply understand their own study materials.\n\n"
  prompt += "You must prioritize the user's vault content as the primary source of truth.\n\n"

  if (persona != null) {
    prompt += "LEARNER PROFILE\n"
    prompt += "Adapt your teaching style to this learner profile:\n\n"

    if (persona.learning_style != null) {
      prompt += `- Preferred explanation style: ${persona.learning_style}\n`
    }
    const infoEntry = resolveField(persona.info_entry)
    if (infoEntry != null) {
      prompt += `- Best information intake: ${infoEntry}\n`
    }
    if (persona.problem_solving != null) {
      prompt += `- Preferred problem-solving approach: ${persona.problem_solving}\n`
    }
    const errorCorrection = resolveField(persona.error_correction)
    if (errorCorrection != null) {
      prompt += `- Preferred correction style: ${errorCorrection}\n`
    }
    const logicStructure = resolveField(persona.logic_structure)
    if (logicStructure != null) {
      prompt += `- Preferred logical structure: ${logicStructure}\n`
    }
    const abstractionLevel = resolveField(persona.abstraction_level)
    if (abstractionLevel != null) {
      prompt += `- Preferred abstraction level: ${abstractionLevel}\n`
    }
    const outputPref = resolveField(persona.output_preference)
    if (outputPref != null) {
      prompt += `- Desired outcome: Help the user ${outputPref.toLowerCase()}\n`
    }

    prompt += `\nTeaching behavior rules:
1. Match the learner's abstraction level.
2. Use examples in their preferred processing style.
3. Correct mistakes in the preferred correction style.
4. Prioritize clarity over jargon.
5. If the user is confused, simplify before adding depth.\n\n`
  }

  prompt += "RETRIEVED CONTEXT\n"
  if (chunks.length === 0) {
    prompt += "(No specific context provided)\n"
  } else {
    chunks.forEach((chunk, i) => {
      prompt += `[Context ${i + 1}]: ${chunk.content}\n`
    })
  }

  if (history.length > 0) {
    prompt += "\nCONVERSATION HISTORY\n"
    history.forEach((msg) => {
      prompt += `${msg.role === "assistant" ? "Q-Ai" : "User"}: ${msg.content}\n\n`
    })
  }

  prompt += `\nUSER QUESTION\n${message}\n\n`
  prompt += `RULES
1. Base your answer primarily on the retrieved context.
2. If the vault context is incomplete, explicitly say:
   "I couldn't find this specific information in your vault. Based on general knowledge..."
3. Explain step-by-step.
4. Use examples when helpful.
5. If relevant, break the explanation into:
   - Concept
   - Why it matters
   - Example
   - Common mistake
6. Never invent that something exists in the vault if it does not.
7. If the user asks for memorization help, provide a simpler study version at the end.
8. If formulas or definitions appear in context, preserve them accurately.`

  return prompt
}

function buildFlashcardsPrompt(persona: LearningPersona | null, chunks: DocumentChunk[]): string {
  let prompt =
    "You are an expert educator creating high-quality study flashcards from student material.\n\n"

  if (persona) {
    prompt += `Tailor the difficulty and explanation style to a learner who prefers: ${persona.learning_style} explanations and ${persona.problem_solving} problem-solving.\n\n`
  }

  const cleanedChunks = chunks.map((c) => cleanChunkContent(c.content)).filter((c) => c.length > 40) // skip near-empty chunks

  prompt += "STUDY MATERIAL:\n"
  cleanedChunks.forEach((content, i) => {
    prompt += `[${i + 1}]: ${content}\n`
  })

  prompt += `
STRICT RULES — follow every rule or the output is invalid:
1. Output ONLY a valid JSON array. No markdown, no code fences, no prose.
2. Each card must have a clear, specific QUESTION with a definitive ANSWER.
3. Questions must test a single concrete fact, concept, definition, or process.
4. NEVER ask the user to "summarise", "describe in your own words", or "explain" — those are open-ended and forbidden.
5. NEVER write an answer like "(Open-ended — review your understanding)" or any placeholder — every answer must contain real information.
6. The "hint" field must be a short memory cue (≤15 words) — NOT a copy of the raw source text.
7. Skip any chunk that does not contain clear factual content (e.g., cover pages, image captions only).
8. Aim for 10–20 cards covering the most important concepts.

Format:
[
  { "question": "...", "answer": "...", "hint": "..." }
]`

  return prompt
}

// ── Gemini ────────────────────────────────────────────────────────────────────

async function callGemini(prompt: string): Promise<string> {
  if (GEMINI_API_KEY == null) {
    throw new Error("GEMINI_API_KEY is missing")
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7 },
    }),
  })

  if (response.ok === false) {
    throw new Error(`Gemini API Error: ${await response.text()}`)
  }

  const data = (await response.json()) as GeminiContent
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
}

// ── Entry Point ───────────────────────────────────────────────────────────────

export async function runAI(input: RunAIInput): Promise<ChatResponse | Flashcard[]> {
  const { type, userId, vaultId, message = "", conversationId } = input
  console.log("runAI called with input:", input)
  const persona = await getLearningPersona(userId)

  if (type === "chat") {
    const history = conversationId ? await getChatHistory(conversationId) : []
    const chunks = await retrieveRelevantChunks(userId, vaultId, message)
    const prompt = buildChatPrompt(persona, chunks, message, history)
    const answer = await callGemini(prompt)
    return { answer, contextUsed: chunks.length }
  }

  if (type === "flashcards") {
    const allChunks = await getAllVaultChunks(userId, vaultId)
    if (allChunks.length === 0) {
      return []
    }

    const prompt = buildFlashcardsPrompt(persona, allChunks)
    const geminiResponse = await callGemini(prompt)
    const cards = safeJsonParse(geminiResponse)
    if (cards == null) {
      return []
    }

    const badAnswerPattern = /open[- ]ended|review your understanding|see above|n\/a/i
    return cards
      .filter(isFlashcard)
      .filter(
        (c) =>
          c.question.trim().length > 0 &&
          c.answer.trim().length > 0 &&
          !badAnswerPattern.test(c.answer),
      )
  }

  throw new Error("Invalid runAI type specified")
}
