import UserModel from "./models/User"
import VaultModel from "./models/Vault"
import MessageModel from "./models/Message"
import DocumentModel from "./models/Document"
import ConversationModel from "./models/Conversation"
import SubscriptionModel from "./models/Subscription"
import DocumentChunkModel from "./models/DocumentChunk"
import LearningPersonaModel from "./models/LearningPersona"

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
} as const
