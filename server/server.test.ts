// @vitest-environment node
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const queryMock = vi.fn();
const writeAuditMock = vi.fn();

vi.mock("./db.ts", () => ({
  query: queryMock,
  pool: {},
  closePool: vi.fn(),
}));

vi.mock("./audit.ts", () => ({
  writeAudit: writeAuditMock,
}));

vi.mock("./auth.ts", () => ({
  hashPassword: vi.fn(async (password: string) => `hashed-${password}`),
  verifyPassword: vi.fn(async (_hash: string, password: string) => password === "CorrectHorseBatteryStaple1"),
  signAccessToken: vi.fn(() => "signed-test-token"),
  verifyAccessToken: vi.fn((token: string) => {
    if (token === "admin-token") return { id: "user-admin", clinicId: "clinic-1", role: "admin", name: "Admin" };
    if (token === "therapist-token") return { id: "user-therapist", clinicId: "clinic-1", role: "therapist", name: "Therapist" };
    if (token === "parent-token") return { id: "user-parent", clinicId: "clinic-1", role: "parent", name: "Parent" };
    throw new Error("bad token");
  }),
}));

async function loadApp() {
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = "postgres://test:test@localhost:5432/test";
  process.env.JWT_SECRET = "test-secret-with-more-than-thirty-two-characters";
  process.env.CORS_ORIGIN = "http://localhost:8080";
  const { createApp } = await import("./index.ts");
  return createApp();
}

beforeEach(() => {
  queryMock.mockReset();
  writeAuditMock.mockReset();
});

