import React, { useEffect, useRef, useState } from "react";

import { useLoaderData } from "react-router";
import Navbar from "../../components/Navbar";
import Button from "../../components/Button";
import SVGIcon from "../../components/SVGIcon";
import { vaultApi, userApi } from "../../trpc";
import type { Serialised } from "../../shared";
import type { IVaultSchema } from "@src/db/schemas/Vault.schema";

// ── Constants ────────────────────────────────────────────────────────────────

const DEMO_NAME = "Demo User";
const DEMO_EMAIL = "demo@q-ai.app";

// ── Types ────────────────────────────────────────────────────────────────────

type Vault = Serialised<IVaultSchema>;

const CHAT_WEBHOOK_URL = "https://techflow12.app.n8n.cloud/webhook/chat-tutor";

type MessageRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

interface Material {
  id: number;
  title: string;
  subtitle: string;
  thumbnail: string;
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
  const user = await userApi.ensureUser.mutate({
    email: DEMO_EMAIL,
    name: DEMO_NAME,
  });
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

// ── Components ───────────────────────────────────────────────────────────────

function SuggestionButton({
  icon,
  text,
  onClick,
}: {
  icon: React.ReactNode;
  text: string;
  onClick?: () => void;
}) {
  return (
    <Button
      variant="outline"
      size="none"
      fullWidth
      onClick={onClick}
      className="flex justify-center items-center gap-4 whitespace-normal text-left rounded-(--radius-lg) py-4 px-4.5"
    >
      {icon}
      <p>{text}</p>
    </Button>
  );
}

function ActionPill({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Button variant="outline" size="sm" leftIcon={icon} onClick={onClick}>
      {label}
    </Button>
  );
}

function EmptyState({
  onSuggestionClick,
}: {
  onSuggestionClick?: (text: string) => void;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 2rem 2rem",
        gap: "1.5rem",
      }}
    >
      <SVGIcon
        name="sparkles"
        size={40}
        style={{ color: "var(--color-text-secondary)" }}
      />

      <div style={{ textAlign: "center" }}>
        <h2
          style={{
            fontSize: "var(--font-size-xl)",
            fontWeight: "var(--font-weight-bold)",
            color: "var(--color-primary)",
            marginBottom: "0.625rem",
            letterSpacing: "-0.01em",
          }}
        >
          Start Your Learning Journey
        </h2>
        <p>
          Ask me anything about your study materials. I'll help you understand
          complex concepts through personalized explanations.
        </p>
      </div>

      <p
        style={{
          fontSize: "var(--font-size-xs)",
          color: "var(--color-text-muted)",
          fontWeight: "var(--font-weight-medium)",
        }}
      >
        Try asking:
      </p>

