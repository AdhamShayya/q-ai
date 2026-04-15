import React from "react";
import { Link } from "react-router";

function MCQPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-4 text-center">
      {/* Icon */}
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--ai-accent) 18%, transparent), color-mix(in srgb, var(--color-info) 10%, transparent))",
          border:
            "1.5px solid color-mix(in srgb, var(--ai-accent) 30%, transparent)",
        }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--ai-accent)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      </div>

      <div className="space-y-2">
        <h2
          className="text-2xl font-bold"
          style={{ color: "var(--color-text)" }}
        >
          MCQ Mode
        </h2>
        <p
          className="text-sm max-w-xs"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Practice with AI-generated multiple choice questions based on your
          study materials. Coming soon.
        </p>
      </div>

      <span
        className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest"
        style={{ background: "var(--ai-accent)", color: "#fff" }}
      >
        Coming Soon
      </span>

      <Link
        to="/dashboard"
        className="text-sm font-medium no-underline transition-colors"
        style={{ color: "var(--color-text-secondary)" }}
      >
        ← Back to Dashboard
      </Link>
    </main>
  );
}

export default MCQPage;
