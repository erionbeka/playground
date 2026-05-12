import type { AuditEntry, Child, HomeworkAssignment } from "@/context/AppContext";
import type { AuthSession } from "@/lib/auth";

export interface AdminUser {
  id: string;
  clinicName: string;
  name: string;
  email: string;
  passwordHash: string;
}

export interface TherapistUser {
  id: string;
  clinicName: string;
  name: string;
  email: string;
  passwordHash: string;
}

export interface AppDataSnapshot {
  admins: AdminUser[];
  therapists: TherapistUser[];
  children: Child[];
  assignments: HomeworkAssignment[];
  auditLog: AuditEntry[];
}

const APP_DATA_STORAGE_KEY = "playground-life.backend.v2";

function isDemoStorageEnabled() {
  return import.meta.env.DEV || import.meta.env.MODE === "test" || import.meta.env.VITE_ENABLE_DEMO_STORAGE === "true";
}

export function loadAppData(defaultData: AppDataSnapshot): AppDataSnapshot {
  if (typeof window === "undefined") return defaultData;
  if (!isDemoStorageEnabled()) return defaultData;

  try {
    const raw = window.localStorage.getItem(APP_DATA_STORAGE_KEY);
    if (!raw) return defaultData;
    return { ...defaultData, ...(JSON.parse(raw) as AppDataSnapshot) };
  } catch {
    return defaultData;
  }
}

export function saveAppData(snapshot: AppDataSnapshot) {
  if (typeof window === "undefined") return;
  if (!isDemoStorageEnabled()) return;
  window.localStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(snapshot));
}

export function createAuditEntry(
  action: string,
  actor: AuthSession | null,
  entityType: AuditEntry["entityType"],
  entityId: string,
  details: string
): AuditEntry {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    actorRole: actor?.role || "therapist",
    actorId: actor?.userId || "system",
    action,
    entityType,
    entityId,
    details,
    createdAt: new Date().toISOString(),
  };
}
