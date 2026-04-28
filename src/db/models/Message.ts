import { eq, and } from "drizzle-orm"
import { asc, count } from "drizzle-orm"

import { db } from "../index"
import { BaseModel } from "../base-model"
import { messages, MessageModelConfig, type IMessageSchema } from "../schemas/Message.schema"

class MessageModel extends BaseModel<IMessageSchema> {
  async findByConversationId(conversationId: string): Promise<IMessageSchema[]> {
    const rows = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt))
    return rows as unknown as IMessageSchema[]
  }

  async countByUserId(userId: string): Promise<number> {
    const rows = await db
      .select({ total: count() })
      .from(messages)
      .where(and(eq(messages.userId, userId), eq(messages.role, "user")))
    return rows[0]?.total ?? 0
  }

  async deleteByConversationId(conversationId: string): Promise<void> {
    await db.delete(messages).where(eq(messages.conversationId, conversationId))
  }
}

export default new MessageModel(MessageModelConfig, messages)
