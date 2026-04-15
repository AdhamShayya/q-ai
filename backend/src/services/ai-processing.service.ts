/**
 * ai-processing.service.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Gemini-powered AI analysis for different file types.
 * Replicates the exact prompts specified in the n8n workflow:
 *
 *   IMAGE  → extract text + explain visuals
 *   DOCUMENT → extract text + explain tables/diagrams
 *   VIDEO  → summary + key concepts + study notes
 *   TEXT   → extract structured text content
 *
 * Uses the same Gemini REST pattern as backend/src/ai.ts.
 */

import type {
  ImageAnalysisResult,
  DocumentAnalysisResult,
  VideoAnalysisResult,
  TextExtractionResult,
  AIProcessingResult,
  FileCategory,
} from "../types/ingestion.types";
import type { FileDownloadResult } from "./file.service";

// ── Environment ───────────────────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// ── Gemini API Endpoints ──────────────────────────────────────────────────────

const GEMINI_GENERATE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";
const GEMINI_FILE_UPLOAD_URL =
  "https://generativelanguage.googleapis.com/upload/v1beta/files";

// ── Prompt Templates ──────────────────────────────────────────────────────────

const IMAGE_PROMPT = `You are an advanced document analysis AI. Analyze this image thoroughly.

TASK 1 — TEXT EXTRACTION:
Extract ALL text visible in the image. Preserve formatting, headings, bullet points, and any structured content exactly as shown.

TASK 2 — VISUAL EXPLANATION:
Describe and explain all visual elements including:
- Diagrams, charts, or graphs (explain what they represent)
- Tables (extract data and explain relationships)
- Illustrations or figures (describe content and educational significance)
- Handwritten notes (transcribe and clarify)
- Mathematical formulas or equations (transcribe in readable format)

OUTPUT FORMAT:
=== EXTRACTED TEXT ===
[extracted text here]

=== VISUAL EXPLANATION ===
[visual explanation here]`;

const DOCUMENT_PROMPT = `You are an advanced document analysis AI. Analyze this document thoroughly.

TASK 1 — TEXT EXTRACTION:
Extract ALL text content from the document. Preserve:
- Headings and subheadings hierarchy
- Paragraph structure
- Bullet points and numbered lists
- Footnotes and references
- Headers and footers

TASK 2 — TABLES & DIAGRAMS EXPLANATION:
For every table, diagram, chart, or visual element:
- Recreate tables in a readable text format
- Explain what each diagram or chart represents
- Describe relationships shown in visual elements
- Note any formulas, equations, or special notation

OUTPUT FORMAT:
=== EXTRACTED TEXT ===
[extracted text here]

=== TABLES & DIAGRAMS ===
[tables and diagrams explanation here]`;

const VIDEO_PROMPT = `You are an advanced educational content analysis AI. Analyze this video thoroughly.

TASK 1 — SUMMARY:
Provide a comprehensive summary of the video content. Cover all major topics discussed, demonstrated, or shown.

TASK 2 — KEY CONCEPTS:
List every key concept, term, definition, or important idea presented in the video. Format as a clear bulleted list.

TASK 3 — STUDY NOTES:
Create detailed, well-structured study notes from the video content that a student could use for revision. Include:
- Main topics with explanations
- Important definitions
- Examples mentioned
- Any formulas or rules stated
- Connections between concepts

OUTPUT FORMAT:
=== SUMMARY ===
[comprehensive summary here]

=== KEY CONCEPTS ===
[bulleted list of key concepts here]

=== STUDY NOTES ===
[detailed study notes here]`;

const TEXT_EXTRACTION_PROMPT = `You are an advanced document analysis AI. Extract all text content from this document.

Preserve the complete structure including:
- All headings and subheadings
- Paragraph text
- Bullet points and numbered lists
- Table data (convert to readable text format)
- Any special formatting or emphasis

OUTPUT FORMAT:
=== EXTRACTED TEXT ===
[complete extracted text here]`;

// ── Internal Helpers ──────────────────────────────────────────────────────────

/**
 * Calls the Gemini generateContent API with text-only payload.
 */
