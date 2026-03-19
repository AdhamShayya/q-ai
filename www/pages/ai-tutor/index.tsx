import _ from "lodash";
import ReactMarkdown from "react-markdown";
import React, { useEffect, useRef, useState } from "react";

import { useLoaderData } from "react-router";
import SVGIcon from "../../components/SVGIcon";
import { useTypewriter } from "../../hooks/useTypewriter";
import type { Serialised } from "../../shared";
import type { IVaultSchema } from "@src/db/schemas/Vault.schema";
import type { IDocumentSchema } from "@src/db/schemas/Document.schema";
import { vaultApi, userApi, conversationApi, personaApi } from "../../trpc";

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

export async function loader() {
  const user = await userApi.me.query();
  if (!user) return Response.redirect("/sign-in");
  const persona = await personaApi.get.query().catch(() => null);
  if (persona == null) return Response.redirect("/onboarding");
  const vaults = await vaultApi.listByUser.query({ userId: user.id });
  return { userId: user.id, vaults };
}

const ICON_STYLE_SUGGESTION = {
  flexShrink: 0 as const,
  color: "var(--ai-text-muted)",
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.75rem",
        padding: "3rem 2rem",
        minHeight: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow orbs */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "15%",
          width: 260,
          height: 260,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, var(--ai-orb1) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "20%",
          right: "10%",
          width: 200,
          height: 200,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, var(--ai-orb2) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          right: "20%",
          width: 140,
          height: 140,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, var(--ai-orb3) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Glowing AI avatar */}
      <div
        style={{
          width: 76,
          height: 76,
          borderRadius: "50%",
          background: "var(--ai-accent-gradient)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "var(--ai-avatar-glow)",
          animation: "pulse 3s ease-in-out infinite",
          flexShrink: 0,
        }}
      >
        <SVGIcon name="sparkles" size={32} style={{ color: "#fff" }} />
      </div>

      {/* Heading */}
      <div style={{ textAlign: "center", maxWidth: 460 }}>
        <h3
          style={{
            background: "var(--ai-heading-gradient)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: "0.65rem",
            fontSize: "1.4rem",
          }}
        >
          Start Your Learning Journey
        </h3>
        <p
          style={{
            color: "var(--ai-text-muted)",
            fontSize: "0.87rem",
            lineHeight: 1.7,
          }}
        >
          Ask me anything about your study materials. I'll help you understand
          complex concepts through personalized explanations.
        </p>
      </div>

      {/* Divider with label */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          width: "100%",
        }}
      >
        <div
          style={{ flex: 1, height: 1, background: "var(--ai-border-faint)" }}
        />
        <span
          style={{
            fontSize: "0.68rem",
            color: "var(--ai-text-dim)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Try asking
        </span>
        <div
          style={{ flex: 1, height: 1, background: "var(--ai-border-faint)" }}
        />
      </div>

      {/* Suggestion grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.75rem",
          width: "100%",
          justifyContent: "center",
        }}
      >
        {SUGGESTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => onSuggestionClick?.(s.text)}
            style={{
              background: "var(--ai-surface-subtle)",
              border: "1px solid var(--ai-border-faint)",
              borderRadius: "0.875rem",
              padding: "0.9rem 1rem",
              textAlign: "left",
              cursor: "pointer",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
              transition: "all 0.2s ease",
              color: "var(--ai-text-secondary)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.background = "var(--ai-hover-surface)";
              el.style.borderColor = "var(--ai-hover-border)";
              el.style.boxShadow = "var(--ai-hover-glow)";
              el.style.color = "var(--ai-hover-text)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.background = "var(--ai-surface-subtle)";
              el.style.borderColor = "var(--ai-border-faint)";
              el.style.boxShadow = "none";
              el.style.color = "var(--ai-text-secondary)";
            }}
          >
            <span style={{ marginTop: 2, flexShrink: 0 }}>{s.icon}</span>
            <span
              style={{
                fontSize: "0.8rem",
                lineHeight: 1.5,
                fontFamily: "inherit",
              }}
            >
              {s.text}
            </span>
          </button>
        ))}
      </div>

      {/* Footer trust badges */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: "0.68rem",
            color: "var(--ai-text-dim)",
          }}
        >
          <SVGIcon name="lock" size={12} />
          Privacy Protected
        </span>
        <span
          style={{
            width: 3,
            height: 3,
            borderRadius: "50%",
            background: "var(--ai-border)",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: "0.68rem",
            color: "var(--ai-text-dim)",
          }}
        >
          <SVGIcon name="shield" size={12} />
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
  const [focused, setFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value.slice(0, MAX));
    // auto-resize
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const canSend = !disabled && !!value.trim();

  return (
    <div
      style={{
        padding: "0.875rem 1.25rem 1rem",
        background: "var(--ai-input-area)",
        borderTop: "1px solid var(--ai-border-faint)",
      }}
    >
      {/* Input box */}
      <div
        style={{
          display: "flex",
          gap: "0.625rem",
          padding: "0.5rem 0.875rem",
          borderRadius: "1rem",
          border: focused
            ? "1.5px solid var(--ai-border-focus)"
            : "1.5px solid var(--ai-border-faint)",
          background: "var(--ai-surface-subtle)",
          alignItems: "center",
          transition: "border-color 0.2s, box-shadow 0.2s",
          boxShadow: focused
            ? "0 0 0 4px var(--ai-focus-ring), 0 4px 24px rgba(0,0,0,0.35)"
            : "0 4px 20px rgba(0,0,0,0.15)",
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          placeholder="Ask a question about your study material..."
          rows={1}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            resize: "none",
            minHeight: "1.5rem",
            maxHeight: "7.5rem",
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--ai-text)",
            fontSize: "0.875rem",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSend) onSend?.();
            }
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            paddingBottom: "0.1rem",
          }}
        >
          <div
            onClick={() => {
              if (canSend) onSend?.();
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--ai-surface-subtle)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: canSend ? "pointer" : "default",
              transition: "all 0.2s",
            }}
          >
            <SVGIcon
              name="send"
              size={12}
              style={{ color: canSend ? "black" : "var(--color-info)" }}
            />
          </div>
        </div>
      </div>

      {/* Hint row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "0.5rem",
          padding: "0 0.25rem",
        }}
      >
        <span style={{ fontSize: "0.68rem", color: "var(--ai-text-dim)" }}>
          Enter to send · Shift+Enter for new line
        </span>
        <span
          style={{
            fontSize: "0.68rem",
            color: value.length > MAX * 0.9 ? "#f59e0b" : "var(--ai-text-dim)",
          }}
        >
          {value.length}/{MAX}
        </span>
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
              background: "var(--ai-code-bg)",
              padding: "0.1em 0.4em",
              borderRadius: "0.3em",
              fontFamily: "monospace",
              fontSize: "0.88em",
              color: "var(--ai-code-color)",
            }}
          >
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre
            style={{
              background: "var(--ai-surface-subtle)",
              border: "1px solid var(--ai-border-faint)",
              padding: "0.65em 0.9em",
              borderRadius: "0.625em",
              overflowX: "auto",
              fontFamily: "monospace",
              fontSize: "0.84em",
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

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        padding: "0.5rem 1.5rem",
        gap: "0.625rem",
        alignItems: "flex-end",
        animation: "fadeSlideIn 0.25s ease-out",
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            flexShrink: 0,
            background: "var(--ai-accent-gradient)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--ai-glow-sm)",
            marginBottom: 2,
          }}
        >
          <SVGIcon name="sparkles" size={13} style={{ color: "#fff" }} />
        </div>
      )}
      <div
        style={{
          maxWidth: "70%",
          padding: "0.7rem 1.05rem",
          borderRadius: isUser
            ? "1.2rem 1.2rem 0.3rem 1.2rem"
            : "0.3rem 1.2rem 1.2rem 1.2rem",
          background: isUser ? "var(--ai-user-bubble)" : "var(--ai-surface)",
          color: isUser ? "#fff" : "var(--ai-text)",
          fontSize: "0.875rem",
          lineHeight: 1.65,
          border: isUser ? "none" : "1px solid var(--ai-border)",
          wordBreak: "break-word",
          boxShadow: isUser
            ? "var(--ai-glow-lg)"
            : "0 2px 14px rgba(0,0,0,0.25)",
          backdropFilter: isUser ? "none" : "blur(8px)",
          ...(isUser ? { whiteSpace: "pre-wrap" as const } : {}),
        }}
      >
        {isUser ? (
          displayed
        ) : showMarkdown ? (
          renderMarkdown(msg.content)
        ) : (
          <span style={{ whiteSpace: "pre-wrap" }}>
            {displayed}
            <span
              style={{
                display: "inline-block",
                width: "2px",
                height: "0.9em",
                background: "var(--ai-cursor-color)",
                marginLeft: "2px",
                verticalAlign: "middle",
                animation: "blink 0.65s step-end infinite",
              }}
            />
          </span>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-start",
        padding: "0.5rem 1.5rem",
        gap: "0.625rem",
        alignItems: "flex-end",
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          flexShrink: 0,
          background: "var(--ai-accent-gradient)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "var(--ai-glow-sm)",
          marginBottom: 2,
        }}
      >
        <SVGIcon name="sparkles" size={13} style={{ color: "#fff" }} />
      </div>
      <div
        style={{
          padding: "0.7rem 1.1rem",
          borderRadius: "0.3rem 1.2rem 1.2rem 1.2rem",
          background: "var(--ai-surface)",
          border: "1px solid var(--ai-border)",
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
          backdropFilter: "blur(8px)",
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--ai-accent)",
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
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null,
  );
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
      setStreamingMessageId(aiMsg.id);
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        background: "var(--ai-bg)",
        position: "relative",
      }}
    >
      {/* Chat header */}
      <div
        style={{
          borderBottom: "1px solid var(--ai-border-faint)",
          background: "var(--ai-header-bg)",
          flexShrink: 0,
          backdropFilter: "blur(16px)",
        }}
      >
        {/* Gradient accent line */}
        <div
          style={{
            height: 2,
            background: "var(--ai-accent-gradient)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.875rem 1.5rem",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "var(--ai-accent-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "var(--ai-glow-sm)",
                flexShrink: 0,
              }}
            >
              <SVGIcon name="sparkles" size={17} style={{ color: "#fff" }} />
            </div>
            <div>
              <p
                style={{
                  fontWeight: 600,
                  fontSize: "0.92rem",
                  color: "var(--ai-text)",
                  marginBottom: 2,
                }}
              >
                {conversationTitle}
              </p>
              <p style={{ fontSize: "0.72rem", color: "var(--ai-text-dim)" }}>
                AI Tutor Conversation
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#10b981",
                boxShadow: "0 0 10px rgba(16,185,129,0.65)",
                animation: "statusPing 2s ease-in-out infinite",
                display: "inline-block",
              }}
            />
            <span
              style={{ fontSize: "0.72rem", color: "#10b981", fontWeight: 500 }}
            >
              Online
            </span>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingTop: "1rem",
          paddingBottom: "0.5rem",
        }}
      >
        {isChatLoading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
              height: "100%",
              padding: "5rem 0",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "2.5px solid var(--ai-border-faint)",
                borderTopColor: "var(--ai-spinner)",
                animation: "spin 0.8s linear infinite",
                boxShadow: "0 0 16px rgba(124,58,237,0.3)",
              }}
            />
            <p style={{ color: "var(--ai-text-dim)", fontSize: "0.82rem" }}>
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
  return (
    <div
      onClick={onClick}
      style={{
        background: selected
          ? "var(--ai-hover-surface)"
          : "var(--ai-surface-subtle)",
        border: selected
          ? "1.5px solid var(--ai-hover-border)"
          : "1.5px solid var(--ai-border-faint)",
        borderRadius: "0.875rem",
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: selected ? "var(--ai-hover-glow)" : "none",
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLDivElement).style.background =
            "var(--ai-surface)";
          (e.currentTarget as HTMLDivElement).style.borderColor =
            "var(--ai-border)";
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLDivElement).style.background =
            "var(--ai-surface-subtle)";
          (e.currentTarget as HTMLDivElement).style.borderColor =
            "var(--ai-border-faint)";
        }
      }}
    >
      {/* Gradient accent bar */}
      <div
        style={{
          height: 3,
          background: selected
            ? "var(--ai-accent-gradient)"
            : "var(--ai-border-faint)",
          transition: "background 0.2s",
        }}
      />
      <div
        style={{
          display: "flex",
          padding: "0.5rem 1rem",
          gap: "0.75rem",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            flexShrink: 0,
            background: selected
              ? "var(--ai-user-bubble)"
              : "var(--ai-surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--ai-text)",
            fontWeight: 700,
            fontSize: "0.85rem",
            boxShadow: selected ? "var(--ai-send-glow)" : "none",
            transition: "all 0.2s",
          }}
        >
          {vault.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              fontWeight: 500,
              fontSize: "0.85rem",
              color: "var(--ai-text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {vault.name}
          </p>
        </div>
        {selected && (
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "var(--ai-user-bubble)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "var(--ai-glow-sm)",
            }}
          >
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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.6rem 0.75rem",
        borderRadius: "0.625rem",
        background: "var(--ai-surface-subtle)",
        border: "1px solid var(--ai-border-faint)",
        overflow: "hidden",
        transition: "background 0.15s",
        cursor: "default",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLDivElement).style.background =
          "var(--ai-surface)")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLDivElement).style.background =
          "var(--ai-surface-subtle)")
      }
    >
      <span style={{ fontSize: 17, lineHeight: 1, flexShrink: 0 }}>
        {fileTypeIcon(doc.mimeType, doc.fileType)}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p
          style={{
            fontSize: "0.8rem",
            color: "var(--ai-text-secondary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {_.truncate(doc.filename, { length: 26 })}
        </p>
        <p
          style={{
            fontSize: "0.68rem",
            color: "var(--ai-text-dim)",
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
          boxShadow: `0 0 7px ${status?.color}`,
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
        borderTop: "1px solid var(--ai-border-faint)",
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
          padding: "0.75rem 1.25rem 0.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <p
          style={{
            fontWeight: 600,
            fontSize: "0.72rem",
            letterSpacing: "0.09em",
            textTransform: "uppercase",
            color: "var(--ai-text-dim)",
          }}
        >
          Contents
        </p>
        {!loading && (
          <span
            style={{
              fontSize: "0.68rem",
              color: "var(--ai-text-dim)",
              background: "var(--ai-surface-subtle)",
              border: "1px solid var(--ai-border-faint)",
              borderRadius: 99,
              padding: "1px 8px",
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
          padding: "0.25rem 1rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.4rem",
        }}
      >
        {loading ? (
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--ai-text-dim)",
              paddingTop: "0.5rem",
            }}
          >
            Loading…
          </p>
        ) : docs.length === 0 ? (
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--ai-text-dim)",
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
      style={{
        display: "flex",
        flexDirection: "column",
        width: 300,
        minWidth: 280,
        maxWidth: 320,
        background: "var(--ai-panel)",
        borderLeft: "1px solid var(--ai-border-faint)",
        backdropFilter: "blur(16px)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "1.25rem 1.25rem 1rem",
          borderBottom: "1px solid var(--ai-border-faint)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.35rem",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--ai-accent-gradient)",
              boxShadow: "0 0 8px var(--ai-accent)",
              flexShrink: 0,
            }}
          />
          <p
            style={{
              fontWeight: 700,
              fontSize: "0.92rem",
              color: "var(--ai-text)",
            }}
          >
            Study Materials
          </p>
        </div>
        <p
          style={{
            fontSize: "0.72rem",
            color: "var(--ai-text-dim)",
            paddingLeft: "1.25rem",
          }}
        >
          Select a vault to link this chat
        </p>
      </div>

      {/* Vault list */}
      <div
        style={{
          flexShrink: 0,
          maxHeight: "60%",
          overflowY: "auto",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.625rem",
        }}
      >
        {vaults.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              fontSize: "0.75rem",
              color: "var(--ai-text-dim)",
              padding: "0.5rem 0",
            }}
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
    <>
      <style>{`
        .ai-tutor-page textarea::placeholder { color: var(--ai-text-dim); }
        .ai-tutor-page *::-webkit-scrollbar { width: 4px; height: 4px; }
        .ai-tutor-page *::-webkit-scrollbar-track { background: transparent; }
        .ai-tutor-page *::-webkit-scrollbar-thumb { background: var(--ai-border); border-radius: 999px; }
        .ai-tutor-page *::-webkit-scrollbar-thumb:hover { background: var(--ai-accent); }
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: var(--ai-avatar-glow); }
          50% { transform: scale(1.03); }
        }
      `}</style>
      <div
        className="ai-tutor-page"
        style={{
          display: "flex",
          height: "calc(100vh - 64px)",
          background: "var(--ai-bg)",
          overflow: "hidden",
        }}
      >
        <StudyMaterialsSidebar
          vaults={vaults}
          selectedVaultId={selectedVaultId}
          onSelectVault={setSelectedVaultId}
        />
        <ChatArea
          conversationTitle={conversationTitle}
          userId={userId}
          vaultId={selectedVaultId}
        />
      </div>
    </>
  );
}

export default AiTutor;
