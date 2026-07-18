import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type AuthNotice = {
  type: "error" | "success";
  message: string;
} | null;

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  authNotice: AuthNotice;
  clearAuthNotice: () => void;
  passwordRecovery: boolean;
  clearPasswordRecovery: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const OAUTH_INTENT_KEY = "santix_oauth_intent";

function isNewSantixAccount(user: User) {
  const createdAt = Date.parse(user.created_at);
  const lastSignInAt = Date.parse(user.last_sign_in_at ?? "");

  if (!Number.isFinite(createdAt)) return false;
  if (!Number.isFinite(lastSignInAt)) return Date.now() - createdAt < 5 * 60 * 1000;

  return Math.abs(lastSignInAt - createdAt) < 90 * 1000;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authNotice, setAuthNotice] = useState<AuthNotice>(null);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  const reconcileOAuthIntent = async (nextSession: Session | null) => {
    if (typeof window === "undefined" || !nextSession?.user) return false;

    const intent = window.localStorage.getItem(OAUTH_INTENT_KEY);
    if (intent !== "login" && intent !== "register") return false;

    window.localStorage.removeItem(OAUTH_INTENT_KEY);

    const newAccount = isNewSantixAccount(nextSession.user);

    if (intent === "login" && newAccount) {
      await supabase.rpc("delete_current_new_google_user");
      await supabase.auth.signOut();
      setSession(null);
      setAuthNotice({
        type: "error",
        message: "Nu există încă un cont Santix pentru acest Google. Creează un cont mai întâi.",
      });
      return true;
    }

    if (intent === "register" && !newAccount) {
      await supabase.auth.signOut();
      setSession(null);
      setAuthNotice({
        type: "error",
        message: "Există deja un cont Santix pentru acest Google. Intră în cont.",
      });
      return true;
    }

    setAuthNotice(
      intent === "register"
        ? { type: "success", message: "Contul Santix a fost creat." }
        : null,
    );
    return false;
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(async ({ data, error }) => {
      if (!mounted) return;

      if (error || !data.user) {
        setSession(null);
        await supabase.auth.signOut({ scope: "local" });
        if (mounted) setLoading(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!mounted) return;
      const blockedByIntent = await reconcileOAuthIntent(sessionData.session);
      if (!mounted || blockedByIntent) {
        setLoading(false);
        return;
      }
      setSession(sessionData.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (event === "PASSWORD_RECOVERY") {
        setPasswordRecovery(true);
      }

      const blockedByIntent = await reconcileOAuthIntent(nextSession);
      if (blockedByIntent) {
        setLoading(false);
        return;
      }
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      authNotice,
      clearAuthNotice: () => setAuthNotice(null),
      passwordRecovery,
      clearPasswordRecovery: () => setPasswordRecovery(false),
    }),
    [authNotice, loading, passwordRecovery, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth trebuie folosit în AuthProvider.");
  }
  return value;
}
