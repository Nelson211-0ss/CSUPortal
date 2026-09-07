import { Router } from "express";
import * as events from "../db/events.js";
import { requireAuth } from "../lib/auth.js";

const router = Router();

router.get("/events", requireAuth, async (req, res) => {
  const list = await events.list();
  res.json({ events: list });
});

export default router;