async function callGeminiText(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("[AIProcessing] GEMINI_API_KEY is not configured");
  }

  const url = `${GEMINI_GENERATE_URL}?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3 }, // Lower temp for extraction accuracy
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[AIProcessing] Gemini API error: ${errorText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

/**
 * Calls the Gemini generateContent API with multimodal payload (text + inline file).
 * Used for images and PDFs that can be sent as base64 inline_data.
 */
async function callGeminiMultimodal(
  prompt: string,
  base64Data: string,
  mimeType: string
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("[AIProcessing] GEMINI_API_KEY is not configured");
  }

  const url = `${GEMINI_GENERATE_URL}?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: { temperature: 0.3 },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[AIProcessing] Gemini multimodal API error: ${errorText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

/**
 * Uploads a file to the Gemini File API for video processing.
 * Returns the file URI used in subsequent generateContent calls.
 */
async function uploadToGeminiFileAPI(
  buffer: Buffer,
  mimeType: string,
  displayName: string
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("[AIProcessing] GEMINI_API_KEY is not configured");
  }

  // Step 1: Initiate resumable upload
  const initiateUrl = `${GEMINI_FILE_UPLOAD_URL}?key=${GEMINI_API_KEY}`;
  const initiateResponse = await fetch(initiateUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(buffer.length),
      "X-Goog-Upload-Header-Content-Type": mimeType,
    },
    body: JSON.stringify({
      file: { display_name: displayName },
    }),
  });

  if (!initiateResponse.ok) {
    const errorText = await initiateResponse.text();
    throw new Error(
      `[AIProcessing] Gemini File API initiation failed: ${errorText}`
    );
  }

  const uploadUrl = initiateResponse.headers.get("x-goog-upload-url");
  if (!uploadUrl) {
    throw new Error(
      "[AIProcessing] Gemini File API did not return an upload URL"
    );
  }

  // Step 2: Upload the file bytes
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Length": String(buffer.length),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: new Uint8Array(buffer),
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(
      `[AIProcessing] Gemini File API upload failed: ${errorText}`
    );
  }

  const fileData = await uploadResponse.json();
  const fileUri = fileData.file?.uri;

  if (!fileUri) {
    throw new Error(
      "[AIProcessing] Gemini File API did not return a file URI"
    );
  }

  // Step 3: Poll until the file is ACTIVE (video processing takes time)
  const fileName = fileData.file?.name;
  if (fileName) {
    await waitForFileProcessing(fileName);
  }

  return fileUri;
}

/**
 * Polls the Gemini File API until the uploaded file status is ACTIVE.
 * Videos need processing time before they can be used in generateContent.
 */
async function waitForFileProcessing(
  fileName: string,
  maxWaitMs: number = 120_000
): Promise<void> {
  const checkUrl = `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${GEMINI_API_KEY}`;
  const startTime = Date.now();
  const pollIntervalMs = 3_000;

  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(checkUrl);
    if (response.ok) {
      const data = await response.json();
      if (data.state === "ACTIVE") return;
      if (data.state === "FAILED") {
        throw new Error(
          `[AIProcessing] Gemini file processing failed for ${fileName}`
        );
      }
    }
    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(
    `[AIProcessing] Gemini file processing timed out for ${fileName}`
  );
}

/**
 * Calls Gemini generateContent with a file URI reference (for videos).
 */
