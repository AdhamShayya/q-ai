import React from "react";
import { Link } from "react-router";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerText: string;
  footerLinkLabel: string;
  footerLinkHref: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

function AuthCard({
  title,
  subtitle,
  children,
  footerText,
  footerLinkLabel,
  footerLinkHref,
}: AuthCardProps) {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link
          to="/"
          className="flex flex-col items-center gap-2 mb-8 no-underline"
          style={{ textDecoration: "none" }}
        >
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white font-bold font-serif text-2xl tracking-tight shadow-md">
            Q
          </div>
          <span className="font-bold text-xl text-primary tracking-tight font-serif">
            Q-Ai
          </span>
        </Link>

        {/* Card */}
        <div className="bg-bg-card rounded-xl border border-border shadow-lg p-8">
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-text font-serif leading-tight">
              {title}
            </h1>
            <p className="text-text-secondary text-sm mt-1.5">{subtitle}</p>
          </div>

          {children}
        </div>

        {/* Footer link */}
        <p className="text-center text-sm text-text-secondary mt-5">
          {footerText}{" "}
          <Link
            to={footerLinkHref}
            className="text-accent hover:text-accent-dark font-medium transition-colors"
            style={{ textDecoration: "none" }}
          >
            {footerLinkLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default AuthCard;
