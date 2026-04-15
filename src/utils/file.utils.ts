/**
 * file.utils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Utility functions for file type detection, extension parsing, and
 * MIME-type classification. Consumed by both the tRPC API layer (src/)
 * and the backend AI engine layer (backend/src/).
 */

// ── Extension Maps ────────────────────────────────────────────────────────────

/** Image extensions that Gemini Vision can process. */
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);

/** Video extensions routed to the Gemini video analysis path. */
const VIDEO_EXTENSIONS = new Set(["mp4"]);

/** Document extensions routed to PDF-style analysis. */
const DOCUMENT_EXTENSIONS = new Set(["pdf"]);

/** Text-extraction extensions that need content parsing before AI analysis. */
const TEXT_EXTRACTION_EXTENSIONS = new Set(["docx", "xlsx"]);

// ── MIME → Category ───────────────────────────────────────────────────────────

/** Maps common MIME types to a pipeline-friendly file category string. */
const MIME_CATEGORY_MAP: Record<string, string> = {
  "image/png": "image",
  "image/jpeg": "image",
  "image/jpg": "image",
  "image/webp": "image",
  "application/pdf": "document",
  "video/mp4": "video",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "text",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "text",
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Extracts the lowercase file extension from a filename.
 *
 * @param filename - Original filename (e.g. "lecture-notes.pdf")
 * @returns Lowercase extension without the dot (e.g. "pdf"), or empty string
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  if (parts.length < 2) return "";
  return (parts.pop() ?? "").toLowerCase();
}

/**
 * Determines file category from extension string.
 *
 * @param ext - Lowercase file extension (e.g. "pdf")
 * @returns "image" | "document" | "video" | "text" | "unknown"
 */
export function categorizeByExtension(
  ext: string
): "image" | "document" | "video" | "text" | "unknown" {
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (DOCUMENT_EXTENSIONS.has(ext)) return "document";
  if (VIDEO_EXTENSIONS.has(ext)) return "video";
  if (TEXT_EXTRACTION_EXTENSIONS.has(ext)) return "text";
  return "unknown";
}

/**
 * Determines file category from a MIME type string.
 *
 * @param mimeType - Full MIME type (e.g. "application/pdf")
 * @returns Category string or "unknown"
 */
export function categorizeByMimeType(
  mimeType: string
): "image" | "document" | "video" | "text" | "unknown" {
  const category = MIME_CATEGORY_MAP[mimeType];
  if (category) return category as "image" | "document" | "video" | "text";

  // Fallback heuristics on MIME prefix
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("application/pdf")) return "document";

  return "unknown";
}

/**
 * Resolves the final file category using MIME type (preferred) with
 * extension-based fallback.
 *
 * @param filename - Original filename
 * @param mimeType - MIME type if available
 * @returns Resolved file category
 */
export function resolveFileCategory(
  filename: string,
  mimeType?: string
): "image" | "document" | "video" | "text" | "unknown" {
  // Try MIME type first (more reliable when present)
  if (mimeType) {
    const fromMime = categorizeByMimeType(mimeType);
    if (fromMime !== "unknown") return fromMime;
  }

  // Fall back to extension
  const ext = getFileExtension(filename);
  return categorizeByExtension(ext);
}

/**
 * Maps a file extension to the expected Gemini-compatible MIME type.
 * Used when constructing inline_data payloads for the Gemini API.
 *
 * @param ext - Lowercase file extension
 * @returns MIME type string
 */
export function extensionToMimeType(ext: string): string {
  const map: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    pdf: "application/pdf",
    mp4: "video/mp4",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  return map[ext] ?? "application/octet-stream";
}

/**
 * Validates that the given extension is one of the supported pipeline types.
 *
 * @param ext - Lowercase file extension
 * @returns True if the extension is supported
 */
export function isSupportedExtension(ext: string): boolean {
  return (
    IMAGE_EXTENSIONS.has(ext) ||
    DOCUMENT_EXTENSIONS.has(ext) ||
    VIDEO_EXTENSIONS.has(ext) ||
    TEXT_EXTRACTION_EXTENSIONS.has(ext)
  );
}
