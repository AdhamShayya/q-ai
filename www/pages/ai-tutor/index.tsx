import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

import { useLoaderData } from "react-router";
import Button from "../../components/Button";
import SVGIcon from "../../components/SVGIcon";
import { vaultApi, userApi, conversationApi } from "../../trpc";
import type { Serialised } from "../../shared";
import type { IVaultSchema } from "@src/db/schemas/Vault.schema";
import type { IDocumentSchema } from "@src/db/schemas/Document.schema";

const CHAT_WEBHOOK_URL = "https://techflow12.app.n8n.cloud/webhook/chat-tutor";

/**
 * Normalises the n8n webhook reply into a plain string.
 * Handles shapes like:
 *   [{"text": "…"}]  –  array with a text field
 *   {"output": "…"} –  plain object with known keys
 *   "some string"    –  already a string
 */
function parseWebhookReply(data: unknown): string {
  // Array shape: [{"text": "…"}, …]
  if (Array.isArray(data)) {
    const first = data[0];
    if (first && typeof first === "object") {
      const obj = first as Record<string, unknown>;
      const value =
        obj.text ?? obj.output ?? obj.message ?? obj.reply ?? obj.response;
      if (typeof value === "string") return value;
    }
    if (typeof first === "string") return first;
  }

  // Object shape
  if (data !== null && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const value =
      obj.output ?? obj.message ?? obj.text ?? obj.reply ?? obj.response;
    if (typeof value === "string") return value;
  }

  if (typeof data === "string") return data;

  return "Sorry, I couldn't get a response.";
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

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loader() {
  const user = await userApi.me.query();
  if (!user) return Response.redirect("/sign-in");
  const vaults = await vaultApi.listByUser.query({ userId: user.id });
  return { userId: user.id, vaults };
}

const ICON_STYLE_SUGGESTION = {
  flexShrink: 0 as const,
  color: "var(--color-text-muted)",
};
const ICON_STYLE_PILL = { flexShrink: 0 as const };

const SUGGESTIONS: Suggestion[] = [
  {
    id: 1,
    icon: <SVGIcon name="book" style={ICON_STYLE_SUGGESTION} size={20} />,
    text: "Explain the main concepts from this chapter",
  },
  {
    id: 2,
    icon: <SVGIcon name="key" style={ICON_STYLE_SUGGESTION} size={20} />,
    text: "What are the key takeaways I should remember?",
  },
  {
    id: 3,
    icon: <SVGIcon name="list" style={ICON_STYLE_SUGGESTION} size={20} />,
    text: "Can you break down this topic step by step?",
  },
  {
    id: 4,
    icon: <SVGIcon name="globe" style={ICON_STYLE_SUGGESTION} size={20} />,
    text: "Help me understand this with real-world examples",
  },
];

const ACTION_PILLS: ActionPillData[] = [
  {
    id: 1,
    icon: <SVGIcon name="lightbulb" style={ICON_STYLE_PILL} size={20} />,
    label: "Explain Concept",
  },
  {
    id: 2,
    icon: <SVGIcon name="list" size={20} style={ICON_STYLE_PILL} />,
    label: "Show Examples",
  },
  {
    id: 3,
    icon: <SVGIcon name="analogy-cycle" size={20} style={ICON_STYLE_PILL} />,
    label: "Use Analogy",
  },
  {
    id: 4,
    icon: <SVGIcon name="file" size={20} style={ICON_STYLE_PILL} />,
    label: "Summarize",
  },
];

function EmptyState({
  onSuggestionClick,
}: {
  onSuggestionClick?: (text: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-14">
      <SVGIcon
        name="sparkles"
        size={40}
        style={{ color: "var(--color-text-secondary)" }}
      />

      <div className="text-center gap-3">
        <h3>Start Your Learning Journey</h3>
        <p>
          Ask me anything about your study materials. I'll help you understand
          complex concepts through personalized explanations.
        </p>
      </div>

      <p>Try asking:</p>

      <div className="grid grid-cols-2 gap-4">
        {SUGGESTIONS.map((s) => (
          <Button
            variant="outline"
            size="none"
            fullWidth
            onClick={() => onSuggestionClick?.(s.text)}
            className="flex justify-center items-center gap-4 whitespace-normal text-left rounded-(--radius-lg) py-4 px-4.5"
          >
            {s.icon}
            <p>{s.text}</p>
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-6 mt-4">
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <SVGIcon name="lock" size={22} />
          Privacy Protecte
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <SVGIcon name="shield" size={22} />
          Academic Integrity
        </span>
      </div>
    </div>
  );
}

function ChatInput(props: {
  value: string;
  onChange: (v: string) => void;
  onSend?: () => void;
  disabled?: boolean;
}) {
  const { value, onChange, onSend, disabled } = props;
  const MAX = 2000;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value.slice(0, MAX));
    // auto-resize
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Action pills */}
      <div className="flex gap-3">
        {ACTION_PILLS.map((p) => (
          <Button
            variant="outline"
            leftIcon={p.icon}
            onClick={() => onChange(value + p.label + "")}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Textarea box */}
      <div
        className="flex flex-end gap-2 px-4 py-2 rounded-full border-2 border-border items-center shadow-md"
        style={{
          transition: "border-color var(--transition-fast)",
        }}
        onFocusCapture={(e) =>
          (e.currentTarget.style.borderColor = "var(--color-border-focus)")
        }
        onBlurCapture={(e) =>
          (e.currentTarget.style.borderColor = "var(--color-border)")
        }
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          placeholder="Ask a question about your study material..."
          rows={1}
          className="focus:outline-none"
          style={{
            flex: 1,
            resize: "none",
            minHeight: "1.5rem",
            maxHeight: "7.5rem",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!disabled && value.trim()) {
                onSend?.();
              }
            }
          }}
        />
        <div className="flex items-center gap-2 pb-1">
          <Button variant="ghost" size="icon">
            <SVGIcon name="mic" size={17} />
          </Button>
          <Button
            variant="solid"
            size="icon"
            onClick={() => {
              if (!disabled && value.trim()) {
                onSend?.();
              }
            }}
            style={
              !value.trim() || disabled
                ? { background: "var(--color-text-muted)", cursor: "pointer" }
                : undefined
            }
          >
            <SVGIcon name="send" size={16} />
          </Button>
        </div>
      </div>

      {/* Hint */}
      <div className="flex items-center gap-3 px-2">
        <p>Press Enter to send, Shift+Enter for new line</p>
        <p
          style={{
            color:
              value.length > MAX * 0.9
                ? "var(--color-warning)"
                : "var(--color-text-muted)",
          }}
        >
          {value.length}/{MAX}
        </p>
      </div>
    </div>
  );
}

function renderMarkdown(content: string) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => (
          <h1
            style={{
              fontSize: "1.1em",
              fontWeight: 700,
              marginBottom: "0.4em",
              marginTop: "0.6em",
            }}
          >
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2
            style={{
              fontSize: "1.05em",
              fontWeight: 700,
              marginBottom: "0.35em",
              marginTop: "0.55em",
            }}
          >
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3
            style={{
              fontSize: "1em",
              fontWeight: 700,
              marginBottom: "0.3em",
              marginTop: "0.5em",
            }}
          >
            {children}
          </h3>
        ),
        p: ({ children }) => <p style={{ margin: "0.35em 0" }}>{children}</p>,
        strong: ({ children }) => (
          <strong style={{ fontWeight: 700 }}>{children}</strong>
        ),
        em: ({ children }) => (
          <em style={{ fontStyle: "italic" }}>{children}</em>
        ),
        ul: ({ children }) => (
          <ul
            style={{
              paddingLeft: "1.25em",
              margin: "0.3em 0",
              listStyleType: "disc",
            }}
          >
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol
            style={{
              paddingLeft: "1.25em",
              margin: "0.3em 0",
              listStyleType: "decimal",
            }}
          >
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li style={{ margin: "0.15em 0" }}>{children}</li>
        ),
        code: ({ children }) => (
          <code
            style={{
              background: "var(--color-bg)",
              padding: "0.1em 0.35em",
              borderRadius: "0.25em",
              fontFamily: "monospace",
              fontSize: "0.9em",
            }}
          >
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre
            style={{
              background: "var(--color-bg)",
              padding: "0.6em 0.8em",
              borderRadius: "0.5em",
              overflowX: "auto",
              fontFamily: "monospace",
              fontSize: "0.85em",
              margin: "0.4em 0",
            }}
          >
            {children}
          </pre>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        padding: "0.25rem 2rem",
      }}
    >
      <div
        style={{
          maxWidth: "72%",
          padding: "0.65rem 1rem",
          borderRadius: isUser
            ? "1rem 1rem 0.25rem 1rem"
            : "1rem 1rem 1rem 0.25rem",
          background: isUser ? "var(--color-primary)" : "var(--color-bg-card)",
          color: isUser ? "#fff" : "var(--color-text)",
          fontSize: "var(--font-size-sm)",
          lineHeight: "var(--line-height-normal)",
          border: isUser ? "none" : "1.5px solid var(--color-border)",
          wordBreak: "break-word",
          ...(isUser ? { whiteSpace: "pre-wrap" as const } : {}),
        }}
      >
        {isUser ? msg.content : renderMarkdown(msg.content)}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start py-1 px-4">
      <div className="px-4 py-[0.65rem] rounded-[1rem_1rem_1rem_0.25rem] bg-[var(--color-bg-card)] border-[1.5px] border-[var(--color-border)] flex items-center gap-[0.3rem]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--color-text-muted)",
              display: "inline-block",
              animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
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
}: {
  conversationTitle?: string;
  userId: string;
  vaultId: string | null;
}) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load or create conversation + messages when vault changes
  useEffect(() => {
    setMessages([]);
    setMessage("");
    setConversationId(null);

    if (vaultId == null) {
      return;
    }

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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async () => {
    const text = message.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setMessage("");
    setIsLoading(true);

    // Persist user message
    if (conversationId != null) {
      conversationApi.addMessage.mutate({
        conversationId,
        role: "user",
        content: text,
      });
    }

    try {
      const res = await fetch(CHAT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, userId, vaultId }),
      });

      let replyText = "Sorry, I couldn't get a response.";
      if (res.ok === true) {
        const contentType = res.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          const data = await res.json();
          replyText = parseWebhookReply(data);
        } else {
          const raw = await res.text();
          try {
            replyText = parseWebhookReply(JSON.parse(raw));
          } catch {
            replyText = raw;
          }
        }
      }

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: replyText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Persist assistant message
      if (conversationId != null) {
        conversationApi.addMessage.mutate({
          conversationId,
          role: "assistant",
          content: replyText,
        });
      }
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
    <div className="flex flex-col bg-(--color-bg) w-full">
      <div className="flex items-center justify-between px-7.5 py-4 border-b border-(--color-border) bg-(--color-bg-card)">
        <div>
          <h5>{conversationTitle}</h5>
          <p>AI Tutor Conversation</p>
        </div>

        <Button variant="outline" size="sm">
          + New
        </Button>
      </div>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingTop: "1rem",
          paddingBottom: "0.5rem",
        }}
      >
        {isChatLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 h-full py-20">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "3px solid var(--color-border)",
                borderTopColor: "var(--color-primary)",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <p
              style={{
                color: "var(--color-text-muted)",
                fontSize: "var(--font-size-sm)",
              }}
            >
              Loading conversation…
            </p>
          </div>
        ) : messages.length === 0 ? (
          <EmptyState onSuggestionClick={(text) => setMessage(text)} />
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <ChatInput
        value={message}
        onChange={setMessage}
        onSend={sendMessage}
        disabled={isLoading}
      />
    </div>
  );
}

