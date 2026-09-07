import { Router } from "express";
import { store } from "../lib/store.js";
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

  const result = await store.mutate((db) => {
    const user = db.users.find((u) => u.id === req.auth.sub);
    if (!user) return { error: "User not found." };
    Object.assign(user, updates);
    return { user };
  });

  if (result.error) return res.status(404).json({ error: result.error });
  res.json({ user: publicUser(result.user) });
});

export default router;
