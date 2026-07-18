import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/useLanguage";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackRoute,
});

function AuthCallbackRoute() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    let cancelled = false;

    async function finishAuth() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (!cancelled) setError(exchangeError.message);
          return;
        }
      } else {
        const { error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          if (!cancelled) setError(sessionError.message);
          return;
        }
      }

      if (!cancelled) {
        await navigate({ to: "/explorator", replace: true });
      }
    }

    void finishAuth();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="glass max-w-md rounded-3xl p-8 text-center">
        <h1 className="text-2xl font-black">{t.auth_callback_title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{t.auth_callback_desc}</p>

        {error && (
          <div className="mt-5 rounded-2xl border border-destructive/25 bg-destructive/10 p-4 text-left text-sm font-semibold text-destructive">
            {error}
          </div>
        )}

        {error && (
          <Link
            to="/explorator"
            className="mt-5 inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
          >
            {t.auth_callback_back}
          </Link>
        )}
      </div>
    </div>
  );
}
