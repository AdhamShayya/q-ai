/**
 * Input format for the main runAI function.
 * Supports handling either a chat workflow or a flashcards generation workflow.
 */
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
export interface LearningPersona {
  user_id: string
  learning_style: string
  problem_solving: string
  info_entry?: any
  logic_structure?: any
  abstraction_level?: any
  error_correction?: any
  output_preference?: any
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

// Environment variables configuration
const SUPABASE_URL = process.env.SUPABASE_URL || ""
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ""
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ""

/**
 * Fetches taking into consideration user's learning style preferences.
 * Connects to Supabase `learning_personas` table using REST.
 *
 * @param userId - ID of the user requesting AI generation
 * @returns User's persona, or null if it cannot be found or if there's an error
 */
async function getLearningPersona(userId: string): Promise<LearningPersona | null> {
  if (SUPABASE_URL == null || SUPABASE_SERVICE_KEY == null) {
    return null
  }
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
      console.error("Error fetching learning persona response:", await response.text())
      return null
    }
    const data = await response.json()
    return data != null && data.length > 0 ? data[0] : null
  } catch (err) {
    console.error("Error fetching learning persona:", err)
    return null // Return null gracefully on failure
  }
}

/**
 * Performs a vector search (or fallback fetch) to retrieve context chips relevant
 * to the user's message payload.
 *
 * @param userId - Requesting user ID
 * @param vaultId - Target vault to narrow document scope
 * @param message - User's chat message to use as the query trigger
 * @returns Array of most relevant document chunks (top 8)
 */
async function retrieveRelevantChunks(
  userId: string,
  vaultId: string,
  message: string,
): Promise<DocumentChunk[]> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return []

  try {
    // Attempting a mock vector search matching function deployed on Supabase.
    // 'match_document_chunks' represents an expected pgvector similarity trigger.
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

    // If RPC is missing, use a safe default fallback: simply query limits
    if (!response.ok) {
      const fallbackResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/document_chunks?user_id=eq.${userId}&vault_id=eq.${vaultId}&limit=8`,
        {
          headers: {
            apikey: SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
        },
      )
      if (fallbackResponse.ok === true) {
        return await fallbackResponse.json()
      }
      return []
    }

    return await response.json()
  } catch (err) {
    console.error("Error retrieving relevant chunks:", err)
    return []
  }
}

/**
 * Extracts and returns all context chunks stored in a given vault for Flashcard creation workflows.
 *
 * @param userId - Target user
 * @param vaultId - Target vault ID
 * @returns All chunks residing under the specific vault_id
 */
async function getAllVaultChunks(userId: string, vaultId: string): Promise<DocumentChunk[]> {
  if (SUPABASE_URL == null || SUPABASE_SERVICE_KEY == null) {
    return []
  }

  try {
    // Fetch all document records tied to the user and their designated vault namespace
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
    return await response.json()
  } catch (err) {
    console.error("Error getting all vault chunks:", err)
    return []
  }
}

/**
 * Retrieves the recent chat history for a specific conversation.
 *
 * @param conversationId - The active conversation ID
 * @returns Array of recent history messages
 */
async function getChatHistory(conversationId: string): Promise<ChatMessage[]> {
  if (SUPABASE_URL == null || SUPABASE_SERVICE_KEY == null || conversationId == null) {
    return []
  }
  try {
    // Fetch last 10 messages to keep the prompt context window manageable.
    // Order by created_at ascending to put older messages first.
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/messages?conversation_id=eq.${conversationId}&order=created_at.asc&limit=10`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      },
    )

    if (!response.ok) {
      return []
    }
    return await response.json()
  } catch (err) {
    console.error("Error fetching chat history:", err)
    return []
  }
}

/**
 * Compiles context, constraints, and the user's questions into a final prompt payload
 * intended for processing by Gemini strictly adhering to a pedagogical persona.
 *
 * @param persona - Fetched traits matching the user's learning preferences
 * @param chunks  - Matched RAG context injections
 * @param message - User's raw question
 * @param history - Past messages in the conversation
 * @returns Stringified structured prompt for sending to an LLM
 */