      <div className="grid grid-cols-2 gap-4">
        {SUGGESTIONS.map((s) => (
          <SuggestionButton
            key={s.id}
            icon={s.icon}
            text={s.text}
            onClick={() => onSuggestionClick?.(s.text)}
          />
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

function ConversationHeader({ title }: { title: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 30px",
        borderBottom: "1.5px solid var(--color-border)",
        background: "var(--color-bg-card)",
      }}
    >
      <div>
        <h1
          style={{
            fontSize: "var(--font-size-md)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--color-primary)",
            lineHeight: "var(--line-height-tight)",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: "var(--font-size-xs)",
            color: "var(--color-text-secondary)",
            marginTop: "0.125rem",
          }}
        >
          AI Tutor Conversation
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
        <Button variant="outline" size="sm">
          + New
        </Button>
        <Button
          variant="outline-accent"
          size="sm"
          leftIcon={<SVGIcon name="mic" size={14} />}
        >
          Voice Mode
        </Button>
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
    <div
      style={{
        padding: "0 2rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.625rem",
      }}
    >
      {/* Action pills */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          flexWrap: "wrap" as const,
        }}
      >
        {ACTION_PILLS.map((p) => (
          <ActionPill
            key={p.id}
            icon={p.icon}
            label={p.label}
            onClick={() => onChange(value + p.label + "")}
          />
        ))}
      </div>

      {/* Textarea box */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "0.625rem",
          background: "var(--color-bg-card)",
          border: "1.5px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          padding: "0.75rem 1rem",
          boxShadow: "var(--shadow-sm)",
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
          style={{
            flex: 1,
            resize: "none",
            background: "transparent",
            outline: "none",
            border: "none",
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text)",
            lineHeight: "var(--line-height-normal)",
            overflow: "hidden",
            minHeight: "1.5rem",
            maxHeight: "7.5rem",
            fontFamily: "var(--font-sans)",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!disabled && value.trim()) onSend?.();
            }
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            paddingBottom: "2px",
          }}
        >
          <Button variant="ghost" size="icon">
            <SVGIcon name="mic" size={17} />
          </Button>
          <Button
            variant="solid"
            size="icon"
            onClick={() => {
              if (!disabled && value.trim()) onSend?.();
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: "var(--font-size-xs)",
            color: "var(--color-text-muted)",
          }}
        >
          Press Enter to send, Shift+Enter for new line
        </span>
        <span
          style={{
            fontSize: "var(--font-size-xs)",
            color:
              value.length > MAX * 0.9
                ? "var(--color-warning)"
                : "var(--color-text-muted)",
          }}
        >
          {value.length}/{MAX}
        </span>
      </div>
    </div>
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
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {msg.content}
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
        padding: "0.25rem 2rem",
      }}
    >
      <div
        style={{
          padding: "0.65rem 1rem",
          borderRadius: "1rem 1rem 1rem 0.25rem",
          background: "var(--color-bg-card)",
          border: "1.5px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          gap: "0.3rem",
        }}
      >
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
  const bottomRef = useRef<HTMLDivElement>(null);

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

    try {
      const res = await fetch(CHAT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, userId, vaultId }),
      });

      let replyText = "Sorry, I couldn't get a response.";
      if (res.ok) {
        const contentType = res.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          const data = await res.json();
          replyText =
            data?.output ??
            data?.message ??
            data?.text ??
            data?.reply ??
            data?.response ??
            (typeof data === "string" ? data : JSON.stringify(data));
        } else {
          replyText = await res.text();
        }
      }

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: replyText,
        timestamp: new Date(),
      };
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
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        background: "var(--color-bg)",
      }}
    >
      {conversationTitle && <ConversationHeader title={conversationTitle} />}

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingTop: "1rem",
          paddingBottom: "0.5rem",
        }}
      >
        {messages.length === 0 ? (
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

function SidebarMaterialCard({
  material,
  isLarge,
}: {
  material: Material;
  isLarge?: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--color-bg-card)",
        border: "1.5px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        cursor: "pointer",
        transition:
          "box-shadow var(--transition-fast), transform var(--transition-fast)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "var(--shadow-md)";
        (e.currentTarget as HTMLDivElement).style.transform =
          "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
    >
      <div style={{ height: isLarge ? "130px" : "88px", overflow: "hidden" }}>
        <img
          src={material.thumbnail}
          alt={material.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>
      <div style={{ padding: "0.625rem 0.75rem 0.75rem" }}>
        <p className="text-[12px]">
          <span style={{ fontSize: "var(--font-size-xs)", flexShrink: 0 }}>
            📄
          </span>
          {material.title}
        </p>
        <p
          style={{
            fontSize: "var(--font-size-xs)",
            color: "var(--color-text-muted)",
            marginTop: "0.125rem",
          }}
        >
          {material.subtitle}
        </p>
      </div>
    </div>
  );
}

function SidebarSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: "var(--font-size-xs)",
        fontWeight: "var(--font-weight-semibold)",
        color: "var(--color-text-muted)",
        textTransform: "uppercase" as const,
        letterSpacing: "0.07em",
        marginBottom: "0.625rem",
      }}
    >
      {children}
    </p>
  );
}

const VAULT_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#14b8a6",
];

function VaultCard(props: {
  vault: Serialised<IVaultSchema>;
  selected: boolean;
  onClick: () => void;
}) {
  const { vault, selected, onClick } = props;
  const color = VAULT_COLORS[vault.name.charCodeAt(0) % VAULT_COLORS.length];
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
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform =
          "translateY(-1px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "var(--shadow-md)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = selected
          ? `0 0 0 2px ${color}22`
          : "none";
      }}
    >
      {/* Colour accent bar */}
      <div style={{ height: 6, background: color }} />
      <div
        style={{
          padding: "0.625rem 0.75rem 0.75rem",
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: "var(--font-weight-bold)",
            fontSize: "var(--font-size-sm)",
            flexShrink: 0,
          }}
        >
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

function StudyMaterialsSidebar(props: {
  vaults: Serialised<IVaultSchema>[];
  selectedVaultId: string | null;
  onSelectVault: (id: string) => void;
}) {
  const { vaults, selectedVaultId, onSelectVault } = props;
  return (
    <aside
      style={{
        width: "300px",
        minWidth: "280px",
        maxWidth: "320px",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-bg-card)",
        borderLeft: "1.5px solid var(--color-border)",
      }}
    >
      {/* Header */}
      <div className="p-4.75 border-b border-gray-300">
        <h3
          style={{
            fontSize: "var(--font-size-base)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--color-primary)",
          }}
        >
          Study Materials
        </h3>
        <p className="text-gray-400 text-[12px]">
          Select a vault to link this chat
        </p>
      </div>

      {/* Scrollable content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1.125rem 1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        {vaults.length === 0 ? (
          <p className="flex items-center justify-center text-center text-gray-400 text-[12px] h-full">
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

      {/* Browse Vault */}
      <div
        style={{
          padding: "0.875rem 1.25rem",
          borderTop: "1.5px solid var(--color-border)",
        }}
      >
        <Button
          variant="muted"
          size="sm"
          fullWidth
          className="rounded-md py-2.5"
          leftIcon={<SVGIcon name="folder" size={26} />}
        >
          Browse Vault
        </Button>
      </div>
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--color-bg)",
      }}
    >
      <Navbar />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
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
    </div>
  );
}

export default AiTutor;