async function callGeminiWithFileUri(
  prompt: string,
  fileUri: string,
  mimeType: string
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("[AIProcessing] GEMINI_API_KEY is not configured");
  }

  const url = `${GEMINI_GENERATE_URL}?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              file_data: {
                mime_type: mimeType,
                file_uri: fileUri,
              },
            },
          ],
        },
      ],
      generationConfig: { temperature: 0.3 },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `[AIProcessing] Gemini file URI API error: ${errorText}`
    );
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// ── Section Parsers ───────────────────────────────────────────────────────────

/**
 * Parses a section from the AI response by its header marker.
 */
function parseSection(response: string, sectionHeader: string): string {
  const headerIndex = response.indexOf(sectionHeader);
  if (headerIndex === -1) return "";

  const contentStart = headerIndex + sectionHeader.length;

  // Find the next section header (=== ... ===) or end of string
  const nextSectionMatch = response
    .slice(contentStart)
    .match(/\n===\s+[A-Z]/);
  const contentEnd = nextSectionMatch
    ? contentStart + (nextSectionMatch.index ?? response.length)
    : response.length;

  return response.slice(contentStart, contentEnd).trim();
}

/**
 * Parses the KEY CONCEPTS section into an array of strings.
 */
function parseKeyConcepts(response: string): string[] {
  const section = parseSection(response, "=== KEY CONCEPTS ===");
  if (!section) return [];

  return section
    .split("\n")
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter((line) => line.length > 0);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Analyzes an image file using Gemini Vision.
 * Extracts text and explains visual elements.
 *
 * @param file - Downloaded file result with base64 data
 * @returns Structured image analysis result
 */
export async function analyzeImage(
  file: FileDownloadResult
): Promise<ImageAnalysisResult> {
  console.log(`[AIProcessing] Analyzing image: ${file.filename}`);

  const rawContent = await callGeminiMultimodal(
    IMAGE_PROMPT,
    file.base64,
    file.mimeType
  );

  return {
    extractedText: parseSection(rawContent, "=== EXTRACTED TEXT ==="),
    visualExplanation: parseSection(rawContent, "=== VISUAL EXPLANATION ==="),
    rawContent,
  };
}

/**
 * Analyzes a PDF document using Gemini.
 * Extracts text and explains tables/diagrams.
 *
 * @param file - Downloaded file result with base64 data
 * @returns Structured document analysis result
 */
export async function analyzeDocument(
  file: FileDownloadResult
): Promise<DocumentAnalysisResult> {
  console.log(`[AIProcessing] Analyzing document: ${file.filename}`);

  const rawContent = await callGeminiMultimodal(
    DOCUMENT_PROMPT,
    file.base64,
    file.mimeType
  );

  return {
    extractedText: parseSection(rawContent, "=== EXTRACTED TEXT ==="),
    tablesDiagramsExplanation: parseSection(
      rawContent,
      "=== TABLES & DIAGRAMS ==="
    ),
    rawContent,
  };
}

/**
 * Analyzes a video file using the Gemini File API.
 * Produces summary, key concepts, and study notes.
 *
 * @param file - Downloaded file result with buffer data
 * @returns Structured video analysis result
 */
export async function analyzeVideo(
  file: FileDownloadResult
): Promise<VideoAnalysisResult> {
  console.log(`[AIProcessing] Analyzing video: ${file.filename}`);

  // Upload video to Gemini File API (videos are too large for inline_data)
  const fileUri = await uploadToGeminiFileAPI(
    file.buffer,
    file.mimeType,
    file.filename
  );

  const rawContent = await callGeminiWithFileUri(
    VIDEO_PROMPT,
    fileUri,
    file.mimeType
  );

  return {
    summary: parseSection(rawContent, "=== SUMMARY ==="),
    keyConcepts: parseKeyConcepts(rawContent),
    studyNotes: parseSection(rawContent, "=== STUDY NOTES ==="),
    rawContent,
  };
}

/**
 * Extracts text content from DOCX/XLSX files using Gemini.
 * Falls back to treating binary content as a document for analysis.
 *
 * @param file - Downloaded file result
 * @returns Structured text extraction result
 */
export async function extractText(
  file: FileDownloadResult
): Promise<TextExtractionResult> {
  console.log(`[AIProcessing] Extracting text from: ${file.filename}`);

  const rawContent = await callGeminiMultimodal(
    TEXT_EXTRACTION_PROMPT,
    file.base64,
    file.mimeType
  );

  return {
    extractedText: parseSection(rawContent, "=== EXTRACTED TEXT ==="),
    rawContent,
  };
}

/**
 * Routes a file to the appropriate AI analysis function based on its category.
 *
 * @param file - Downloaded file with resolved category
 * @returns The structured AI processing result
 */
export async function processFile(
  file: FileDownloadResult
): Promise<AIProcessingResult> {
  switch (file.category) {
    case "image":
      return analyzeImage(file);
    case "document":
      return analyzeDocument(file);
    case "video":
      return analyzeVideo(file);
    case "text":
      return extractText(file);
    default:
      throw new Error(
        `[AIProcessing] Unsupported file category: ${file.category}`
      );
  }
}
