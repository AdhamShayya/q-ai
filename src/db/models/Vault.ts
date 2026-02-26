import { eq } from "drizzle-orm"

import { BaseModel } from "../base-model"
import { vaults, VaultModelConfig, type IVaultSchema } from "../schemas/Vault.schema"

class VaultModel extends BaseModel<IVaultSchema> {
  async findByUserId(userId: string): Promise<IVaultSchema[]> {
    return this.findWhere(eq(vaults.userId, userId))
  }
}

export default new VaultModel(VaultModelConfig, vaults)
