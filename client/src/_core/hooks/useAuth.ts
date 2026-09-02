import { useCallback, useEffect, useState } from "react";
import {
  api,
  getCurrentUser,
  getSession,
  signIn as supabaseSignIn,
  signOut as supabaseSignOut,
  signUp as supabaseSignUp,
} from "@/lib/supabase";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

function mapUser(user: any, profile?: any): AuthUser {
  return {
    id: user.id,
    email: user.email || "",
    name:
      profile?.full_name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "User",
    role: profile?.role || user.user_metadata?.role || "member",
  };
}

async function loadAuthUser(): Promise<AuthUser | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await getCurrentUser();
  if (!user) return null;

  let profile: any = null;
  try {
    const rows = await api<any[]>("profiles", `?id=eq.${encodeURIComponent(user.id)}&select=id,full_name,role,created_at&limit=1`);
    profile = rows[0] || null;
  } catch {
    // Auth remains usable if profile RLS is not configured yet.
  }

  return mapUser(user, profile);
}

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      setUser(await loadAuthUser());
    } catch (err) {
      setUser(null);
      setError(err instanceof Error ? err : new Error("Unable to load session"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await supabaseSignOut();
      setUser(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unable to sign out"));
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await supabaseSignIn(email.trim(), password);
      const nextUser = await loadAuthUser();
      setUser(nextUser);
      return nextUser;
    } catch (err) {
      const authError = err instanceof Error ? err : new Error("Unable to sign in");
      setUser(null);
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseSignUp(email.trim(), password, fullName.trim());
      if (result?.access_token) {
        // Some Supabase projects allow immediate sessions after signup.
        const nextUser = await loadAuthUser();
        setUser(nextUser);
        return { user: nextUser, needsEmailConfirmation: false };
      }
      return { user: null, needsEmailConfirmation: true };
    } catch (err) {
      const authError = err instanceof Error ? err : new Error("Unable to create account");
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!redirectOnUnauthenticated || loading || user || typeof window === "undefined") return;
    if (redirectPath && window.location.pathname === redirectPath) return;
    window.location.href = redirectPath || "/login";
  }, [redirectOnUnauthenticated, redirectPath, loading, user]);

  return {
    user,
    loading,
    error,
    isAuthenticated: Boolean(user),
    refresh,
    logout,
    signIn,
    signUp,
  };
}
