import React, { useRef, useState } from "react";
import Navbar from "../../components/Navbar";
import SVGIcon from "../../components/SVGIcon";
import Button from "../../components/Button";

// ── Types ────────────────────────────────────────────────────────────────────

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

// ── Mock data ────────────────────────────────────────────────────────────────

const CURRENT_MATERIAL: Material = {
  id: 1,
  title: "Introduction to Quantum Mecha...",
  subtitle: "PDF Document • 45 pages",
  thumbnail:
    "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=80",
};

const RELATED_MATERIALS: Material[] = [
  {
    id: 2,
    title: "Organic Chemistry Lecture 5",
    subtitle: "Feb 4",
    thumbnail:
      "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&q=80",
  },
  {
    id: 3,
    title: "Statistical Analysis Methods",
    subtitle: "Feb 3",
    thumbnail:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80",
  },
];

const ICON_STYLE_SUGGESTION = {
  flexShrink: 0 as const,
  color: "var(--color-text-muted)",
};
const ICON_STYLE_PILL = { flexShrink: 0 as const };

const SUGGESTIONS: Suggestion[] = [
  {
    id: 1,
    icon: <SVGIcon name="book" style={ICON_STYLE_SUGGESTION} />,
    text: "Explain the main concepts from this chapter",
  },
  {
    id: 2,
    icon: <SVGIcon name="key" style={ICON_STYLE_SUGGESTION} />,
    text: "What are the key takeaways I should remember?",
  },
  {
    id: 3,
    icon: <SVGIcon name="list" style={ICON_STYLE_SUGGESTION} />,
    text: "Can you break down this topic step by step?",
  },
  {
    id: 4,
    icon: <SVGIcon name="globe" style={ICON_STYLE_SUGGESTION} />,
    text: "Help me understand this with real-world examples",
  },
];

const ACTION_PILLS: ActionPillData[] = [
  {
    id: 1,
    icon: <SVGIcon name="lightbulb" style={ICON_STYLE_PILL} />,
    label: "Explain Concept",
  },
  {
    id: 2,
    icon: <SVGIcon name="list" size={14} style={ICON_STYLE_PILL} />,
    label: "Show Examples",
  },
  {
    id: 3,
    icon: <SVGIcon name="analogy-cycle" style={ICON_STYLE_PILL} />,
    label: "Use Analogy",
  },
  {
    id: 4,
    icon: <SVGIcon name="file" style={ICON_STYLE_PILL} />,
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

      <div className="flex items-center gap-3 mt-4">
        <span className="flex items-center gap-1.5 text-xs text-muted">
          🔒 Privacy Protected
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          🎓 Academic Integrity
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
        padding: "0.875rem 2rem",
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

function ChatInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
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
            onClick={() => onChange(value + p.label + " ")}
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
            style={
              !value.trim()
                ? { background: "var(--color-text-muted)", cursor: "default" }
                : undefined
            }
          >
            <SVGIcon name="send" />
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

function ChatArea({ conversationTitle }: { conversationTitle?: string }) {
  const [message, setMessage] = useState("");

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
      <EmptyState onSuggestionClick={(text) => setMessage(text)} />
      <ChatInput value={message} onChange={setMessage} />
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
        <p
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            fontSize: "var(--font-size-sm)",
            fontWeight: "var(--font-weight-medium)",
            color: "var(--color-text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
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

function StudyMaterialsSidebar() {
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
      <div
        style={{
          padding: "1rem 1.25rem",
          borderBottom: "1.5px solid var(--color-border)",
        }}
      >
        <h3
          style={{
            fontSize: "var(--font-size-base)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--color-primary)",
          }}
        >
          Study Materials
        </h3>
      </div>

      {/* Scrollable content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1.125rem 1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <div>
          <SidebarSectionLabel>Current Material</SidebarSectionLabel>
          <SidebarMaterialCard material={CURRENT_MATERIAL} isLarge />
        </div>

        <div>
          <SidebarSectionLabel>Related Materials</SidebarSectionLabel>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            {RELATED_MATERIALS.map((m) => (
              <SidebarMaterialCard key={m.id} material={m} />
            ))}
          </div>
        </div>
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
          leftIcon={<SVGIcon name="folder" />}
        >
          Browse Vault
        </Button>
      </div>
    </aside>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

function AiTutor() {
  const conversationTitle = "Introduction to Quantum Mechanics";

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
        <ChatArea conversationTitle={conversationTitle} />
        <StudyMaterialsSidebar />
      </div>
    </div>
  );
}

export default AiTutor;
