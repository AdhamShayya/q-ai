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

const CHAT_WEBHOOK_URL = "https://techflow12.app.n8n.cloud/webhook/chat-tutor";
const UPLOAD_WEBHOOK_URL =
  "https://techflow12.app.n8n.cloud/webhook/q-ai/ingest";

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

async function sendFileToWebhook(props: {
  file: File;
  userId: string;
  vaultId: string;
  documentId: string;
}) {
  const { file, userId, vaultId, documentId } = props;
  const form = new FormData();
  form.append("file", file);
  form.append("userId", userId);
  form.append("vaultId", vaultId);
  form.append("documentId", documentId);
  form.append("filename", file.name);
  form.append("mimeType", file.type ?? "application/octet-stream");
  try {
    await fetch(UPLOAD_WEBHOOK_URL, { method: "POST", body: form });
  } catch (err) {
    console.error("Webhook ingest failed for", file.name, err);
  }
}

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
  const [user, persona] = await Promise.all([
    userApi.me.query(),
    personaApi.get.query().catch(() => null),
  ]);
  if (!user) return Response.redirect("/sign-in");
  if (persona == null) return Response.redirect("/onboarding");
  const vaults = await vaultApi.listByUser.query({ userId: user.id });
  const allDocs = await Promise.all(
    vaults.map((v) => vaultApi.getDocuments.query({ vaultId: v.id })),
  );
  const totalDocuments = allDocs.reduce((sum, docs) => sum + docs.length, 0);
  return { userId: user.id, vaults, totalDocuments };
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
        className="ai-suggestions-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.75rem",
          width: "80",
          justifyContent: "center",
        }}
      >
        {SUGGESTIONS.map((s) => (
          <div
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
          </div>
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
    // auto-resize
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const canSend = !disabled && !!value.trim();

  return (
    <div
      style={{
        padding: "0.875rem 1.25rem 1.25rem",
        width: "70%",
        margin: "0 auto",
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
          background: "var(--ai-bg)",
          backdropFilter: "none",
          isolation: "isolate",
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
          {/* Attach file button */}
          <div
            title={
              attachDisabled
                ? "Select a vault first to add documents"
                : "Add document to vault"
            }
            onClick={() => {
              if (!attachDisabled && !isUploading) onAttachFile?.();
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
              cursor: attachDisabled || isUploading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: attachDisabled ? 0.4 : 1,
            }}
          >
            {isUploading ? (
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  border: "2px solid var(--ai-border-faint)",
                  borderTopColor: "var(--ai-accent)",
                  display: "inline-block",
                  animation: "spin 0.8s linear infinite",
                }}
              />
            ) : (
              <SVGIcon
                name="plus"
                size={14}
                style={{ color: "var(--ai-text-muted)" }}
              />
            )}
          </div>

          {/* Send button */}
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
              style={{
                color: canSend ? "var(--color-text)" : "var(--color-info)",
              }}
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
      remarkPlugins={[remarkGfm]}
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
        table: ({ children }) => (
          <div style={{ overflowX: "auto", margin: "0.6em 0" }}>
            <table
              style={{
                borderCollapse: "collapse",
                width: "100%",
                fontSize: "0.9em",
              }}
            >
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead
            style={{
              background: "var(--ai-surface-subtle)",
            }}
          >
            {children}
          </thead>
        ),
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => (
          <tr
            style={{
              borderBottom: "1px solid var(--ai-border-faint)",
            }}
          >
            {children}
          </tr>
        ),
        th: ({ children }) => (
          <th
            style={{
              padding: "0.45em 0.75em",
              fontWeight: 700,
              textAlign: "left",
              border: "1px solid var(--ai-border-faint)",
              whiteSpace: "nowrap",
            }}
          >
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td
            style={{
              padding: "0.4em 0.75em",
              border: "1px solid var(--ai-border-faint)",
              verticalAlign: "top",
            }}
          >
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
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
      className="ai-tutor-msg-row"
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        padding: "0.5rem 1.5rem",
        gap: "0.625rem",
        alignItems: "flex-end",
        animation: "fadeSlideIn 0.25s ease-out",
      }}
    >
      <div
        style={{
          maxWidth: "70%",
          display: "flex",
          flexDirection: "column",
          gap: "0.35rem",
        }}
      >
        <div
          className="ai-tutor-msg-bubble"
          style={{
            padding: "0.4rem 0.75rem",
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

        {/* TTS button — only for assistant messages */}
        {!isUser && (
          <button
            title={speaking ? "Stop speaking" : "Read aloud"}
            onClick={() => (speaking ? stop() : speak(msg.content))}
            style={{
              alignSelf: "flex-end",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0.2rem 0.4rem",
              borderRadius: "0.5rem",
              color: speaking
                ? "var(--ai-accent, #7c6ef2)"
                : "var(--ai-text-muted)",
              transition: "color 0.2s, background 0.2s",
              fontSize: "0.7rem",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--ai-surface-subtle)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "none";
            }}
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

function TypingIndicator() {
  return (
    <div
      className="ai-tutor-msg-row"
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
      const savedDocs = await Promise.all(
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

      await Promise.allSettled(
        valid.map((file, i) =>
          sendFileToWebhook({
            file,
            userId,
            vaultId: vaultId!,
            documentId: savedDocs[i]!.id,
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
    if (bottomRef.current == null) return;
    if (messages.length === 0 && !isLoading) return;
    const isInitial = isInitialLoadRef.current;
    if (messages.length > 0) isInitialLoadRef.current = false;
    bottomRef.current.scrollIntoView({
      behavior: isInitial ? "instant" : "smooth",
    });
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
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        height: "100%",
        overflow: "hidden",
        background: "var(--ai-bg)",
        position: "relative",
      }}
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
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
            border: "2px dashed var(--ai-accent)",
            borderRadius: "0.5rem",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--ai-accent-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--ai-avatar-glow)",
            }}
          >
            <SVGIcon name="upload" size={28} style={{ color: "#fff" }} />
          </div>
          <p
            style={{
              color: "#fff",
              fontWeight: 600,
              fontSize: "1rem",
            }}
          >
            Drop to add to vault
          </p>
          {vaultId == null && (
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.78rem" }}>
              No vault selected — please select one first
            </p>
          )}
        </div>
      )}

      {/* Upgrade modal */}
      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}
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
            {/* Mobile sidebar toggle */}
            <div
              className="ai-tutor-mobile-toggle"
              onClick={onToggleSidebar}
              style={{
                display: "none",
                width: 34,
                height: 34,
                borderRadius: "0.625rem",
                background: "var(--ai-surface-subtle)",
                border: "1px solid var(--ai-border-faint)",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <SVGIcon
                name="list"
                size={16}
                style={{ color: "var(--ai-text)" }}
              />
            </div>
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
        </div>
      </div>

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingTop: "1rem",
          paddingBottom: "8rem",
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

      {/* Floating input bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          // background: "var(--ai-bg)",  todo activate if wane the whole bg of the input to be that
          pointerEvents: "none",
        }}
      >
        <div style={{ pointerEvents: "auto", backgroundColor: "var(--ai-bg)" }}>
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
      </div>
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
        flexShrink: 0,
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
        flexShrink: 0,

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
    <div
      style={{
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
          padding: "0rem 1rem 1rem",
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
  isOpen: boolean;
  refreshKey?: number;
}) {
  const { vaults, selectedVaultId, onSelectVault, isOpen, refreshKey } = props;
  return (
    <aside
      className={`ai-tutor-sidebar${isOpen ? " sidebar-open" : ""}`}
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
          padding: "1rem  1.25rem 0.5rem 1.25rem",
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
      </div>

      {/* Vault list */}

      {/* Vault contents section */}
      {selectedVaultId != null && (
        <VaultContents vaultId={selectedVaultId} refreshKey={refreshKey} />
      )}

      <p
        style={{
          fontSize: "0.72rem",
          color: "var(--ai-text-dim)",
          padding: "1.25rem",
        }}
      >
        Select a vault to link this chat
      </p>
      <div
        style={{
          flexShrink: 0,
          maxHeight: "40%",
          overflowY: "auto",
          padding: "0.25rem 1rem",
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
    </aside>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

function AiTutor() {
  const { userId, vaults, totalDocuments } = useLoaderData<typeof loader>();
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(
    vaults[0]?.id ?? null,
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [docRefreshKey, setDocRefreshKey] = useState(0);
  // Track live total count so plan checks stay accurate after uploads
  const [totalDocs, setTotalDocs] = useState(totalDocuments);

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
          onSelectVault={(id) => {
            setSelectedVaultId(id);
            setSidebarOpen(false);
          }}
          isOpen={sidebarOpen}
          refreshKey={docRefreshKey}
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
