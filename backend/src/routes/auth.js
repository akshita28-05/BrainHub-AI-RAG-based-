import { Router } from "express";
import { register, login, getUserById } from "../services/authService.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// POST /api/auth/register  { name, email, password }
router.post("/register", async (req, res) => {
  try {
    const result = await register(req.body || {});
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Registration failed" });
  }
});

// POST /api/auth/login  { email, password }
router.post("/login", async (req, res) => {
  try {
    const result = await login(req.body || {});
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Login failed" });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, (req, res) => {
  const user = getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user });
});

export default router;
