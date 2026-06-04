import { Router, type IRouter } from "express";
import { appendReadings, createSessionId, getReadings, listSessions } from "../lib/readingsStore";

const router: IRouter = Router();

function transformReading(r: any) {
  const labelMap: Record<string, "REM" | "NREM" | "Awake"> = {
    rem: "REM",
    normal: "NREM",
    apnea: "Awake",
    recovery: "Awake",
  };
  return {
    timestamp: r.timestamp,
    spo2: r.spo2,
    heart_rate: r.heart_rate_ppg ?? r.heart_rate ?? 70,
    temperature: r.temperature ?? 36.7,
    movement: typeof r.movement === "boolean" ? r.movement : r.movement > 0.05,
    sleep_stage: labelMap[r.label] ?? "NREM",
    // extra ML fields preserved
    hrv_rmssd: r.hrv_rmssd,
    resp_rate: r.resp_rate,
    snore_level: r.snore_level,
    gsr: r.gsr,
    label: r.label,
  };
}

router.post("/ingest/batch", (req, res) => {
  const body = req.body;
  if (!body || (!body.readings && !Array.isArray(body))) {
    res.status(400).json({ error: "Expected { sessionId?, readings: [...] } or array of readings" });
    return;
  }

  const rawReadings = Array.isArray(body) ? body : body.readings;
  const sessionId = Array.isArray(body) ? createSessionId() : (body.sessionId ?? createSessionId());

  if (!Array.isArray(rawReadings) || rawReadings.length === 0) {
    res.status(400).json({ error: "readings must be a non-empty array" });
    return;
  }

  const readings = rawReadings.map(transformReading);
  const totalInSession = appendReadings(sessionId, readings);

  res.status(201).json({ sessionId, accepted: readings.length, totalInSession });
});

router.get("/ingest/sessions", (_req, res) => {
  res.json({ sessions: listSessions() });
});

router.get("/ingest/sessions/:sessionId/readings", (req, res) => {
  const readings = getReadings(req.params.sessionId);
  if (!readings) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json({ sessionId: req.params.sessionId, count: readings.length, readings });
});

export default router;