function VaultCard(props: {
  vault: Serialised<IVaultSchema>;
  selected: boolean;
  onClick: () => void;
}) {
  const { vault, selected, onClick } = props;
  const color = "var(--secondary-color)";
  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? "var(--color-bg)" : "var(--color-bg-card)",
        border: selected
          ? `1.5px solid ${color}`
          : "1.5px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        cursor: "pointer",
        transition:
          "box-shadow var(--transition-fast), transform var(--transition-fast), border-color var(--transition-fast)",
        boxShadow: selected ? `0 0 0 2px ${color}22` : "none",
      }}
    >
      {/* Colour accent bar */}
      <div style={{ height: 6, background: color }} />
      <div className="flex p-4 gap-2 items-center">
        <div className="rounded-full flex items-center justify-center text-white w-8 h-8 bg-(--secondary-color)">
          {vault.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0, gap: 0 }}>
          <p>{vault.name}</p>
          {vault.courseName != null && (
            <p className="text-[12px]">{vault.courseName}</p>
          )}
        </div>
        {selected === true && (
          <span
            style={{
              marginLeft: "auto",
              color,
              flexShrink: 0,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            ✓
          </span>
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
  if (t.includes("pdf")) return "📄";
  if (t.includes("word") || t.includes("doc")) return "📝";
  if (t.includes("powerpoint") || t.includes("ppt")) return "📊";
  if (t.includes("excel") || t.includes("sheet") || t.includes("csv"))
    return "📈";
  if (t.includes("image") || t.includes("png") || t.includes("jpg"))
    return "🖼️";
  if (t.includes("video")) return "🎬";
  if (t.includes("audio")) return "🎵";
  return "📁";
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
    <div className="flex items-center gap-4 p-2 rounded-md bg-(--color-bg) border border-gray-300">
      <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>
        {fileTypeIcon(doc.mimeType, doc.fileType)}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p>{doc.filename}</p>
        <p
          style={{
            fontSize: 11,
            color: "var(--color-text-muted)",
            marginTop: 1,
          }}
        >
          {formatBytes(doc.fileSize)}
        </p>
      </div>
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: status?.color,
          flexShrink: 0,
          boxShadow: `0 0 5px ${status?.color}88`,
        }}
      />
    </div>
  );
}

