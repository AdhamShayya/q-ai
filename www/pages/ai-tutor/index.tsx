import _ from "lodash";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import React, { useEffect, useRef, useState } from "react";

import { useLoaderData } from "react-router";
import SVGIcon from "../../components/SVGIcon";
import { useTypewriter } from "../../hooks/useTypewriter";
import { useToast } from "../../hooks/useToast";
import type { Serialised } from "../../shared";
import type { IVaultSchema } from "@src/db/schemas/Vault.schema";
import type { IDocumentSchema } from "@src/db/schemas/Document.schema";
import {
  vaultApi,
  userApi,
  conversationApi,
  personaApi,
  invalidateCache,
} from "../../trpc";
import UpgradeModal from "../../components/UpgradeModal";
import { USAGE_LIMITS } from "../dashboard";

const BACKEND_UPLOAD_URL = import.meta.env.PROD
  ? "/upload"
  : "http://localhost:4000/upload";

const ALLOWED_UPLOAD_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "video/mp4",
  "application/pdf",
]);
const ALLOWED_UPLOAD_EXTS = new Set([".png", ".jpg", ".jpeg", ".mp4", ".pdf"]);

function isAllowedFile(file: File): boolean {
  if (ALLOWED_UPLOAD_TYPES.has(file.type)) return true;
  const ext = "." + (file.name.split(".").pop()?.toLowerCase() ?? "");
  return ALLOWED_UPLOAD_EXTS.has(ext);
}

async function uploadFile(props: { file: File; vaultId: string }) {
  const { file, vaultId } = props;
  const form = new FormData();
  form.append("file", file);
  form.append("vaultId", vaultId);
  form.append("filename", file.name);
  try {
    const res = await fetch(BACKEND_UPLOAD_URL, { method: "POST", body: form });
    if (!res.ok) {
      console.error("File upload failed for", file.name, await res.text());
    }
  } catch (err) {
    console.error("File upload failed for", file.name, err);
  }
}

type MessageRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

interface Suggestion {
  id: number;
  icon: React.ReactNode;
  text: string;
}

interface ActionPillData {
  id: number;
  icon: React.ReactNode;
  label: string;
}

export async function loader() {
  const [user, persona] = await Promise.all([
    userApi.me.query(),
    personaApi.get.query().catch(() => null),
  ]);
  if (!user) return Response.redirect("/sign-in");
  if (persona == null) return Response.redirect("/onboarding");
  return { userId: user.id };
}

const SUGGESTIONS: Suggestion[] = [
  {
    id: 1,
    icon: (
      <SVGIcon
        name="book"
        size={20}
        style={{ color: "var(--ai-text-muted)", flexShrink: 0 }}
      />
    ),
    text: "Explain the main concepts from this chapter",
  },
  {
    id: 2,
    icon: (
      <SVGIcon
        name="key"
        size={20}
        style={{ color: "var(--ai-text-muted)", flexShrink: 0 }}
      />
    ),
    text: "What are the key takeaways I should remember?",
  },
  {
    id: 3,
    icon: (
      <SVGIcon
        name="list"
        size={20}
        style={{ color: "var(--ai-text-muted)", flexShrink: 0 }}
      />
    ),
    text: "Can you break down this topic step by step?",
  },
  {
    id: 4,
    icon: (
      <SVGIcon
        name="globe"
        size={20}
        style={{ color: "var(--ai-text-muted)", flexShrink: 0 }}
      />
    ),
    text: "Help me understand this with real-world examples",
  },
];

const ACTION_PILLS: ActionPillData[] = [
  {
    id: 1,
    icon: <SVGIcon name="lightbulb" size={20} style={{ flexShrink: 0 }} />,
    label: "Explain Concept",
  },
  {
    id: 2,
    icon: <SVGIcon name="list" size={20} style={{ flexShrink: 0 }} />,
    label: "Show Examples",
  },
  {
    id: 3,
    icon: <SVGIcon name="analogy-cycle" size={20} style={{ flexShrink: 0 }} />,
    label: "Use Analogy",
  },
  {
    id: 4,
    icon: <SVGIcon name="file" size={20} style={{ flexShrink: 0 }} />,
    label: "Summarize",
  },
];

