import React from "react";
import { Link } from "react-router";

function Footer() {
  return (
    <footer
      className="py-8 mt-auto"
      style={{ borderTop: "1px solid var(--color-border)" }}
    >
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white font-bold font-serif text-sm">
            Q
          </div>
          <span className="font-semibold text-sm">Q-Ai</span>
        </div>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {new Date().getFullYear()} Q-Ai. Building smarter learners.
        </p>
        <div className="flex items-center gap-5">
          <Link
            to="/features"
            className="text-xs hover:underline"
            style={{
              color: "var(--color-text-secondary)",
              textDecoration: "none",
            }}
          >
            Features
          </Link>
          <Link
            to="/about"
            className="text-xs hover:underline"
            style={{
              color: "var(--color-text-secondary)",
              textDecoration: "none",
            }}
          >
            About
          </Link>
          <Link
            to="/contact"
            className="text-xs hover:underline"
            style={{
              color: "var(--color-text-secondary)",
              textDecoration: "none",
            }}
          >
            Contact
          </Link>
          <Link
            to="/sign-in"
            className="text-xs hover:underline"
            style={{
              color: "var(--color-text-secondary)",
              textDecoration: "none",
            }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
