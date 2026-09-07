import { Router } from "express";
import { store } from "../lib/store.js";
import { requireAuth } from "../lib/auth.js";

const router = Router();

router.get("/events", requireAuth, (req, res) => {
  const db = store.read();
  res.json({ events: db.events });
});

router.get("/resources", requireAuth, (req, res) => {
  const db = store.read();
  res.json({ resources: db.resources });
});

export default router;
