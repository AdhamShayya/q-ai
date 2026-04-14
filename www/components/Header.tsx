import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { userApi } from "../trpc";
import SVGIcon from "./SVGIcon";
import { useThemeStore } from "../store/theme";

interface NavbarProps {
  user?: { name: string } | null;
}

type NavLinkItem = { label: string; href: string };

function NavLink(props: NavLinkItem & { onClick?: () => void }) {
  const { label, href, onClick } = props;
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

// ── App sidebar nav item ──────────────────────────────────────────────────────
function SidebarItem(props: {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  disabled?: boolean;
  badge?: string;
  onClick?: () => void;
}) {
  const { icon, label, href, active, disabled, badge, onClick } = props;
  const baseRow =
    "flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 select-none";

  if (disabled) {
    return (
      <div className={`${baseRow} opacity-40 cursor-not-allowed`}>
        <span className="shrink-0 opacity-70">{icon}</span>
        <span className="text-sm font-medium flex-1 text-text-secondary">
          {label}
        </span>
        {badge != null && (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest bg-(--ai-accent) text-white opacity-85">
            {badge}
          </span>
        )}
      </div>
    );
  }

  return (
    <Link
      to={href}
      onClick={onClick}
      className={`${baseRow} no-underline group ${
        active
          ? "bg-[linear-gradient(135deg,color-mix(in_srgb,var(--ai-accent)_14%,transparent),color-mix(in_srgb,var(--color-info)_8%,transparent))] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--ai-accent)_30%,transparent)] text-(--ai-accent)"
          : "text-text-secondary"
      }`}
    >
      <span
        className={`shrink-0 transition-transform duration-200 ${active ? "scale-110" : "group-hover:scale-110"}`}
      >
        {icon}
      </span>
      <span
        className={`text-sm font-semibold flex-1 transition-colors duration-150 ${
          active ? "" : "group-hover:text-(--color-text)"
        }`}
      >
        {label}
      </span>
      {badge != null && (
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest bg-(--ai-accent) text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}

// ── Main Header ───────────────────────────────────────────────────────────────
function Header({ user = null }: NavbarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark, toggle } = useThemeStore();

  // Close hamburger on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Lock body scroll while sidebar is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

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

  const authLinks: NavLinkItem[] = [{ label: "Settings", href: "/settings" }];

  const allLinks = user != null ? [...publicLinks, ...authLinks] : publicLinks;

  const sidebarItems = [
    {
      icon: <SVGIcon name="dashboard-grid" size={18} />,
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      icon: <SVGIcon name="chat" size={18} />,
      label: "Chat",
      href: "/ai-tutor",
    },

    {
      icon: <SVGIcon name="mcq" size={18} />,
      label: "MCQ",
      href: "/mcq",
      disabled: true,
      badge: "Soon",
    },
    {
      icon: <SVGIcon name="flashcard" size={18} />,
      label: "Flashcards",
      href: "/flashcards",
    },
    {
      icon: <SVGIcon name="study-planner" size={18} />,
      label: "Study Planner",
      href: "/study-planner",
    },
  ];

  return (
    <>
      {/* ── Sidebar backdrop ─────────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-60 bg-black/45 backdrop-blur-sm transition-opacity duration-300 ${
          sidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Sidebar panel ────────────────────────────────────────────────── */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-72 z-61 flex flex-col transition-transform duration-300 ease-out bg-bg border-r border-border ${
          sidebarOpen
            ? "translate-x-0 shadow-[8px_0_40px_rgba(0,0,0,0.18)]"
            : "-translate-x-full shadow-none"
        }`}
      >
        {/* Decorative top accent strip */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-[linear-gradient(90deg,var(--ai-accent),var(--color-info),transparent)]" />

        {/* Sidebar header row */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border mt-0.5">
          <Link
            to="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2 no-underline"
          >
            <img
              src={isDark ? "/images/logo-dark.svg" : "/images/logo-light.svg"}
              alt="Q-Ai Logo"
              className="w-8 h-8"
            />
            <span className="font-sans font-bold text-[1.05rem] tracking-[-0.03em] leading-none text-text">
              Q
              <span
                className={`font-normal mx-px ${isDark ? "text-[#7c3aed]" : "text-[#6c7d50]"}`}
              >
                ·
              </span>
              <span className="text-(--ai-accent)">Ai</span>
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg border border-border bg-transparent cursor-pointer transition-colors hover:bg-bg-hover"
            aria-label="Close sidebar"
          >
            <SVGIcon name="x" size={15} className="text-text-secondary" />
          </button>
        </div>

        {/* Nav section */}
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] px-4 pb-3 text-text-secondary opacity-50">
            Navigate
          </p>
          {sidebarItems.map((item) => (
            <SidebarItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href))
              }
              disabled={item.disabled}
              badge={item.badge}
              onClick={() => setSidebarOpen(false)}
            />
          ))}
        </div>

        {/* User card at bottom */}
        {user != null && (
          <div className="px-4 py-4 border-t border-border">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-bg-card">
              <div className="w-8 h-8 rounded-full bg-info flex items-center justify-center text-white text-sm font-bold select-none shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate leading-tight text-text">
                  {user.name}
                </p>
                <Link
                  to="/settings"
                  onClick={() => setSidebarOpen(false)}
                  className="text-[11px] no-underline hover:underline leading-tight text-text-secondary"
                >
                  Settings
                </Link>
              </div>
              <button
                onClick={handleSignOut}
                className="p-1.5 rounded-lg text-text-secondary hover:text-primary transition-colors cursor-pointer bg-transparent border-0 shrink-0"
                aria-label="Sign out"
              >
                <SVGIcon name="logout" size={16} />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* ── Main nav header ───────────────────────────────────────────────── */}
      <nav className="animate-slide-down border-b border-border bg-bg/80 sticky top-0 z-50 backdrop-blur-md">
        {/* ── Desktop / main bar ── */}
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 shrink-0 no-underline"
          >
            <img
              src={isDark ? "/images/logo-dark.svg" : "/images/logo-light.svg"}
              alt="Q-Ai Logo"
              className="w-10 h-10 block"
            />
            <span className="font-sans font-bold text-[1.15rem] tracking-[-0.03em] leading-none text-text select-none">
              Q
              <span
                className={`font-normal mx-px text-base ${isDark ? "text-[#7c3aed]" : "text-[#6c7d50]"}`}
              >
                ·
              </span>
              <span className="text-(--ai-accent)">Ai</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-7 h-full">
            {allLinks.map((l) => (
              <NavLink key={l.href} {...l} />
            ))}
          </div>

          {/* Right slot */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="p-1.5 rounded-lg border border-border bg-transparent cursor-pointer transition-colors hover:bg-bg-hover"
            >
              <SVGIcon
                name={isDark ? "sun" : "moon"}
                size={17}
                className="text-text-secondary"
              />
            </button>

            {/* App panel toggle — only when logged in */}
            {user != null && (
              <button
                onClick={() => setSidebarOpen(true)}
                aria-label="Open app panel"
                className="p-1.5 rounded-lg border border-border bg-transparent cursor-pointer transition-all duration-200 hover:bg-bg-hover"
              >
                <SVGIcon
                  name="dashboard-grid"
                  size={17}
                  strokeWidth={2}
                  className="text-text-secondary"
                />
              </button>
            )}

            {/* Desktop auth */}
            <div className="hidden md:flex items-center gap-3 ml-1">
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
                    className="text-sm font-medium text-text-secondary hover:text-text transition-colors border border-border hover:border-border-focus rounded-lg px-4 py-1.5 no-underline"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/sign-up"
                    className="text-sm font-semibold rounded-lg px-4 py-1.5 transition-all duration-200 hover:opacity-90 bg-(--color-primary) text-white no-underline"
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
          <div className="md:hidden border-t border-border bg-bg/95 px-4 pb-5 pt-4 flex flex-col gap-1 backdrop-blur-md">
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
                  className="text-sm font-semibold text-center py-2.5 rounded-xl text-white no-underline transition-all hover:opacity-90 bg-(--color-primary)"
                >
                  Get Started Free
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  );
}

export default Header;
