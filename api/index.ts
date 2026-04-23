import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const router = express.Router();

// Health check for testing
router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", router);

export default app;
