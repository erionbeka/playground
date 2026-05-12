import { Router } from "express";
import { z } from "zod";
import { writeAudit } from "../audit.ts";
import { query } from "../db.ts";
import { requireAuth, requireRole } from "../middleware.ts";

const router = Router();

const childSchema = z.object({
  firstName: z.string().min(1),
  displayName: z.string().min(1),
  avatar: z.string().optional(),
  birthDate: z.string().optional(),
  diagnosis: z.string().optional(),
  notes: z.string().default(""),
  personalizationProfile: z.record(z.string(), z.unknown()).default({}),
  skillProfile: z.record(z.string(), z.unknown()).default({}),
  progressionSettings: z.record(z.string(), z.unknown()).default({}),
});

router.get("/", requireAuth, async (req, res) => {
  const result = await query(
    `SELECT id, first_name, display_name, avatar, birth_date, diagnosis, notes, personalization_profile, skill_profile, progression_settings, created_at, updated_at
     FROM children
     WHERE clinic_id = $1
     ORDER BY created_at DESC`,
    [req.user?.clinicId]
  );
  return res.json({ children: result.rows });
});

router.post("/", requireAuth, requireRole("admin", "therapist"), async (req, res) => {
  const parsed = childSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid child payload" });

  const result = await query<{ id: string }>(
    `INSERT INTO children (clinic_id, first_name, display_name, avatar, birth_date, diagnosis, notes, personalization_profile, skill_profile, progression_settings)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id`,
    [
      req.user?.clinicId,
      parsed.data.firstName,
      parsed.data.displayName,
      parsed.data.avatar ?? null,
      parsed.data.birthDate ?? null,
      parsed.data.diagnosis ?? null,
      parsed.data.notes,
      JSON.stringify(parsed.data.personalizationProfile),
      JSON.stringify(parsed.data.skillProfile),
      JSON.stringify(parsed.data.progressionSettings),
    ]
  );

  await writeAudit(req, "child_created", "child", result.rows[0].id, { displayName: parsed.data.displayName });
  return res.status(201).json({ id: result.rows[0].id });
});

export default router;
