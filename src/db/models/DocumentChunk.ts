import { eq } from "drizzle-orm"

import {
  documentChunks,
  DocumentChunkModelConfig,
  type IDocumentChunkSchema,
} from "../schemas/DocumentChunk.schema"
import { BaseModel } from "../base-model"
import { db } from "../index"

class DocumentChunkModel extends BaseModel<IDocumentChunkSchema> {
  async findByDocumentId(documentId: string): Promise<IDocumentChunkSchema[]> {
    return this.findWhere(eq(documentChunks.documentId, documentId))
  }

  async deleteByVaultId(vaultId: string): Promise<void> {
    await db.delete(documentChunks).where(eq(documentChunks.vaultId, vaultId))
  }
}

export default new DocumentChunkModel(DocumentChunkModelConfig, documentChunks)