function VaultContents({ vaultId }: { vaultId: string }) {
  const [docs, setDocs] = useState<Serialised<IDocumentSchema>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    vaultApi.getDocuments
      .query({ vaultId })
      .then(setDocs)
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [vaultId]);

  return (
    <div
      style={{
        borderTop: "1.5px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* Section label */}
      <div
        style={{
          padding: "0.625rem 1.25rem 0.375rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <p className="font-bold text-gray-600 text-[16px]">Contents</p>
        {loading === false && (
          <span
            style={{
              fontSize: 11,
              color: "var(--color-text-muted)",
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: 99,
              padding: "1px 7px",
            }}
          >
            {docs.length}
          </span>
        )}
      </div>

      {/* Document list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0.25rem 1.25rem 0.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.4rem",
        }}
      >
        {loading ? (
          <p
            style={{
              fontSize: "var(--font-size-xs)",
              color: "var(--color-text-muted)",
              paddingTop: "0.5rem",
            }}
          >
            Loading…
          </p>
        ) : docs.length === 0 ? (
          <p
            style={{
              fontSize: "var(--font-size-xs)",
              color: "var(--color-text-muted)",
              paddingTop: "0.5rem",
            }}
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
}) {
  const { vaults, selectedVaultId, onSelectVault } = props;
  return (
    <aside
      className="flex flex-col bg-(--color-bg-card) border-l-2 border-border overflow-hidden"
      style={{
        width: "300px",
        minWidth: "280px",
        maxWidth: "320px",
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-300" style={{ flexShrink: 0 }}>
        <h3 className="text-[20px]">Study Materials</h3>
        <p className="text-gray-400 text-[12px]">
          Select a vault to link this chat
        </p>
      </div>

      {/* Vault list – capped height so contents section is always visible */}
      <div className="flex flex-col shrink-0 overflow-y-auto max-h-[60%] container py-4 gap-4">
        {vaults.length === 0 ? (
          <p className="text-center text-gray-400 text-[12px]">
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

      {/* Vault contents section */}
      {selectedVaultId != null && <VaultContents vaultId={selectedVaultId} />}
    </aside>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

function AiTutor() {
  const { userId, vaults } = useLoaderData<typeof loader>();
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(
    vaults[0]?.id ?? null,
  );

  const selectedVault = vaults.find((v) => v.id === selectedVaultId);
  const conversationTitle = selectedVault?.name ?? "AI Tutor";

  return (
    <div className=" flex h-[calc(100vh-64px)]">
      <ChatArea
        conversationTitle={conversationTitle}
        userId={userId}
        vaultId={selectedVaultId}
      />
      <StudyMaterialsSidebar
        vaults={vaults}
        selectedVaultId={selectedVaultId}
        onSelectVault={setSelectedVaultId}
      />
    </div>
  );
}

export default AiTutor;
