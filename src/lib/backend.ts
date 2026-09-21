import type { AuditEntry, Child, HomeworkAssignment } from "@/context/AppContext";
import type { AuthSession } from "@/lib/auth";
import { readSnapshot, writeSnapshot } from "@/lib/secureVault";

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

export function loadAppData(defaultData: AppDataSnapshot): AppDataSnapshot {
  if (typeof window === "undefined") return defaultData;

  // Legacy/plaintext key stays authoritative whenever present (migration source + tests);
  // loading through it re-seeds the encrypted vault.
  try {
    const raw = window.localStorage.getItem(APP_DATA_STORAGE_KEY);
    if (raw) {
      const parsed = { ...defaultData, ...(JSON.parse(raw) as AppDataSnapshot) };
      void writeSnapshot(parsed);
      return parsed;
    }
  } catch {
    /* fall through to vault */
  }

  const fromVault = readSnapshot<AppDataSnapshot>();
  if (fromVault) return { ...defaultData, ...fromVault };

  return defaultData;
}

export function saveAppData(snapshot: AppDataSnapshot) {
  if (typeof window === "undefined") return;
  void writeSnapshot(snapshot);
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
