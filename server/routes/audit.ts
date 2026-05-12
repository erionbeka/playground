import { Router } from "express";
import { query } from "../db.ts";
import { requireAuth, requireRole } from "../middleware.ts";

const router = Router();

router.get("/", requireAuth, requireRole("admin", "therapist"), async (req, res) => {
  const result = await query(
    `SELECT id, actor_user_id, actor_role, action, entity_type, entity_id, details, created_at
     FROM audit_log
     WHERE clinic_id = $1
     ORDER BY created_at DESC
     LIMIT 300`,
    [req.user?.clinicId]
  );
  return res.json({ auditLog: result.rows });
});

export default router;
