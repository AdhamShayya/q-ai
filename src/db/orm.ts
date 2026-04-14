import UserModel from "./models/User"
import VaultModel from "./models/Vault"
import MessageModel from "./models/Message"
import DocumentModel from "./models/Document"
import ConversationModel from "./models/Conversation"
import SubscriptionModel from "./models/Subscription"
import DocumentChunkModel from "./models/DocumentChunk"
import LearningPersonaModel from "./models/LearningPersona"
import FlashcardModel from "./models/Flashcard"
import FlashcardReviewModel from "./models/FlashcardReview"
import StudyPlanModel from "./models/StudyPlan"

// ── ORM ────────────────────────────────────────────────────────────────

export const ORM = {
  User: UserModel,
  Vault: VaultModel,
  Message: MessageModel,
  Document: DocumentModel,
  Conversation: ConversationModel,
  Subscription: SubscriptionModel,
  DocumentChunk: DocumentChunkModel,
  LearningPersona: LearningPersonaModel,
  Flashcard: FlashcardModel,
  FlashcardReview: FlashcardReviewModel,
  StudyPlan: StudyPlanModel,
} as const
