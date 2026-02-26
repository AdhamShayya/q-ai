import React, { useRef } from "react";
import Navbar from "../components/Navbar";
import SVGIcon from "../components/SVGIcon";

// ── Mock data ───────────────────────────────────────────────────────────────

const MOCK_MATERIALS = [
  {
    id: 1,
    type: "PDF",
    title: "Quantum Physics Lecture Notes",
    thumbnail:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80",
  },
  {
    id: 2,
    type: "DOCUMENT",
    title: "Chemistry Lab Report",
    thumbnail:
      "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&q=80",
  },
];

const USAGE = {
  plan: "Free Plan",
  studyMaterials: { used: 4, max: 5 },
  aiConversations: { used: 7, max: 10 },
};

// ── Sub-components ──────────────────────────────────────────────────────────

function FileBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-start gap-1 font-medium">
      <p>{icon}</p>
      {label}
    </div>
  );
}

function UploadDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="bg-bg-card border-[1.5px] border-dashed border-border rounded-xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-colors hover:border-accent hover:bg-bg-hover"
      onDragOver={(e) => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        hidden
        accept=".pdf,.docx,.mp4"
        multiple
      />

      <SVGIcon name="upload" />
      <div className="text-center">
        <h3 className="text-xl font-bold text-primary mb-1.5">
          What are we mastering today?
        </h3>
        <p className="text-sm text-text-secondary max-w-[38ch] mx-auto">
          Drag and drop your PDFs, documents, or lecture videos here, or click
          to browse
        </p>
      </div>

      <div className="flex items-center justify-center gap-4">
        <FileBadge icon="📄" label="PDF" />
        <FileBadge icon="📝" label="DOCX" />
        <FileBadge icon="🎬" label="MP4" />
        <span className="pl-3 border-l border-border">Max 500 MB</span>
      </div>

      <button
        className="bg-primary text-white rounded-full px-7 py-2.5 text-sm font-semibold hover:bg-primary-hover transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          inputRef.current?.click();
        }}
      >
        Choose Files
      </button>
    </div>
  );
}

function MaterialCard({ material }: { material: (typeof MOCK_MATERIALS)[0] }) {
  return (
    <div className="bg-bg-card border-[1.5px] border-border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="h-[180px] overflow-hidden relative">
        <img
          src={material.thumbnail}
          alt={material.title}
          className="w-full h-full object-cover"
        />
        <span className="absolute top-2.5 right-2.5 bg-white/90 text-primary text-xs font-semibold px-2 py-0.5 rounded-sm flex items-center gap-1">
          {material.type === "PDF" ? "📄" : "📝"} {material.type}
        </span>
      </div>
      <div className="px-4 py-3">
        <p className="text-sm font-medium text-text leading-snug">
          {material.title}
        </p>
      </div>
    </div>
  );
}

function ProgressBar({ used, max }: { used: number; max: number }) {
  const pct = Math.round((used / max) * 100);
  return (
    <div className="h-2 bg-bg-muted rounded-full overflow-hidden">
      <div
        className="h-full bg-accent rounded-full transition-[width] duration-[600ms]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function UsageMetrics() {
  const items = [
    { label: "Study Materials", ...USAGE.studyMaterials },
    { label: "AI Conversations", ...USAGE.aiConversations },
  ];

  return (
    <div className="bg-bg-card border-[1.5px] border-border rounded-lg p-5 min-w-[220px]">
      <div className="flex justify-between items-center mb-4">
        <h6 className="text-sm font-bold text-primary">Usage Metrics</h6>
        <span className="bg-bg-muted text-text-secondary text-xs font-medium px-2.5 py-0.5 rounded-full border border-border">
          {USAGE.plan}
        </span>
      </div>

      {items.map(({ label, used, max }) => (
        <div key={label} className="mb-3.5 last:mb-0">
          <div className="flex justify-between mb-1.5">
            <span className="text-xs text-text-secondary">{label}</span>
            <span className="text-xs text-text-secondary">
              {used} / {max}
            </span>
          </div>
          <ProgressBar used={used} max={max} />
        </div>
      ))}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

function HomePage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto w-full px-6 py-10">
        <p className="text-sm text-text-secondary pt-10 mb-6">
          Your personal library of study materials, powered by AI
        </p>

        <div className="mb-10 py-10">
          <UploadDropzone />
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-8 items-start">
          <div>
            <h5 className="text-lg font-bold text-primary mb-4">
              Your Materials ({MOCK_MATERIALS.length})
            </h5>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
              {MOCK_MATERIALS.map((m) => (
                <MaterialCard key={m.id} material={m} />
              ))}
            </div>
          </div>

          <UsageMetrics />
        </div>
      </main>
    </div>
  );
}

export default HomePage;
