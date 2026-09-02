const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

function assertConfig() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.");
  }
}

export type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> };
};

export type Profile = { id: string; full_name: string | null; role: string; created_at: string };
export type Gym = { id: string; name: string; owner_id: string; created_at: string };
export type GymMember = { id: string; gym_id: string; user_id: string | null; full_name: string; email: string | null; phone: string | null; qr_token: string; status: string; created_at: string };
export type Membership = { id: string; gym_id: string; member_id: string; plan_name: string; start_date: string; end_date: string; price: number; status: string; created_at: string };
export type Payment = { id: string; gym_id: string; member_id: string; amount: number; method: string | null; reference: string | null; status: string; paid_at: string };
export type Attendance = { id: string; gym_id: string; member_id: string; check_in: string; check_out: string | null; method: string; created_at: string };

const SESSION_KEY = "gymos-supabase-session";

function normalizeSession(session: SupabaseSession): SupabaseSession {
  const expiresAt = session.expires_at ?? (
    session.expires_in ? Math.floor(Date.now() / 1000) + session.expires_in : undefined
  );
  return expiresAt ? { ...session, expires_at: expiresAt } : session;
}

function readSession(): SupabaseSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? normalizeSession(JSON.parse(raw) as SupabaseSession) : null;
  } catch {
    return null;
  }
}

function saveSession(session: SupabaseSession | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(normalizeSession(session)));
  else localStorage.removeItem(SESSION_KEY);
}

async function authRequest(path: string, init: RequestInit = {}) {
  assertConfig();
  const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.msg || body?.message || body?.error_description || "Authentication request failed");
  }
  return body;
}

export async function signIn(email: string, password: string) {
  const session = await authRequest("token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  saveSession(session as SupabaseSession);
  return session as SupabaseSession;
}

export async function signUp(email: string, password: string, fullName: string) {
  const result = await authRequest("signup", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      data: { full_name: fullName, role: "owner" },
    }),
  });

  // Supabase may return an active session when email confirmation is disabled.
  // Persist it so the caller can immediately enter the dashboard.
  if (result?.access_token) saveSession(result as SupabaseSession);
  return result;
}

export async function signOut() {
  const session = readSession();
  if (session?.access_token) {
    assertConfig();
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${session.access_token}` },
    }).catch(() => undefined);
  }
  saveSession(null);
}

export async function getSession(): Promise<SupabaseSession | null> {
  const session = readSession();
  if (!session) return null;

  const expiresAt = session.expires_at;
  if (expiresAt && expiresAt * 1000 > Date.now() + 30_000) return session;

  try {
    const refreshed = await authRequest("token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    saveSession(refreshed as SupabaseSession);
    return refreshed as SupabaseSession;
  } catch {
    saveSession(null);
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  assertConfig();
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${session.access_token}` },
  });
  if (!response.ok) return null;
  return await response.json();
}

export async function api<T>(table: string, query = "", init: RequestInit = {}): Promise<T> {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");
  assertConfig();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Supabase request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export function currentSession() {
  return readSession();
}