describe("production API", () => {
  it("authenticates a valid user and writes an audit event", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: "user-1", clinic_id: "clinic-1", role: "therapist", name: "Dr. Lane", password_hash: "hash", credential_status: "active" }] })
      .mockResolvedValueOnce({ rows: [] });

    const app = await loadApp();
    const response = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "therapist@example.com", password: "CorrectHorseBatteryStaple1" })
      .expect(200);

    expect(response.body.user).toMatchObject({ id: "user-1", clinicId: "clinic-1", role: "therapist" });
    expect(response.body.token).toBe("signed-test-token");
    expect(writeAuditMock).toHaveBeenCalledWith(expect.anything(), "therapist_sign_in", "auth", "user-1", { method: "password" });
  });

  it("rejects invalid credentials", async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id: "user-1", clinic_id: "clinic-1", role: "therapist", name: "Dr. Lane", password_hash: "hash", credential_status: "active" }] });

    const app = await loadApp();
    await request(app)
      .post("/api/auth/login")
      .send({ identifier: "therapist@example.com", password: "wrong" })
      .expect(401);
  });

  it("blocks staff creation unless the caller is an admin", async () => {
    const app = await loadApp();
    await request(app)
      .post("/api/auth/staff")
      .set("Authorization", "Bearer therapist-token")
      .send({ role: "therapist", name: "New Therapist", email: "new@example.com", password: "CorrectHorseBatteryStaple1" })
      .expect(403);
  });

  it("lets admins create clinic-scoped child records", async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id: "child-1" }] });

    const app = await loadApp();
    const response = await request(app)
      .post("/api/children")
      .set("Authorization", "Bearer admin-token")
      .send({ firstName: "Ava", displayName: "Ava", notes: "Uses visual supports" })
      .expect(201);

    expect(response.body.id).toBe("child-1");
    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO children"), expect.arrayContaining(["clinic-1", "Ava", "Ava"]));
    expect(writeAuditMock).toHaveBeenCalledWith(expect.anything(), "child_created", "child", "child-1", { displayName: "Ava" });
  });

  it("blocks parents from creating assignments", async () => {
    const app = await loadApp();
    await request(app)
      .post("/api/assignments")
      .set("Authorization", "Bearer parent-token")
      .send({ childId: "00000000-0000-0000-0000-000000000001", type: "homework", gameIds: ["game-001"], difficulty: "easy", mode: "shared", dueDate: "2026-06-01" })
      .expect(403);
  });

  it("records game results and updates assignment status", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: "assignment-1", child_id: "child-1", game_ids: ["game-001"] }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const app = await loadApp();
    const response = await request(app)
      .post("/api/assignments/00000000-0000-0000-0000-000000000002/results")
      .set("Authorization", "Bearer parent-token")
      .send({ gameId: "game-001", durationSeconds: 120, score: 88, interactions: 12 })
      .expect(201);

    expect(response.body.gameId).toBe("game-001");
    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("completedSuccessfully"), ["00000000-0000-0000-0000-000000000002"]);
    expect(writeAuditMock).toHaveBeenCalledWith(expect.anything(), "game_result_recorded", "result", "00000000-0000-0000-0000-000000000002", { gameId: "game-001", score: 88 });
  });

  it("stores failed game attempts without counting them toward assignment completion", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: "assignment-1", child_id: "child-1", game_ids: ["game-001"] }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const app = await loadApp();
    await request(app)
      .post("/api/assignments/00000000-0000-0000-0000-000000000002/results")
      .set("Authorization", "Bearer parent-token")
      .send({
        gameId: "game-001",
        durationSeconds: 120,
        score: 45,
        interactions: 12,
        metrics: { completedSuccessfully: false, accuracy: 45, trials: 10, correctTrials: 4, errors: 6 },
      })
      .expect(201);

    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("completedSuccessfully"), ["00000000-0000-0000-0000-000000000002"]);
    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO game_results"), expect.arrayContaining([
      "00000000-0000-0000-0000-000000000002",
      "child-1",
      "game-001",
      120,
      45,
      12,
      JSON.stringify({ completedSuccessfully: false, accuracy: 45, trials: 10, correctTrials: 4, errors: 6 }),
    ]));
  });

  it("scopes parent assignment lists to linked children", async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id: "assignment-linked" }] });

    const app = await loadApp();
    const response = await request(app)
      .get("/api/assignments")
      .set("Authorization", "Bearer parent-token")
      .expect(200);

    expect(response.body.assignments).toEqual([{ id: "assignment-linked" }]);
    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("JOIN family_child_links"), ["clinic-1", "user-parent"]);
  });

  it("returns only the signed-in caregiver family session", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: "child-linked" }] })
      .mockResolvedValueOnce({ rows: [{ id: "assignment-linked" }] });

    const app = await loadApp();
    const response = await request(app)
      .get("/api/family/session")
      .set("Authorization", "Bearer parent-token")
      .expect(200);

    expect(response.body).toEqual({
      children: [{ id: "child-linked" }],
      assignments: [{ id: "assignment-linked" }],
    });
  });

  it("does not let parents record results for unlinked assignments", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    const app = await loadApp();
    await request(app)
      .post("/api/assignments/00000000-0000-0000-0000-000000000099/results")
      .set("Authorization", "Bearer parent-token")
      .send({ gameId: "game-001", durationSeconds: 120, score: 88, interactions: 12 })
      .expect(404);
  });

  it("lets therapists create caregiver links for a child", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: "caregiver-user-1" }] })
      .mockResolvedValueOnce({ rows: [{ id: "family-link-1" }] });

    const app = await loadApp();
    const response = await request(app)
      .post("/api/families")
      .set("Authorization", "Bearer therapist-token")
      .send({
        childId: "00000000-0000-0000-0000-000000000010",
        name: "Caregiver One",
        relationship: "parent",
        phoneNumber: "555-0101",
        temporaryPassword: "CorrectHorseBatteryStaple1",
      })
      .expect(201);

    expect(response.body).toEqual({ id: "family-link-1", userId: "caregiver-user-1" });
    expect(writeAuditMock).toHaveBeenCalledWith(expect.anything(), "caregiver_created", "credential", "family-link-1", {
      childId: "00000000-0000-0000-0000-000000000010",
      relationship: "parent",
    });
  });

  it("restricts caregiver password resets to admins", async () => {
    const app = await loadApp();
    await request(app)
      .post("/api/families/caregiver-user-1/reset-password")
      .set("Authorization", "Bearer therapist-token")
      .send({ temporaryPassword: "CorrectHorseBatteryStaple1" })
      .expect(403);
  });

  it("lets therapists create and update therapy goals", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: "goal-1" }] })
      .mockResolvedValueOnce({ rows: [{ id: "goal-1" }] });

    const app = await loadApp();
    await request(app)
      .post("/api/goals")
      .set("Authorization", "Bearer therapist-token")
      .send({
        childId: "00000000-0000-0000-0000-000000000010",
        domain: "social",
        title: "Increase turn-taking",
        targetLevel: 80,
      })
      .expect(201);

    const response = await request(app)
      .patch("/api/goals/goal-1/status")
      .set("Authorization", "Bearer therapist-token")
      .send({ status: "achieved" })
      .expect(200);

    expect(response.body).toEqual({ id: "goal-1", status: "achieved" });
    expect(writeAuditMock).toHaveBeenCalledWith(expect.anything(), "goal_status_updated", "goal", "goal-1", { status: "achieved" });
  });
});
