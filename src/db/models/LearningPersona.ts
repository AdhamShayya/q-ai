import { eq } from "drizzle-orm"

import {
  learningPersonas,
  LearningPersonaModelConfig,
  type ILearningPersonaSchema,
} from "../schemas/LearningPersona.schema"
import { BaseModel } from "../base-model"

class LearningPersonaModel extends BaseModel<ILearningPersonaSchema> {
  async findByUserId(userId: string): Promise<ILearningPersonaSchema | null> {
    return this.findOneWhere(eq(learningPersonas.userId, userId))
  }
}

export default new LearningPersonaModel(LearningPersonaModelConfig, learningPersonas)
