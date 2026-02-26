import { eq } from "drizzle-orm"

import {
  subscriptions,
  SubscriptionModelConfig,
  type ISubscriptionSchema,
} from "../schemas/Subscription.schema"
import { BaseModel } from "../base-model"

class SubscriptionModel extends BaseModel<ISubscriptionSchema> {
  async findByUserId(userId: string): Promise<ISubscriptionSchema[]> {
    return this.findWhere(eq(subscriptions.userId, userId))
  }

  async findActiveByUserId(userId: string): Promise<ISubscriptionSchema | null> {
    const rows = await this.findByUserId(userId)
    return rows.find((s) => s.status === "active") ?? null
  }
}

export default new SubscriptionModel(SubscriptionModelConfig, subscriptions)
