import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname } from "path";

const require = createRequire(import.meta.url);
const seedData = require("./readings_500.json");

export type StoredReading = {
  timestamp: string;
  spo2: number;
  heart_rate: number;
  temperature: number;
  movement: boolean;
  sleep_stage: "REM" | "NREM" | "Awake";
  hrv_rmssd?: number;
  resp_rate?: number;
  snore_level?: number;
  gsr?: number;
  label?: string;
};

function transformReading(r: any): StoredReading {
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
    hrv_rmssd: r.hrv_rmssd,
    resp_rate: r.resp_rate,
    snore_level: r.snore_level,
    gsr: r.gsr,
    label: r.label,
  };
}

const sessions = new Map<string, StoredReading[]>();

// Pre-load demo session on startup
sessions.set("demo_session", (seedData as any[]).map(transformReading));
console.log(`Pre-loaded demo_session with ${sessions.get("demo_session")!.length} readings`);

export function appendReadings(sessionId: string, readings: StoredReading[]): number {
  const existing = sessions.get(sessionId) ?? [];
  existing.push(...readings);
  sessions.set(sessionId, existing);
  return existing.length;
}

export function getReadings(sessionId: string): StoredReading[] | undefined {
  return sessions.get(sessionId);
}

export function listSessions() {
  return [...sessions.entries()].map(([sessionId, readings]) => ({
    sessionId,
    readingCount: readings.length,
    firstTimestamp: readings[0]?.timestamp ?? null,
    lastTimestamp: readings[readings.length - 1]?.timestamp ?? null,
  }));
}

export function createSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}