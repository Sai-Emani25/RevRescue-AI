import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { analyzeRevenueRiskEvent } from "./server/recoveryAgent";
import { PRESET_SCENARIOS } from "./src/data/presets";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check API
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
      service: "RevRescue AI Autonomous Recovery Engine"
    });
  });

  // Presets endpoint
  app.get("/api/presets", (req, res) => {
    res.json({ presets: PRESET_SCENARIOS });
  });

  // Main RevRescue AI Event Analysis & Workflow Execution
  app.post("/api/analyze-event", async (req, res) => {
    try {
      const eventData = req.body;
      if (!eventData || !eventData.event_id || !eventData.risk_category) {
        return res.status(400).json({ error: "Invalid event data: event_id and risk_category are required" });
      }

      const result = await analyzeRevenueRiskEvent(eventData);
      return res.json(result);
    } catch (error: any) {
      console.error("Error processing revenue risk event:", error);
      return res.status(500).json({ error: error?.message || "Internal server error" });
    }
  });

  // Batch simulation endpoint with rate-paced processing
  app.post("/api/batch-simulate", async (req, res) => {
    try {
      const { events } = req.body;
      const targetEvents = Array.isArray(events) && events.length > 0 
        ? events 
        : PRESET_SCENARIOS.map(p => p.event);

      const results = [];
      for (const evt of targetEvents) {
        const resObj = await analyzeRevenueRiskEvent(evt);
        results.push(resObj);
        // Small 30ms pacing delay between items to avoid burst limits
        await new Promise(r => setTimeout(r, 30));
      }

      return res.json({
        total_processed: results.length,
        results
      });
    } catch (error: any) {
      console.error("Batch simulation error:", error);
      return res.status(500).json({ error: error?.message || "Batch simulation failed" });
    }
  });

  // Catch-all for API routes to never return HTML fallback
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`RevRescue AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
