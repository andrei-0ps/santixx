import { Link, useLocation } from "@tanstack/react-router";
import { LogOut, Menu, UserCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { TextSizeToggle } from "./TextSizeToggle";
import { useLanguage } from "@/lib/useLanguage";

export function Header({ onOpenMenu }: { onOpenMenu?: () => void } = {}) {
  const location = useLocation();
  const { user, loading, authNotice, clearAuthNotice, passwordRecovery, clearPasswordRecovery } =
    useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const { t } = useLanguage();

  const links = useMemo(
    () => [
      { to: "/explorator" as const, label: t.nav_explorator },
      { to: "/glosar" as const, label: t.nav_ghid },
      { to: "/quiz" as const, label: t.nav_quiz },
      { to: "/optica" as const, label: t.sidebar_optica },
    ],
    [t],
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      <header className="glass glass-highlight fade-up mx-3 mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 rounded-3xl px-3 py-2.5 lg:mx-4 lg:mt-4 lg:flex-nowrap lg:gap-4 lg:px-5 lg:py-3">
        {/* Sub lg, navigarea laterală (onboarding + istoric AI) se deschide de aici. */}
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label={t.nav_open_menu}
          className="flex size-9 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-white/[0.04] text-foreground transition-all hover:border-primary/35 hover:bg-primary/10 lg:hidden"
        >
          <Menu className="size-4 text-primary" />
        </button>
        <Link to="/" aria-label="Santix" className="shrink-0">
          <span className="group flex items-center rounded-2xl border border-primary/10 bg-white/[0.035] px-3 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/[0.06] lg:px-4 lg:py-2.5">
            <span className="text-sm font-black tracking-[0.12em] text-foreground transition-colors group-hover:text-primary">
              San<span className="text-primary">tix</span>
            </span>
          </span>
        </Link>
        {/* Sub lg nav-ul primește un rând întreg și derulează orizontal, ca toate
            cele patru module să rămână accesibile pe ecran îngust. */}
        <nav className="order-last flex w-full snap-x snap-mandatory items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:order-none lg:w-auto lg:snap-none lg:overflow-visible">
          {links.map(({ to, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`relative shrink-0 snap-start whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-medium tracking-tight transition-all duration-200 ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="header-active"
                    className="absolute inset-0 rounded-2xl bg-primary/10"
                    style={{ boxShadow: "inset 0 0 0 1px oklch(0.82 0.17 205 / 0.22)" }}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1 lg:gap-2">
          <TextSizeToggle />
          <LanguageToggle />
          <ThemeToggle />
          {user ? (
            <>
              <div className="hidden max-w-[220px] items-center gap-2 rounded-2xl border border-primary/15 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-foreground/85 md:flex">
                <UserCircle className="size-4 text-primary" />
                <span className="truncate">{user.email}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                aria-label={t.nav_logout}
                className="flex h-9 shrink-0 items-center gap-2 rounded-2xl border border-primary/15 bg-primary/10 px-2.5 text-xs font-semibold text-primary transition-all hover:border-primary/35 hover:bg-primary/15 sm:px-3"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">{t.nav_logout}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              disabled={loading}
              aria-label={t.nav_login}
              className="flex h-9 shrink-0 items-center gap-2 rounded-2xl bg-gradient-to-br from-primary to-accent px-2.5 text-xs font-semibold text-primary-foreground shadow-[0_8px_22px_-12px_rgba(0,242,254,0.85)] transition-all hover:-translate-y-[1px] hover:shadow-[0_0_28px_rgba(0,242,254,0.22)] disabled:translate-y-0 disabled:opacity-60 sm:px-4"
            >
              <UserCircle className="size-4" />
              <span className="hidden sm:inline">{t.nav_login}</span>
            </button>
          )}
        </div>
      </header>
      <AuthDialog
        open={authOpen || Boolean(authNotice) || passwordRecovery}
        onClose={() => setAuthOpen(false)}
        authNotice={authNotice}
        onClearAuthNotice={clearAuthNotice}
        passwordRecovery={passwordRecovery}
        onClearPasswordRecovery={clearPasswordRecovery}
      />
    </>
  );
}
