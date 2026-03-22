import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { userApi } from "../trpc";
import SVGIcon from "./SVGIcon";
import { useThemeStore } from "../store/theme";

interface NavbarProps {
  user?: { name: string } | null;
}

type NavLinkItem = { label: string; href: string };

function NavLink({
  label,
  href,
  onClick,
}: NavLinkItem & { onClick?: () => void }) {
  const { pathname } = useLocation();
  const active =
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link
      to={href}
      onClick={onClick}
      className={`no-underline transition-colors text-sm font-medium border-b-2 pb-0.5 ${
        active
          ? "text-info border-info"
          : "text-text-secondary border-transparent hover:text-text"
      }`}
    >
      {label}
    </Link>
  );
}

function Header({ user = null }: NavbarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const { isDark, toggle } = useThemeStore();

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    await userApi.signOut.mutate();
    navigate("/sign-in");
  }

  const publicLinks: NavLinkItem[] = [
    { label: "Home", href: "/" },
    { label: "Features", href: "/features" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  const authLinks: NavLinkItem[] = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "AI Tutor", href: "/ai-tutor" },
    { label: "Settings", href: "/settings" },
  ];

  const allLinks = user ? [...publicLinks, ...authLinks] : publicLinks;

  return (
    <nav
      className="animate-slide-down border-b border-border bg-bg/80 sticky top-0 z-50"
      style={{ backdropFilter: "blur(12px)" }}
    >
      {/* ── Desktop / main bar ── */}
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 shrink-0"
          style={{ textDecoration: "none" }}
        >
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold font-serif tracking-tight">
            Q
          </div>
          <span className="font-bold text-lg text-primary tracking-tight">
            Q-Ai
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-7 h-full">
          {allLinks.map((l) => (
            <NavLink key={l.href} {...l} />
          ))}
        </div>

        {/* Desktop auth slot + mobile hamburger row */}
        <div className="flex items-center gap-3">
          {/* Theme toggle — always visible */}
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="p-1.5 rounded-lg border border-border bg-transparent cursor-pointer transition-colors hover:bg-bg-hover"
          >
            <SVGIcon
              name={isDark ? "sun" : "moon"}
              size={17}
              style={{ color: "var(--color-text-secondary)" }}
            />
          </button>
          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {user != null ? (
              <>
                <div className="w-8 h-8 rounded-full bg-info flex items-center justify-center text-white text-sm font-semibold select-none">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-text max-w-35 truncate">
                  {user.name}
                </span>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 rounded-lg text-text-secondary hover:text-primary transition-colors cursor-pointer bg-transparent border-0"
                  aria-label="Sign out"
                >
                  <SVGIcon name="logout" size={18} />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/sign-in"
                  className="text-sm font-medium text-text-secondary hover:text-text transition-colors border border-border hover:border-border-focus rounded-lg px-4 py-1.5"
                  style={{ textDecoration: "none" }}
                >
                  Sign In
                </Link>
                <Link
                  to="/sign-up"
                  className="text-sm font-semibold rounded-lg px-4 py-1.5 transition-all duration-200 hover:opacity-90"
                  style={{
                    background: "var(--color-primary)",
                    color: "#fff",
                    textDecoration: "none",
                  }}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <div
            className="md:hidden p-2 flex items-center justify-center rounded-md border border-border bg-bg-card transition-colors hover:bg-bg-hover"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            <SVGIcon name={open ? "x" : "menu"} size={16} strokeWidth={2} />
          </div>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {open && (
        <div
          className="md:hidden border-t border-border bg-bg/95 px-4 pb-5 pt-4 flex flex-col gap-1"
          style={{ backdropFilter: "blur(12px)" }}
        >
          {allLinks.map((l) => (
            <NavLink key={l.href} {...l} onClick={() => setOpen(false)} />
          ))}

          <div className="h-px bg-border my-3" />

          {user != null ? (
            <div className="flex items-center gap-3 pt-1">
              <div className="w-8 h-8 rounded-full bg-info flex items-center justify-center text-white text-sm font-semibold select-none shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-text flex-1 truncate">
                {user.name}
              </span>
              <button
                onClick={handleSignOut}
                className="p-1.5 rounded-lg text-text-secondary hover:text-primary transition-colors cursor-pointer bg-transparent border-0"
                aria-label="Sign out"
              >
                <SVGIcon name="logout" size={18} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-1">
              <Link
                to="/sign-in"
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-center py-2.5 rounded-xl border border-border text-text no-underline transition-colors hover:bg-bg-hover"
              >
                Sign In
              </Link>
              <Link
                to="/sign-up"
                onClick={() => setOpen(false)}
                className="text-sm font-semibold text-center py-2.5 rounded-xl text-white no-underline transition-all hover:opacity-90"
                style={{ background: "var(--color-primary)" }}
              >
                Get Started Free
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

export default Header;
