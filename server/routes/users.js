import { Router } from "express";
import * as users from "../db/users.js";
import { requireAuth, publicUser } from "../lib/auth.js";

const router = Router();

const EDITABLE_FIELDS = [
  "name",
  "professionalCategory",
  "licenceNumber",
  "phone",
  "institution",
  "designation",
];

router.put("/me", requireAuth, async (req, res) => {
  const updates = {};
  for (const field of EDITABLE_FIELDS) {
    if (req.body?.[field] !== undefined) updates[field] = String(req.body[field]).trim();
  }

  const user = await users.updateProfile(req.auth.sub, updates);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ user: publicUser(user) });
});

export default router;
