export interface AuthSession {
  role: "admin" | "therapist" | "parent";
  userId: string;
  displayName: string;
  childId?: string;
  familyMemberId?: string;
}

const SESSION_STORAGE_KEY = "playground-life.session.v1";

function isDemoSessionStorageEnabled() {
  return import.meta.env.DEV || import.meta.env.MODE === "test" || import.meta.env.VITE_ENABLE_DEMO_STORAGE === "true";
}

export function hashSecret(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `h${(hash >>> 0).toString(16)}`;
}

export function verifySecret(hash: string, value: string) {
  return hash === hashSecret(value);
}

export function loadSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  if (!isDemoSessionStorageEnabled()) return null;

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession | null) {
  if (typeof window === "undefined") return;
  if (!isDemoSessionStorageEnabled()) return;

  if (!session) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}
