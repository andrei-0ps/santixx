import { useEffect, useState } from "react";
import { LogIn, Mail, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getAuthRedirectUrl } from "@/lib/authRedirect";
import type { AuthNotice } from "@/components/auth/AuthProvider";
import { useLanguage } from "@/lib/useLanguage";

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  authNotice?: AuthNotice;
  onClearAuthNotice?: () => void;
  passwordRecovery?: boolean;
  onClearPasswordRecovery?: () => void;
}

type AuthMode = "login" | "register" | "reset" | "updatePassword";

export function AuthDialog({
  open,
  onClose,
  authNotice,
  onClearAuthNotice,
  passwordRecovery,
  onClearPasswordRecovery,
}: AuthDialogProps) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function getFriendlyAuthError(message: string) {
    const normalized = message.toLowerCase();
    if (normalized.includes("email rate limit")) return t.auth_err_too_many;
    if (normalized.includes("invalid login credentials")) return t.auth_err_invalid;
    if (normalized.includes("email not confirmed")) return t.auth_err_not_confirmed;
    if (normalized.includes("user already registered") || normalized.includes("already registered"))
      return t.auth_err_exists;
    return message;
  }

  useEffect(() => {
    if (!open || !authNotice) return;
    if (authNotice.type === "error") {
      setError(authNotice.message);
      setMessage(null);
    } else {
      setMessage(authNotice.message);
      setError(null);
    }
    onClearAuthNotice?.();
  }, [authNotice, onClearAuthNotice, open]);

  useEffect(() => {
    if (open && passwordRecovery) {
      setMode("updatePassword");
      setError(null);
      setMessage(null);
      setPassword("");
      setConfirmPassword("");
    }
  }, [open, passwordRecovery]);

  if (!open) return null;

  const title =
    mode === "login"
      ? t.auth_login_title
      : mode === "register"
        ? t.auth_register_title
        : mode === "reset"
          ? t.auth_reset_title
          : t.auth_new_pass_title;

  const submitLabel =
    mode === "login"
      ? t.auth_login_email
      : mode === "register"
        ? t.auth_register_title
        : mode === "reset"
          ? t.auth_send_reset
          : t.auth_save_pass;

  const helperText =
    mode === "login"
      ? t.auth_login_subtitle
      : mode === "register"
        ? t.auth_register_subtitle
        : mode === "reset"
          ? t.auth_reset_subtitle
          : t.auth_new_pass_subtitle;

  const handleClose = () => {
    onClearPasswordRecovery?.();
    onClose();
  };

  const getCleanEmail = () => email.trim().toLowerCase();

  const checkEmailExists = async (cleanEmail: string) => {
    const { data, error: rpcError } = await supabase.rpc("auth_email_exists", {
      p_email: cleanEmail,
    });
    if (rpcError) {
      console.warn("auth_email_exists nu este disponibil încă în Supabase:", rpcError.message);
      return null;
    }
    return data === true;
  };

  const validateEmailForMode = async (cleanEmail: string) => {
    if (!cleanEmail) throw new Error(t.auth_err_no_email);
    const exists = await checkEmailExists(cleanEmail);
    if (exists === null) return;
    if (mode === "login" && !exists) throw new Error(t.auth_err_no_account);
    if (mode === "register" && exists) throw new Error(t.auth_err_exists);
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      window.localStorage.setItem("santix_oauth_intent", mode);
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getAuthRedirectUrl(),
          queryParams: { prompt: "select_account" },
        },
      });
      if (googleError) {
        setError(getFriendlyAuthError(googleError.message));
        setLoading(false);
      }
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : t.auth_err_google);
      setLoading(false);
    }
  };

  const handleEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const cleanEmail = getCleanEmail();

      if (mode === "updatePassword") {
        if (password.length < 6) throw new Error(t.auth_err_short_pass);
        if (password !== confirmPassword) throw new Error(t.auth_err_pass_mismatch);

        const { error: updateError } = await supabase.auth.updateUser({ password });
        setLoading(false);
        if (updateError) { setError(getFriendlyAuthError(updateError.message)); return; }

        onClearPasswordRecovery?.();
        setPassword("");
        setConfirmPassword("");
        onClose();
        return;
      }

      if (mode === "reset") {
        if (!cleanEmail) throw new Error(t.auth_err_enter_email);

        const exists = await checkEmailExists(cleanEmail);
        if (exists === false) throw new Error(t.auth_err_no_account_reset);

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: getAuthRedirectUrl(),
        });
        setLoading(false);
        if (resetError) { setError(getFriendlyAuthError(resetError.message)); return; }

        setMessage(t.auth_success_reset_sent);
        return;
      }

      await validateEmailForMode(cleanEmail);

      const credentials = { email: cleanEmail, password };
      const response =
        mode === "login"
          ? await supabase.auth.signInWithPassword(credentials)
          : await supabase.auth.signUp({
              ...credentials,
              options: { emailRedirectTo: getAuthRedirectUrl() },
            });

      setLoading(false);
      if (response.error) { setError(getFriendlyAuthError(response.error.message)); return; }

      if (mode === "register" && !response.data.session) {
        setMessage(t.auth_success_registered);
        return;
      }

      onClose();
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : t.auth_err_generic);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="glass-strong w-full max-w-[420px] rounded-3xl p-5 shadow-[var(--shadow-float)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{helperText}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label={t.auth_close}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-muted text-muted-foreground transition-colors hover:border-primary/35 hover:bg-primary/10 hover:text-primary"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          {mode !== "updatePassword" && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{t.auth_email}</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                className="h-11 w-full rounded-2xl border border-primary/25 bg-background/45 px-3.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/55 focus:ring-2 focus:ring-primary/20"
              />
            </label>
          )}

          {(mode === "login" || mode === "register") && (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-primary/25 bg-background/35 text-sm font-semibold text-foreground transition-all hover:border-primary/45 hover:bg-primary/[0.08] hover:shadow-[0_0_28px_rgba(0,242,254,0.14)] disabled:opacity-60"
              >
                <LogIn className="size-4 text-primary" />
                {t.auth_google}
              </button>

              <div className="flex items-center gap-3 py-1">
                <span className="h-px flex-1 bg-primary/10" />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{t.auth_or}</span>
                <span className="h-px flex-1 bg-primary/10" />
              </div>
            </>
          )}

          {mode !== "reset" && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                {mode === "updatePassword" ? t.auth_new_pass : t.auth_pass}
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="h-11 w-full rounded-2xl border border-primary/25 bg-background/45 px-3.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/55 focus:ring-2 focus:ring-primary/20"
              />
            </label>
          )}

          {mode === "updatePassword" && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{t.auth_confirm_pass}</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="h-11 w-full rounded-2xl border border-primary/25 bg-background/45 px-3.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/55 focus:ring-2 focus:ring-primary/20"
              />
            </label>
          )}

          {error && (
            <p className="rounded-2xl border border-destructive/25 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
              {error}
            </p>
          )}

          {message && (
            <p className="rounded-2xl border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-primary to-accent text-sm font-semibold text-primary-foreground shadow-[0_10px_28px_-14px_rgba(0,242,254,0.8)] transition-all hover:-translate-y-[1px] hover:shadow-[0_0_30px_rgba(0,242,254,0.25)] disabled:translate-y-0 disabled:opacity-60"
          >
            <Mail className="size-4" />
            {loading ? t.auth_processing : submitLabel}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
            setMessage(null);
          }}
          className={mode === "updatePassword" ? "hidden" : "mt-4 w-full text-center text-xs font-semibold text-primary hover:underline"}
        >
          {mode === "login"
            ? t.auth_no_account
            : mode === "register"
              ? t.auth_have_account
              : t.auth_have_account}
        </button>

        {mode === "login" && (
          <button
            type="button"
            onClick={() => { setMode("reset"); setError(null); setMessage(null); }}
            className="mt-3 w-full text-center text-xs font-semibold text-muted-foreground transition-colors hover:text-primary hover:underline"
          >
            {t.auth_forgot_pass}
          </button>
        )}
      </div>
    </div>
  );
}
