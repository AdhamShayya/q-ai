import { eq } from "drizzle-orm"

import {
  documentChunks,
  DocumentChunkModelConfig,
  type IDocumentChunkSchema,
} from "../schemas/DocumentChunk.schema"
import { BaseModel } from "../base-model"

class DocumentChunkModel extends BaseModel<IDocumentChunkSchema> {
  async findByDocumentId(documentId: string): Promise<IDocumentChunkSchema[]> {
    return this.findWhere(eq(documentChunks.documentId, documentId))
  }
}

export default new DocumentChunkModel(DocumentChunkModelConfig, documentChunks)