// ── Skeleton components ───────────────────────────────────────────────────────

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={`rounded animate-pulse ${className ?? ""}`}
      style={{ background: "var(--ai-surface-hover, var(--ai-surface))" }}
    />
  );
}

function VaultCardSkeleton() {
  return (
    <div className="ai-vault-card pointer-events-none" aria-hidden>
      <div className="ai-vault-bar ai-vault-bar-inactive" />
      <div className="flex items-center gap-3 px-4 py-2">
        <SkeletonLine className="w-8 h-8 rounded-full shrink-0" />
        <SkeletonLine className="flex-1 h-3" />
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 px-4 py-1">
      {Array.from({ length: 3 }).map((_, i) => (
        <VaultCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────

function EmptyState({
  onSuggestionClick,
}: {
  onSuggestionClick?: (text: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-7 px-8 py-12 min-h-full relative overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="ai-orb ai-orb-1" />
      <div className="ai-orb ai-orb-2" />
      <div className="ai-orb ai-orb-3" />

      {/* Glowing AI avatar */}
      <div className="w-19 h-19 rounded-full flex items-center justify-center shrink-0 ai-avatar-xl">
        <SVGIcon name="sparkles" size={32} style={{ color: "#fff" }} />
      </div>

      {/* Heading */}
      <div className="text-center max-w-115">
        <h3 className="ai-gradient-text text-[1.4rem] font-bold mb-2.5">
          Start Your Learning Journey
        </h3>
        <p
          className="text-[0.87rem] leading-[1.7]"
          style={{ color: "var(--ai-text-muted)" }}
        >
          Ask me anything about your study materials. I'll help you understand
          complex concepts through personalized explanations.
        </p>
      </div>

      {/* Divider with label */}
      <div className="flex gap-3 w-full items-center">
        <div className="ai-divider" />
        <span
          className="text-[0.68rem] tracking-widest uppercase shrink-0"
          style={{ color: "var(--ai-text-dim)" }}
        >
          Try asking
        </span>
        <div className="ai-divider" />
      </div>

      {/* Suggestion grid */}
      <div className="ai-suggestions-grid grid grid-cols-2 gap-3 w-4/5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => onSuggestionClick?.(s.text)}
            className="ai-suggestion-card p-4 flex items-start gap-3 text-left w-full"
          >
            <span className="mt-0.5 shrink-0">{s.icon}</span>
            <span className="text-[0.8rem] leading-normal">{s.text}</span>
          </button>
        ))}
      </div>

      {/* Footer trust badges */}
      <div className="flex items-center gap-5">
        <span
          className="flex items-center gap-1.5 text-[0.68rem]"
          style={{ color: "var(--ai-text-dim)" }}
        >
          <SVGIcon name="lock" size={12} />
          Privacy Protected
        </span>
        <div className="ai-trust-sep" />
        <span
          className="flex items-center gap-1.5 text-[0.68rem]"
          style={{ color: "var(--ai-text-dim)" }}
        >
          <SVGIcon name="shield" size={12} />
          Academic Integrity
        </span>
      </div>
    </div>
  );
}

// ── ChatInput ─────────────────────────────────────────────────────────────────

function ChatInput(props: {
  value: string;
  onChange: (v: string) => void;
  onSend?: () => void;
  disabled?: boolean;
  onAttachFile?: () => void;
  attachDisabled?: boolean;
  isUploading?: boolean;
}) {
  const {
    value,
    onChange,
    onSend,
    disabled,
    onAttachFile,
    attachDisabled,
    isUploading,
  } = props;
  const MAX = 2000;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value.slice(0, MAX));
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  // Reset height when value is cleared externally (e.g. after send)
  useEffect(() => {
    if (!value && textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value]);

  const canSend = !disabled && !!value.trim();

  return (
    <div className="ai-input-bar">
      <div
        className={`ai-input-field${focused ? " ai-input-field--focused" : ""}`}
      >
        {/* Attach file */}
        <div
          title={
            attachDisabled
              ? "Select a vault first to add documents"
              : "Add document to vault"
          }
          onClick={() => {
            if (!attachDisabled && !isUploading) onAttachFile?.();
          }}
          className={`ai-icon-btn self-end mb-0.5 shrink-0 ${attachDisabled ? "ai-icon-btn-disabled" : ""}`}
        >
          {isUploading ? (
            <span className="w-3 h-3 ai-spinner-ring" />
          ) : (
            <SVGIcon
              name="plus"
              size={14}
              style={{ color: "var(--ai-text-muted)" }}
            />
          )}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          placeholder="Ask a question about your study material..."
          rows={1}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 resize-none min-h-6 max-h-30 border-none outline-none text-sm bg-transparent py-1"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSend) onSend?.();
            }
          }}
        />

        {/* Send */}
        <div
          onClick={() => {
            if (canSend) onSend?.();
          }}
          className={`ai-send-btn self-end mb-0.5 ${!canSend ? "ai-send-btn--disabled" : ""}`}
        >
          <SVGIcon name="send" size={12} style={{ color: "#fff" }} />
        </div>
      </div>

      {/* Hint row */}
      <div className="flex items-center justify-between mt-1.5 px-1">
        <span
          className="text-[0.65rem]"
          style={{ color: "var(--ai-text-dim)" }}
        >
          Enter to send · Shift+Enter for new line
        </span>
        <span
          className="text-[0.65rem]"
          style={{
            color: value.length > MAX * 0.9 ? "#f59e0b" : "var(--ai-text-dim)",
          }}
        >
          {value.length}/{MAX}
        </span>
      </div>
    </div>
  );
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
// All prose styles live in .ai-markdown in tailwind.css.
// A thin wrapper div is added around <table> only to enable horizontal scroll.

function renderMarkdown(content: string) {
  return (
    <div className="ai-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className="ai-markdown-table-wrap">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function useSpeech() {
  const [speaking, setSpeaking] = useState(false);

  const speak = (text: string) => {
    if (!window.speechSynthesis) {
      return;
    }
    window.speechSynthesis.cancel();
    const stripped = text.replace(/[#*`_~>]/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(stripped);
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  return { speaking, speak, stop };
}

// ── MessageBubble ─────────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  isStreaming,
}: {
  msg: ChatMessage;
  isStreaming?: boolean;
}) {
  const isUser = msg.role === "user";
  const [typingDone, setTypingDone] = useState(!isStreaming);
  const displayed = useTypewriter(
    msg.content,
    12,
    !!isStreaming && !typingDone,
    () => setTypingDone(true),
  );
  const showMarkdown = !isStreaming || typingDone;
  const { speaking, speak, stop } = useSpeech();

  return (
    <div
      className={`ai-tutor-msg-row flex py-2 px-6 gap-2.5 items-end animate-fade-slide-in ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div className="max-w-[70%] flex flex-col gap-1.5">
        <div
          className={`ai-tutor-msg-bubble px-4 py-2.5 text-sm leading-[1.65] ${
            isUser ? "ai-bubble-user" : "ai-bubble-assistant"
          }`}
        >
          {isUser ? (
            displayed
          ) : showMarkdown ? (
            renderMarkdown(msg.content)
          ) : (
            <span className="whitespace-pre-wrap">
              {displayed}
              <span className="ai-cursor" />
            </span>
          )}
        </div>

        {/* TTS button — only for assistant messages */}
        {!isUser && (
          <button
            title={speaking ? "Stop speaking" : "Read aloud"}
            onClick={() => (speaking ? stop() : speak(msg.content))}
            className={`ai-tts-btn ${speaking ? "ai-tts-btn-active" : ""}`}
          >
            <SVGIcon
              name={speaking ? "volume-x" : "volume-2"}
              size={14}
              style={{ color: "inherit" }}
            />
            <span>{speaking ? "Stop" : "Listen"}</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ── TypingIndicator ───────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="ai-tutor-msg-row flex justify-start py-2 px-6 gap-2.5 items-end">
      <div className="w-7.5 h-7.5 rounded-full shrink-0 flex items-center justify-center mb-0.5 ai-avatar-md">
        <SVGIcon name="sparkles" size={13} style={{ color: "#fff" }} />
      </div>
      <div className="ai-typing-bubble px-4 py-2.5 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="ai-typing-dot"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function ChatArea({
  conversationTitle,
  userId,
  vaultId,
  onToggleSidebar,
  allDocumentsCount,
  onDocumentUploaded,
}: {
  conversationTitle?: string;
  userId: string;
  vaultId: string | null;
  onToggleSidebar?: () => void;
  allDocumentsCount: number;
  onDocumentUploaded: () => void;
}) {
  const toast = useToast();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null,
  );
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(false);

  // ── File upload ───────────────────────────────────────────────────────────

  async function handleFiles(rawFiles: File[]) {
    if (vaultId == null) {
      toast.error("Please select a vault before uploading documents.");
      return;
    }

    const valid = rawFiles.filter(isAllowedFile);
    const rejected = rawFiles.filter((f) => !isAllowedFile(f));
    if (rejected.length > 0) {
      toast.error(
        `Unsupported file${rejected.length > 1 ? "s" : ""} removed: ${rejected.map((f) => f.name).join(", ")}`,
      );
    }
    if (valid.length === 0) return;

    if (allDocumentsCount + valid.length > USAGE_LIMITS.studyMaterials.max) {
      setShowUpgradeModal(true);
      return;
    }

    setIsUploadingDoc(true);
    try {
      // Upload files to backend storage first, then create DB records + enqueue ingestion jobs
      await Promise.allSettled(
        valid.map((file) => uploadFile({ file, vaultId: vaultId! })),
      );

      await Promise.all(
        valid.map((file) =>
          vaultApi.addDocument.mutate({
            vaultId: vaultId!,
            filename: file.name,
            fileType: file.name.split(".").pop()?.toUpperCase() ?? "FILE",
            fileSize: file.size,
            mimeType: file.type || undefined,
            courseVault: conversationTitle ?? "AI Tutor",
          }),
        ),
      );

      // Invalidate cache so sidebar refreshes
      invalidateCache(`vault.getDocuments:${vaultId}`);
      onDocumentUploaded();
      toast.success(
        `${valid.length} document${valid.length > 1 ? "s" : ""} added to vault`,
      );
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploadingDoc(false);
    }
  }

  // ── Drag & drop handlers ──────────────────────────────────────────────────

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
    if (e.dataTransfer.items.length > 0) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    void handleFiles(files);
  };

  // Load or create conversation + messages when vault changes
  useEffect(() => {
    setMessages([]);
    setMessage("");
    setConversationId(null);

    if (vaultId == null) {
      return;
    }

    isInitialLoadRef.current = true;
    setIsChatLoading(true);
    conversationApi.getOrCreate
      .query({ userId, vaultId })
      .then(async (conv) => {
        setConversationId(conv.id);
        const msgs = await conversationApi.getMessages.query({
          conversationId: conv.id,
        });
        setMessages(
          msgs.map((m) => ({
            id: m.id,
            role: m.role as MessageRole,
            content: m.content,
            timestamp: m.createdAt ? new Date(m.createdAt) : new Date(),
          })),
        );
      })
      .finally(() => setIsChatLoading(false));
  }, [vaultId, userId]);

  useEffect(() => {
    if (bottomRef.current == null || (messages.length === 0 && !isLoading)) {
      return;
    }
    const isInitial = isInitialLoadRef.current;
    if (messages.length > 0) isInitialLoadRef.current = false;
    bottomRef.current.scrollIntoView({
      behavior: isInitial ? "instant" : "smooth",
    });
  }, [messages, isLoading]);

  const sendMessage = async () => {
    const text = message.trim();
    if (text == null || isLoading === true) {
      return;
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setMessage("");
    setIsLoading(true);

    try {
      const result = await conversationApi.chat.mutate({
        userId,
        vaultId: vaultId!,
        message: text,
        ...(conversationId != null && { conversationId }),
      });

      // If the conversation was just created server-side, store its ID
      if (conversationId == null) setConversationId(result.conversationId);

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.answer,
        timestamp: new Date(),
      };
      setStreamingMessageId(aiMsg.id);
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Network error — please check your connection and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col flex-1 min-w-0 h-full overflow-hidden relative"
      style={{ background: "var(--ai-bg)" }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept=".pdf,.mp4,.png,.jpg,.jpeg"
        multiple
        onChange={(e) => {
          void handleFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />

      {/* Drag-over overlay */}
      {isDragOver && (
        <div className="ai-drag-overlay">
          <div className="w-16 h-16 rounded-full flex items-center justify-center ai-avatar-xl">
            <SVGIcon name="upload" size={28} style={{ color: "#fff" }} />
          </div>
          <p className="text-white font-semibold text-base">
            Drop to add to vault
          </p>
          {vaultId == null && (
            <p className="text-white/60 text-[0.78rem]">
              No vault selected — please select one first
            </p>
          )}
        </div>
      )}

      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}

      {/* Chat header */}
      <div className="ai-chat-header">
        <div className="ai-gradient-line" />
        <div className="flex items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3.5">
            {/* Mobile sidebar toggle */}
            <button
              type="button"
              className="ai-tutor-mobile-toggle w-8.5 h-8.5 rounded-md items-center justify-center shrink-0 cursor-pointer ai-icon-btn"
              onClick={onToggleSidebar}
            >
              <SVGIcon
                name="list"
                size={16}
                style={{ color: "var(--ai-text)" }}
              />
            </button>

            <div className="w-9.5 h-9.5 rounded-full flex items-center justify-center shrink-0 ai-avatar-md">
              <SVGIcon name="sparkles" size={17} style={{ color: "#fff" }} />
            </div>

            <div>
              <p
                className="font-semibold text-[0.92rem] mb-0.5"
                style={{ color: "var(--ai-text)" }}
              >
                {conversationTitle}
              </p>
              <p
                className="text-[0.72rem]"
                style={{ color: "var(--ai-text-dim)" }}
              >
                AI Tutor Conversation
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto pt-4 pb-4">
        {isChatLoading ? (
          <div className="flex flex-col items-center justify-center gap-4 h-full py-20">
            <div className="w-10 h-10 ai-loading-ring" />
            <p
              className="text-[0.82rem]"
              style={{ color: "var(--ai-text-dim)" }}
            >
              Loading conversation…
            </p>
          </div>
        ) : messages.length === 0 ? (
          <EmptyState onSuggestionClick={(text) => setMessage(text)} />
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isStreaming={msg.id === streamingMessageId}
              />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input bar — shrink-0 flex child, grows naturally with textarea */}
      <ChatInput
        value={message}
        onChange={setMessage}
        onSend={sendMessage}
        disabled={isLoading}
        onAttachFile={() => fileInputRef.current?.click()}
        attachDisabled={vaultId == null}
        isUploading={isUploadingDoc}
      />
    </div>
  );
}

// ── VaultCard ─────────────────────────────────────────────────────────────────

function VaultCard(props: {
  vault: Serialised<IVaultSchema>;
  selected: boolean;
  onClick: () => void;
}) {
  const { vault, selected, onClick } = props;
  return (
    <div
      onClick={onClick}
      className={`ai-vault-card ${selected ? "ai-vault-selected" : ""}`}
    >
      {/* Gradient accent bar */}
      <div
        className={`ai-vault-bar ${selected ? "ai-vault-bar-active" : "ai-vault-bar-inactive"}`}
      />
      <div className="flex items-center gap-3 px-4 py-2">
        <div
          className={`ai-vault-icon ${selected ? "ai-vault-icon-active" : "ai-vault-icon-inactive"}`}
        >
          {vault.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="font-medium text-[0.85rem] truncate"
            style={{ color: "var(--ai-text)" }}
          >
            {vault.name}
          </p>
        </div>
        {selected && (
          <div className="ai-vault-check">
            <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>
              ✓
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileTypeIcon(mimeType: string | null, fileType: string): string {
  const t = (mimeType ?? fileType).toLowerCase();
  if (t.includes("pdf")) {
    return "📄";
  }
  if (t.includes("word") || t.includes("doc")) {
    return "📝";
  }
  if (t.includes("powerpoint") || t.includes("ppt")) {
    return "📊";
  }
  if (t.includes("excel") || t.includes("sheet") || t.includes("csv")) {
    return "📈";
  }
  if (t.includes("image") || t.includes("png") || t.includes("jpg")) {
    return "🖼️";
  }
  if (t.includes("video")) {
    return "🎬";
  }
  if (t.includes("audio")) {
    return "🎵";
  }
  {
    return "📁";
  }
}

const STATUS_DOT: Record<string, { color: string; label: string }> = {
  completed: { color: "#22c55e", label: "Ready" },
  processing: { color: "#f59e0b", label: "Processing" },
  pending: { color: "#94a3b8", label: "Pending" },
  error: { color: "#ef4444", label: "Error" },
};

function DocumentRow({ doc }: { doc: Serialised<IDocumentSchema> }) {
  const status =
    STATUS_DOT[doc.processingStatus ?? "pending"] ?? STATUS_DOT.pending;
  return (
    <div className="ai-doc-row">
      <span style={{ fontSize: 17, lineHeight: 1 }} className="shrink-0">
        {fileTypeIcon(doc.mimeType, doc.fileType)}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className="text-[0.8rem] truncate"
          style={{ color: "var(--ai-text-secondary)" }}
        >
          {_.truncate(doc.filename, { length: 26 })}
        </p>
        <p
          className="text-[0.68rem] mt-px"
          style={{ color: "var(--ai-text-dim)" }}
        >
          {formatBytes(doc.fileSize)}
        </p>
      </div>
      <span
        className="w-1.75 h-1.75 rounded-full shrink-0"
        style={{
          background: status?.color,
          boxShadow: `0 0 7px ${status?.color}`,
        }}
      />
    </div>
  );
}

function VaultContents({
  vaultId,
  refreshKey,
}: {
  vaultId: string;
  refreshKey?: number;
}) {
  const [docs, setDocs] = useState<Serialised<IDocumentSchema>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    vaultApi.getDocuments
      .query({ vaultId })
      .then(setDocs)
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [vaultId, refreshKey]);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Section label */}
      <div className="flex items-center justify-between px-5 pt-3 pb-2">
        <p
          className="font-semibold text-[0.72rem] tracking-widest uppercase"
          style={{ color: "var(--ai-text-dim)" }}
        >
          Contents
        </p>
        {!loading && <span className="ai-count-badge">{docs.length}</span>}
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-[0.4rem]">
        {loading ? (
          <p
            className="text-[0.75rem] pt-2"
            style={{ color: "var(--ai-text-dim)" }}
          >
            Loading…
          </p>
        ) : docs.length === 0 ? (
          <p
            className="text-[0.75rem] pt-2"
            style={{ color: "var(--ai-text-dim)" }}
          >
            No documents in this vault yet.
          </p>
        ) : (
          docs.map((doc) => <DocumentRow key={doc.id} doc={doc} />)
        )}
      </div>
    </div>
  );
}

function StudyMaterialsSidebar(props: {
  vaults: Serialised<IVaultSchema>[];
  selectedVaultId: string | null;
  onSelectVault: (id: string) => void;
  isOpen: boolean;
  refreshKey?: number;
  loading?: boolean;
}) {
  const {
    vaults,
    selectedVaultId,
    onSelectVault,
    isOpen,
    refreshKey,
    loading,
  } = props;
  return (
    <aside
      className={`ai-tutor-sidebar ai-sidebar-panel${isOpen ? " sidebar-open" : ""}`}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-2 shrink-0">
        <div className="flex items-center gap-2 mb-[0.35rem]">
          <div className="ai-status-dot" />
          <p
            className="font-bold text-[0.92rem]"
            style={{ color: "var(--ai-text)" }}
          >
            Study Materials
          </p>
        </div>
      </div>

      {/* Vault picker */}
      <p
        className="text-[0.72rem] px-5 pb-1"
        style={{ color: "var(--ai-text-dim)" }}
      >
        Select a vault to link this chat
      </p>
      <div className="shrink-0 max-h-[40%] overflow-y-auto px-4 py-1 flex flex-col gap-2.5">
        {loading === true ? (
          <SidebarSkeleton />
        ) : vaults.length === 0 ? (
          <p
            className="text-center text-[0.75rem] py-2"
            style={{ color: "var(--ai-text-dim)" }}
          >
            No vaults found. Create one on the home page.
          </p>
        ) : (
          vaults.map((v) => (
            <VaultCard
              key={v.id}
              vault={v}
              selected={v.id === selectedVaultId}
              onClick={() => onSelectVault(v.id)}
            />
          ))
        )}
      </div>

      {/* Selected vault contents — takes remaining height */}
      {selectedVaultId != null && (
        <VaultContents vaultId={selectedVaultId} refreshKey={refreshKey} />
      )}
    </aside>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

function AiTutor() {
  const { userId } = useLoaderData<typeof loader>();
  const [vaults, setVaults] = useState<Serialised<IVaultSchema>[]>([]);
  const [vaultsLoading, setVaultsLoading] = useState(true);
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [docRefreshKey, setDocRefreshKey] = useState(0);
  const [totalDocs, setTotalDocs] = useState(0);

  // to get the list of vaults for the sidebar, and also to determine which vault is selected by default (first one)
  useEffect(() => {
    setVaultsLoading(true);
    vaultApi.listByUser
      .query({ userId })
      .then(async (loadedVaults) => {
        setVaults(loadedVaults);
        setSelectedVaultId(loadedVaults[0]?.id ?? null);
        const allDocs = await Promise.all(
          loadedVaults.map((v) =>
            vaultApi.getDocuments.query({ vaultId: v.id }),
          ),
        );
        setTotalDocs(allDocs.reduce((sum, docs) => sum + docs.length, 0));
      })
      .catch(console.error)
      .finally(() => setVaultsLoading(false));
  }, [userId]);

  const selectedVault = vaults.find((v) => v.id === selectedVaultId);
  const conversationTitle = selectedVault?.name ?? "AI Tutor";

  function handleDocumentUploaded() {
    setDocRefreshKey((k) => k + 1);
    setTotalDocs((n) => n + 1);
  }

  return (
    <>
      {sidebarOpen && (
        <div
          className="ai-tutor-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="ai-tutor-page">
        <StudyMaterialsSidebar
          vaults={vaults}
          selectedVaultId={selectedVaultId}
          onSelectVault={(id) => {
            setSelectedVaultId(id);
            setSidebarOpen(false);
          }}
          isOpen={sidebarOpen}
          refreshKey={docRefreshKey}
          loading={vaultsLoading}
        />
        <ChatArea
          conversationTitle={conversationTitle}
          userId={userId}
          vaultId={selectedVaultId}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
          allDocumentsCount={totalDocs}
          onDocumentUploaded={handleDocumentUploaded}
        />
      </div>
    </>
  );
}

export default AiTutor;
