import { eq } from "drizzle-orm"

import { db } from "../index"
import { BaseModel } from "../base-model"
import { documents, DocumentModelConfig, type IDocumentSchema } from "../schemas/Document.schema"

class DocumentModel extends BaseModel<IDocumentSchema> {
  async findByVaultId(vaultId: string): Promise<IDocumentSchema[]> {
    return this.findWhere(eq(documents.vaultId, vaultId))
  }

  async deleteByVaultId(vaultId: string): Promise<void> {
    await db.delete(documents).where(eq(documents.vaultId, vaultId))
  }
}

export default new DocumentModel(DocumentModelConfig, documents)
