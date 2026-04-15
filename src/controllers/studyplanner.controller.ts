import { TRPCError } from "@trpc/server"
import { eq } from "drizzle-orm"

import { db } from "../db"
import { ORM } from "../db/orm"
import { documentChunks } from "../db/schemas/DocumentChunk.schema"
import StudyPlanModel from "../db/models/StudyPlan"
import type { IDocumentSchema } from "../db/schemas/Document.schema"
import type {
  IStudyPlanSchema,
  StudyPlanData,
  StudyDay,
  StudyTopic,
} from "../db/schemas/StudyPlan.schema"

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDocType(doc: IDocumentSchema): "file" | "img" | "vid" {
  const mime = doc.mimeType ?? ""
  if (mime.startsWith("image/")) return "img"
  if (mime.startsWith("video/")) return "vid"
  const ext = doc.filename.split(".").pop()?.toLowerCase() ?? ""
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(ext)) return "img"
  if (["mp4", "mov", "avi", "mkv", "webm", "m4v"].includes(ext)) return "vid"
  return "file"
}

/**
 * Estimate study minutes for a document using both fileSize and chunk count.
 *
 * Text/PDF logic:
 *   - Size-based:  ~75 KB/page (typical mixed PDF), 2.5 min/page to read + process
 *   - Chunk-based: each chunk ≈ 400 extracted words at ~100 wpm study pace = 4 min
 *   - Weighted average (55% chunks / 45% size) because chunk count better reflects
 *     actual text density; size alone can be inflated by embedded images.
 *
 * Image logic:
 *   - Larger/more detailed images take longer to analyse and annotate.
 *   - Capped at 25 min; minimum 5 min.
 *
 * Video logic:
 *   - Standard quality ≈ 150 MB/hour. Add 40% for pausing and note-taking.
 *   - Falls back to chunk-based if transcript chunks exist.
 */
function estimateMinutes(doc: IDocumentSchema, chunkCount: number): number {
  const type = getDocType(doc)
  const fileSizeKB = (doc.fileSize ?? 0) / 1024

  if (type === "img") {
    // fileSizeKB / 80 → ~5 min for 400 KB, ~20 min for 1.6 MB
    return Math.min(25, Math.max(5, Math.round(fileSizeKB / 80)))
  }

  if (type === "vid") {
    const sizeMB = fileSizeKB / 1024
    const sizeEst = Math.round((sizeMB / 150) * 60 * 1.4)
    const chunkEst = chunkCount * 6
    if (chunkCount > 0) return Math.max(20, Math.round(sizeEst * 0.4 + chunkEst * 0.6))
    return Math.max(20, sizeEst || 30)
  }

  // Text / PDF
  const sizeEst = fileSizeKB > 0 ? Math.round((fileSizeKB / 75) * 2.5) : 0
  const chunkEst = chunkCount > 0 ? Math.round(chunkCount * 4) : 0

  if (sizeEst > 0 && chunkEst > 0) {
    return Math.max(15, Math.round(sizeEst * 0.45 + chunkEst * 0.55))
  }
  return Math.max(15, sizeEst || chunkEst || 30)
}

/** Re-order documents according to the user's learning style */
function sortByLearningStyle(
  docs: IDocumentSchema[],
  style: "analogies" | "logic" | "visual" | "mixed",
  chunkMap: Map<string, number>,
): IDocumentSchema[] {
  if (style === "visual") {
    // Images & videos first to front-load visual content
    return [
      ...docs.filter((d) => ["img", "vid"].includes(getDocType(d))),
      ...docs.filter((d) => getDocType(d) === "file"),
    ]
  }
  if (style === "logic") {
    // Shortest documents first for quick wins, builds systematic understanding
    return [...docs].sort((a, b) => (chunkMap.get(a.id) ?? 0) - (chunkMap.get(b.id) ?? 0))
  }
  if (style === "analogies") {
    // Interleave types: file, img, vid, file, img, vid …
    const files = docs.filter((d) => getDocType(d) === "file")
    const imgs = docs.filter((d) => getDocType(d) === "img")
    const vids = docs.filter((d) => getDocType(d) === "vid")
    const out: IDocumentSchema[] = []
    const max = Math.max(files.length, imgs.length, vids.length)
    for (let i = 0; i < max; i++) {
      const f = files[i]
      if (f) out.push(f)
      const im = imgs[i]
      if (im) out.push(im)
      const v = vids[i]
      if (v) out.push(v)
    }
    return out
  }
  return docs // mixed: keep original order
}

// ── Controller ────────────────────────────────────────────────────────────────

