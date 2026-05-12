export type ApiRole = "admin" | "therapist" | "parent";
export type ApiDifficulty = "easy" | "medium" | "hard";
export type ApiAssignmentType = "homework" | "classwork";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export interface ApiSessionUser {
  id: string;
  clinicId: string;
  role: ApiRole;
  name: string;
}

export interface ApiChildPayload {
  firstName: string;
  displayName: string;
  avatar?: string;
  birthDate?: string;
  diagnosis?: string;
  notes?: string;
  personalizationProfile?: Record<string, unknown>;
  skillProfile?: Record<string, unknown>;
  progressionSettings?: Record<string, unknown>;
}

export interface ApiAssignmentPayload {
  childId: string;
  assignedFamilyUserId?: string;
  type: ApiAssignmentType;
  gameIds: string[];
  difficulty: ApiDifficulty;
  mode: "single" | "shared" | "multiplayer";
  notes?: string;
  dueDate: string;
  skillFocus?: string[];
  supportLevel?: "high" | "moderate" | "light";
  systemSuggestedDifficulty?: ApiDifficulty;
  monthlyPlan?: Record<string, unknown>;
}

export interface ApiGameResultPayload {
  gameId: string;
  durationSeconds: number;
  score: number;
  interactions: number;
  metrics?: Record<string, unknown>;
  skillScores?: Record<string, unknown>;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(typeof body.error === "string" ? body.error : `Request failed with ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const productionApi = {
  login(identifier: string, password: string) {
    return request<{ user: ApiSessionUser; token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
  },

  logout() {
    return request<void>("/api/auth/logout", { method: "POST" });
  },

  me() {
    return request<{ user: ApiSessionUser }>("/api/auth/me");
  },

  createStaff(payload: { role: "admin" | "therapist"; name: string; email: string; password: string }) {
    return request<{ user: { id: string; name: string; email: string; role: ApiRole } }>("/api/auth/staff", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  listChildren() {
    return request<{ children: unknown[] }>("/api/children");
  },

  createChild(payload: ApiChildPayload) {
    return request<{ id: string }>("/api/children", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  listAssignments() {
    return request<{ assignments: unknown[] }>("/api/assignments");
  },

  createAssignment(payload: ApiAssignmentPayload) {
    return request<{ id: string }>("/api/assignments", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  approveAssignment(id: string, payload: { approval: "approved" | "adjusted"; difficulty?: ApiDifficulty }) {
    return request<{ id: string; approval: "approved" | "adjusted" }>(`/api/assignments/${id}/approval`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  recordGameResult(assignmentId: string, payload: ApiGameResultPayload) {
    return request<{ assignmentId: string; gameId: string }>(`/api/assignments/${assignmentId}/results`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  listAuditLog() {
    return request<{ auditLog: unknown[] }>("/api/audit");
  },
};
