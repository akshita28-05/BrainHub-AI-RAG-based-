import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRouter from "./routes/api.js";
import authRouter from "./routes/auth.js";
import { requireAuth } from "./middleware/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Auth routes are public (you need them to get a token in the first place).
app.use("/api/auth", authRouter);

// Health check stays public so it can be used for uptime checks.
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "brainhub-backend", time: new Date().toISOString() });
});

// Everything else requires a valid session.
app.use("/api", requireAuth, apiRouter);

app.get("/", (req, res) => {
  res.json({
    name: "BrainHub AI Backend",
    description: "AI Organizational Memory Engine API",
    endpoints: [
      "POST /api/auth/register",
      "POST /api/auth/login",
      "GET  /api/auth/me",
      "GET  /api/health",
      "GET  /api/timeline",
      "GET  /api/decisions/:id",
      "GET  /api/search?q=",
      "POST /api/chat",
      "GET  /api/graph",
      "GET  /api/risk",
      "GET  /api/people",
    ],
  });
});

app.listen(PORT, () => {
  console.log(`\n🧠 BrainHub AI backend running at http://localhost:${PORT}`);
  console.log(`   Try: GET http://localhost:${PORT}/api/timeline\n`);
});