export async function createStudyPlan(input: {
  vaultId: string
  userId: string
  examDate: string // ISO date string
  dailyHours: number
}): Promise<IStudyPlanSchema> {
  const { vaultId, userId, examDate, dailyHours } = input

  const vault = await ORM.Vault.findById(vaultId)
  if (vault == null) throw new TRPCError({ code: "NOT_FOUND", message: "Vault not found" })

  const persona = await ORM.LearningPersona.findByUserId(userId)
  const learningStyle = persona?.learningStyle ?? "mixed"

  const documents = await ORM.Document.findByVaultId(vaultId)
  if (documents.length === 0) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "No documents found in this vault. Add documents first.",
    })
  }

  // Count chunks per document
  const rows = await db
    .select({ documentId: documentChunks.documentId })
    .from(documentChunks)
    .where(eq(documentChunks.vaultId, vaultId))

  const chunkMap = new Map<string, number>()
  for (const row of rows) {
    if (row.documentId != null) {
      chunkMap.set(row.documentId, (chunkMap.get(row.documentId) ?? 0) + 1)
    }
  }

  const sortedDocs = sortByLearningStyle(documents, learningStyle, chunkMap)

  // Days available
  const examDateTime = new Date(examDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const msPerDay = 1000 * 60 * 60 * 24
  const daysAvailable = Math.max(
    1,
    Math.ceil((examDateTime.getTime() - today.getTime()) / msPerDay),
  )

  const dailyMinutes = dailyHours * 60

  // Reserve last 15 % of days for review (min 1 day and max 7 days)
  const reviewDays = Math.min(7, Math.max(1, Math.floor(daysAvailable * 0.15)))
  const contentDays = Math.max(1, daysAvailable - reviewDays)

  // ── Fill content days ─────────────────────────────────────────────────────

  const docQueue = sortedDocs.map((doc) => ({
    doc,
    minutes: estimateMinutes(doc, chunkMap.get(doc.id) ?? 0),
  }))

  let qIdx = 0
  let minutesLeftInCurrentDoc = docQueue[0]?.minutes ?? 0

  const days: StudyDay[] = []

  for (let i = 0; i < contentDays; i++) {
    if (qIdx >= docQueue.length) break

    const dayDate = new Date(today)
    dayDate.setDate(today.getDate() + i)

    const topics: StudyTopic[] = []
    let minutesUsed = 0

    while (minutesUsed < dailyMinutes - 4 && qIdx < docQueue.length) {
      const entry = docQueue[qIdx]!
      if (entry == null) break
      const available = dailyMinutes - minutesUsed
      const take = Math.min(available, minutesLeftInCurrentDoc)

      const priority: "high" | "medium" | "low" =
        i < contentDays / 3 ? "high" : i < (contentDays * 2) / 3 ? "medium" : "low"

      topics.push({
        documentName: entry.doc.filename,
        documentId: entry.doc.id,
        estimatedMinutes: Math.round(take),
        type: "reading",
        priority,
      })

      minutesUsed += take
      minutesLeftInCurrentDoc -= take

      if (minutesLeftInCurrentDoc <= 0) {
        qIdx++
        minutesLeftInCurrentDoc = docQueue[qIdx]?.minutes ?? 0
      }
    }

    if (topics.length > 0) {
      days.push({
        date: dayDate.toISOString().split("T")[0] ?? "",
        dayNumber: i + 1,
        totalMinutes: topics.reduce((s, t) => s + t.estimatedMinutes, 0),
        topics,
      })
    }
  }

  // ── Add review days ───────────────────────────────────────────────────────

  const reviewDocsPerDay = Math.ceil(sortedDocs.length / reviewDays)
  for (let i = 0; i < reviewDays; i++) {
    const dayDate = new Date(today)
    dayDate.setDate(today.getDate() + contentDays + i)

    const slice = sortedDocs.slice(i * reviewDocsPerDay, (i + 1) * reviewDocsPerDay)
    const minutesPer = slice.length > 0 ? Math.round(Math.min(dailyMinutes / slice.length, 25)) : 25

    const reviewTopics: StudyTopic[] = slice.map((doc) => ({
      documentName: doc.filename,
      documentId: doc.id,
      estimatedMinutes: minutesPer,
      type: "review" as const,
      priority: "high" as const,
    }))

    days.push({
      date: dayDate.toISOString().split("T")[0] ?? "",
      dayNumber: contentDays + i + 1,
      totalMinutes: reviewTopics.reduce((s, t) => s + t.estimatedMinutes, 0),
      topics: reviewTopics,
      note:
        i === reviewDays - 1
          ? "Final full review — exam is tomorrow!"
          : `Review session ${i + 1} of ${reviewDays}`,
    })
  }

  // ── Build summary ─────────────────────────────────────────────────────────

  const totalMinutesNeeded = docQueue.reduce((s, d) => s + d.minutes, 0)
  const styleLabels: Record<string, string> = {
    visual: "visual (images & videos prioritised first)",
    logic: "logical (concise documents first for quick wins)",
    analogies: "analogy-based (mixed media interleaved)",
    mixed: "mixed (original upload order)",
  }
  const styleLabel = styleLabels[learningStyle] ?? learningStyle

  const isOverloaded = totalMinutesNeeded > daysAvailable * dailyMinutes
  const summary =
    `${daysAvailable} day${daysAvailable !== 1 ? "s" : ""} until the exam. ` +
    `${documents.length} document(s) in this vault, estimated ${(totalMinutesNeeded / 60).toFixed(1)} hours of study total. ` +
    `Personalised for your ${styleLabel} learning style. ` +
    (isOverloaded
      ? "⚠️ Your content load slightly exceeds the available time — consider increasing daily hours."
      : "You have enough time to cover all material comfortably.")

  const planData: StudyPlanData = {
    days,
    totalDays: daysAvailable,
    totalStudyHours: parseFloat((totalMinutesNeeded / 60).toFixed(1)),
    examDate,
    vaultName: vault.name,
    learningStyle,
    summary,
  }

  // ── Upsert into DB ────────────────────────────────────────────────────────

  const existing = await StudyPlanModel.findByUserAndVault(userId, vaultId)
  if (existing != null) {
    const updated = await StudyPlanModel.updateById(existing.id, {
      examDate: examDateTime,
      dailyHours,
      planJson: planData,
    })
    if (updated == null) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update plan" })
    }
    return updated
  }

  return StudyPlanModel.create({
    userId,
    vaultId,
    examDate: examDateTime,
    dailyHours,
    planJson: planData,
  })
}

export async function getStudyPlan(
  vaultId: string,
  userId: string,
): Promise<IStudyPlanSchema | null> {
  return StudyPlanModel.findByUserAndVault(userId, vaultId)
}

export async function deleteStudyPlan(vaultId: string, userId: string): Promise<void> {
  const plan = await StudyPlanModel.findByUserAndVault(userId, vaultId)
  if (plan != null) await StudyPlanModel.deleteById(plan.id)
}
