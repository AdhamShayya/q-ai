import { and, eq } from "drizzle-orm"
import { BaseModel } from "../base-model"
import {
  studyPlans,
  StudyPlanModelConfig,
  type IStudyPlanSchema,
} from "../schemas/StudyPlan.schema"

class StudyPlanModel extends BaseModel<IStudyPlanSchema> {
  async findByUserAndVault(userId: string, vaultId: string): Promise<IStudyPlanSchema | null> {
    return this.findOneWhere(and(eq(studyPlans.userId, userId), eq(studyPlans.vaultId, vaultId))!)
  }

  async findByUser(userId: string): Promise<IStudyPlanSchema[]> {
    return this.findWhere(eq(studyPlans.userId, userId))
  }
}

export default new StudyPlanModel(StudyPlanModelConfig, studyPlans)