function buildChatPrompt(
  persona: LearningPersona | null,
  chunks: DocumentChunk[],
  message: string,
  history: ChatMessage[] = [],
): string {
  let prompt =
    "You are Q-Ai, an expert AI tutor specialized in helping students deeply understand their own study materials.\n\n"
  prompt += "You must prioritize the user's vault content as the primary source of truth.\n\n"

  // Conditionally apply AI personalization formatting
  if (persona) {
    prompt += "LEARNER PROFILE\n"
    prompt += "Adapt your teaching style to this learner profile:\n\n"

    if (persona.learning_style)
      prompt += `- Preferred explanation style: ${persona.learning_style}\n`
    if (persona.info_entry)
      prompt += `- Best information intake: ${persona.info_entry.answer || persona.info_entry}\n`
    if (persona.problem_solving)
      prompt += `- Preferred problem-solving approach: ${persona.problem_solving}\n`
    if (persona.error_correction)
      prompt += `- Preferred correction style: ${persona.error_correction.answer || persona.error_correction}\n`
    if (persona.logic_structure)
      prompt += `- Preferred logical structure: ${persona.logic_structure.answer || persona.logic_structure}\n`
    if (persona.abstraction_level)
      prompt += `- Preferred abstraction level: ${persona.abstraction_level.answer || persona.abstraction_level}\n`
    if (persona.output_preference) {
      const outcome = persona.output_preference.answer || persona.output_preference
      prompt += `- Desired outcome: Help the user ${typeof outcome === "string" ? outcome.toLowerCase() : JSON.stringify(outcome)}\n`
    }

    prompt += `\nTeaching behavior rules:
1. Match the learner's abstraction level.
2. Use examples in their preferred processing style.
3. Correct mistakes in the preferred correction style.
4. Prioritize clarity over jargon.
5. If the user is confused, simplify before adding depth.\n\n`
  }

  // Inject context logic
  prompt += "RETRIEVED CONTEXT\n"
  if (chunks.length === 0) {
    prompt += "(No specific context provided)\n"
  } else {
    chunks.forEach((chunk, i) => {
      prompt += `[Context ${i + 1}]: ${chunk.content}\n`
    })
  }

  if (history && history.length > 0) {
    prompt += "\nCONVERSATION HISTORY\n"
    history.forEach((msg) => {
      const roleName = msg.role === "assistant" ? "Q-Ai" : "User"
      prompt += `${roleName}: ${msg.content}\n\n`
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

/**
 * Produces a prompt uniquely designed for JSON-based bulk flashcard extraction
 * derived systematically from a comprehensive content injection.
 *
 * @param persona - User profile configurations shaping flashcard format density
 * @param chunks  - Target chunks encompassing the curriculum scope
 * @returns Prompt specifically constrained against hallucinating extraneous text
 */
/**
 * Strips internal document extraction markers and excess whitespace from a chunk.
 */
function cleanChunkContent(content: string): string {
  return content
    .replace(/\[EXTRACTED_TEXT\]/gi, "")
    .replace(/\[VISUAL_EXPLANATION\]/gi, "")
    .replace(/\*\*[^*]+:\*\*/g, "") // remove **Label:** tokens
    .replace(/\s{2,}/g, " ")
    .trim()
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

/**
 * Bridges Node backend processing and the Google Generative API (Gemini).
 *
 * @param prompt - Structurally finalized request string for LLM completion
 * @returns Raw generated string output from Google models
 */
async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing")
  }

  // Uses Gemini 1.5 Pro via standard REST structure
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7, // Balances structure vs logical coherence
    },
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (response.ok === false) {
    const errorText = await response.text()
    throw new Error(`Gemini API Error: ${errorText}`)
  }

  // Extract raw text value targeting standard candidate structures
  const data = await response.json()
  const text = data.candidates && data.candidates[0]?.content?.parts?.[0]?.text

  return text || ""
}

/**
 * Attempts to safely parse any JSON emitted by Gemini, accounting for common structural quirks
 * (e.g., surrounding output in triple tick markdown segments by accident).
 *
 * @param jsonString - Source generation to parse
 * @returns Successfully parsed strongly typed array/schema target OR null on exception
 */
function safeJsonParse<T>(jsonString: string): T | null {
  try {
    let cleanJson = jsonString.trim()

    // Discards bounding markdown code block indicators
    if (cleanJson.startsWith("```json")) cleanJson = cleanJson.slice(7)
    if (cleanJson.startsWith("```")) cleanJson = cleanJson.slice(3)
    if (cleanJson.endsWith("```")) cleanJson = cleanJson.slice(0, -3)
    cleanJson = cleanJson.trim()

    return JSON.parse(cleanJson) as T
  } catch (error) {
    console.error("Failed to parse JSON:", error)
    return null
  }
}

/**
 * Main module entry point facilitating the standalone routing for the AI engine module.
 *
 * @param input - Defines desired AI action type + contextual parameter mappings
 * @returns Either an interactive conversational payload OR an array of structured JSON flashcards
 */
export async function runAI(input: RunAIInput): Promise<ChatResponse | Flashcard[]> {
  const { type, userId, vaultId, message = "", conversationId } = input
  console.log("runAI called with input:", input)
  // Initialize personalized context if defined on user scope
  const persona = await getLearningPersona(userId)

  // Chat/QA Interaction Mode Engine Process Path
  if (type === "chat") {
    // 0. Retrieve conversation history if available
    const history = conversationId ? await getChatHistory(conversationId) : []

    // 1. Gather relevant subsets via semantic distance estimation matching user query
    const chunks = await retrieveRelevantChunks(userId, vaultId, message)

    // 2. Synthesize payload instructions
    const prompt = buildChatPrompt(persona, chunks, message, history)

    // 3. Obtain LLM interpretation
    const geminiResponse = await callGemini(prompt)

    return {
      answer: geminiResponse,
      contextUsed: chunks.length,
    }
  }

  // Vault Flashcard Generation Boilerplate Pipeline
  if (type === "flashcards") {
    // 1. Force fetch all document chunks regardless of limits
    const allChunks = await getAllVaultChunks(userId, vaultId)

    if (allChunks.length === 0) {
      return [] // Return early if no relevant training material is uploaded
    }

    // 2. Build extraction command logic
    const prompt = buildFlashcardsPrompt(persona, allChunks)

    // 3. Initiate processing logic returning stringified JSON
    const geminiResponse = await callGemini(prompt)

    // 4. Parse, filter out any bad cards, and return
    const parsed = safeJsonParse<Flashcard[]>(geminiResponse)
    if (!parsed) return []

    const badAnswerPattern = /open[- ]ended|review your understanding|see above|n\/a/i
    return parsed.filter(
      (c) =>
        c.question?.trim().length > 0 &&
        c.answer?.trim().length > 0 &&
        !badAnswerPattern.test(c.answer),
    )
  }

  throw new Error("Invalid runAI type specified")
}
