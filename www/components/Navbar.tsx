import React from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { userApi } from "../trpc";
import SVGIcon from "./SVGIcon";

interface NavbarProps {
  user?: { name: string } | null;
}
type HeaderLinkProps = {
  label: string;
  icon: string;
  href: string;
};
function HeaderLink(props: HeaderLinkProps) {
  const { label, icon, href } = props;
  const { pathname } = useLocation();
  const active =
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link
      to={href}
      className={`no-underline items-center gap-1.5 h-1/2 transition-colors border-b-2 text-sm font-medium ${
        active
          ? "text-accent border-accent"
          : "text-text-secondary border-transparent hover:text-text"
      }`}
    >
      {icon.length > 0 && <span>{icon}</span>}
      {label}
    </Link>
  );
}

function Header({ user = null }: NavbarProps) {
  const navigate = useNavigate();

  async function handleSignOut() {
    await userApi.signOut.mutate();
    navigate("/sign-in");
  }

  return (
    <nav
      className="animate-slide-down border-b border-(--secondary-color)"
      style={{ backdropFilter: "blur(8px)" }}
    >
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

        <div className="flex items-center gap-8 h-full">
          <HeaderLink label="Home" icon="" href="/" />
          <HeaderLink label="Features" icon="" href="/features" />
          <HeaderLink label="About" icon="" href="/about" />
          <HeaderLink label="Contact" icon="" href="/contact" />

          {/* Nav links — signed in */}
          {user != null && (
            <div className="flex items-center gap-10 h-full">
              <HeaderLink label="Dashboard" icon="" href="/dashboard" />
              <HeaderLink label="AI Tutor" icon="" href="/ai-tutor" />
              <HeaderLink label="Settings" icon="" href="/settings" />
            </div>
          )}
        </div>
        {/* Auth slot */}
        {user != null ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm font-semibold select-none">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-text">{user.name}</span>
            <div
              onClick={handleSignOut}
              className="p-1.5 rounded-lg text-text-secondary hover:text-(--color-primary) transition-colors cursor-pointer"
            >
              <SVGIcon name="logout" size={18} />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
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
          </div>
        )}
      </div>
    </nav>
  );
}

export default Header;
