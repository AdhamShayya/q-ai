import React from "react";
import { Link, useLocation } from "react-router";

function NavLink({
  label,
  icon,
  href,
}: {
  label: string;
  icon: string;
  href: string;
}) {
  const { pathname } = useLocation();
  const active =
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link
      to={href}
      className={`no-underline inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium transition-colors border-b-2 ${
        active
          ? "text-accent border-accent"
          : "text-text-secondary border-transparent hover:text-text"
      }`}
    >
      <span>{icon}</span>
      {label}
    </Link>
  );
}

function Navbar() {
  return (
    <nav className="bg-bg-card border-b-[1.5px] border-border">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5"
          style={{ textDecoration: "none" }}
        >
          <div className="w-9.5 h-9.5 rounded-full bg-primary flex items-center justify-center text-white font-bold font-serif tracking-tight">
            Q
          </div>
          <span className="font-bold text-lg text-primary tracking-tight">
            Q-Ai
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <NavLink label="Dashboard" icon="🗂️" href="/" />
          <NavLink label="AI Tutor" icon="💬" href="/ai-tutor" />
          <NavLink label="Voice Study" icon="🎙️" href="/voice-study" />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
