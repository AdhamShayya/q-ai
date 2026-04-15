import * as UserSchema from "./schemas/User.schema"
import * as VaultSchema from "./schemas/Vault.schema"
import * as MessageSchema from "./schemas/Message.schema"
import * as DocumentSchema from "./schemas/Document.schema"
import * as ConversationSchema from "./schemas/Conversation.schema"
import * as SubscriptionSchema from "./schemas/Subscription.schema"
import * as DocumentChunkSchema from "./schemas/DocumentChunk.schema"
import * as LearningPersonaSchema from "./schemas/LearningPersona.schema"
import * as FlashcardSchema from "./schemas/Flashcard.schema"
import * as FlashcardReviewSchema from "./schemas/FlashcardReview.schema"
import * as StudyPlanSchema from "./schemas/StudyPlan.schema"

/**
 * Merged schema object passed to Drizzle.
 * Lives here — away from orm.ts — to avoid the circular dependency:
 *   index.ts → orm.ts → models → index.ts
 */
export const schema = {
  ...UserSchema,
  ...VaultSchema,
  ...MessageSchema,
  ...DocumentSchema,
  ...ConversationSchema,
  ...SubscriptionSchema,
  ...DocumentChunkSchema,
  ...LearningPersonaSchema,
  ...FlashcardSchema,
  ...FlashcardReviewSchema,
  ...StudyPlanSchema,
}
