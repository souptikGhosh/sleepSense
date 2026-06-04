import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

const BACKEND_URL = "https://sleepsense-bgal.onrender.com";
const DEMO_SESSION_ID = "demo_session";

export interface SensorReading {
  timestamp: string;
  spo2: number;
  heart_rate: number;
  temperature: number;
  movement: boolean;
  sleep_stage: "REM" | "NREM" | "Awake";
}

export interface SessionSummary {
  id: string;
  date: string;
  duration: number;
  readings: SensorReading[];
  avgSpo2: number;
  avgHeartRate: number;
  avgTemperature: number;
  sleepScore: number;
  remDuration: number;
  nonRemDuration: number;
  insights: string[];
}

export interface DailyStats {
  label: string;
  rem: number;
  nonRem: number;
  score: number;
}

interface SessionContextType {
  isSessionActive: boolean;
  sessionData: SensorReading[];
  currentReading: SensorReading | null;
  sessionDuration: number;
  completedSession: SessionSummary | null;
  savedSessions: SessionSummary[];
  weeklyStats: DailyStats[];
  deviceConnected: boolean;
  batteryLevel: number;
  sensorStatus: { spo2: boolean; hr: boolean; temp: boolean; motion: boolean };
  startSession: () => void;
  stopSession: () => void;
  reconnectDevice: () => void;
}

const SessionContext = createContext<SessionContextType>({
  isSessionActive: false,
  sessionData: [],
  currentReading: null,
  sessionDuration: 0,
  completedSession: null,
  savedSessions: [],
  weeklyStats: [],
  deviceConnected: true,
  batteryLevel: 78,
  sensorStatus: { spo2: true, hr: true, temp: true, motion: true },
  startSession: () => {},
  stopSession: () => {},
  reconnectDevice: () => {},
});

function generateReading(prev: SensorReading | null, elapsed: number): SensorReading {
  const stageIndex = Math.floor(elapsed / 30) % 3;
  const stages: Array<"REM" | "NREM" | "Awake"> = ["NREM", "REM", "NREM"];
  const sleep_stage = elapsed < 5 ? "Awake" : stages[stageIndex];

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const nudge = (base: number, spread: number) => base + (Math.random() - 0.5) * spread;

  const prevSpo2 = prev?.spo2 ?? 97;
  const prevHr = prev?.heart_rate ?? 65;
  const prevTemp = prev?.temperature ?? 36.7;

  return {
    timestamp: new Date().toISOString(),
    spo2: clamp(Math.round(nudge(prevSpo2, 1.5)), 92, 100),
    heart_rate: clamp(Math.round(nudge(prevHr, 4)), 48, 105),
    temperature: clamp(parseFloat(nudge(prevTemp, 0.15).toFixed(1)), 36.0, 37.9),
    movement: Math.random() < 0.08,
    sleep_stage,
  };
}

function computeSummary(readings: SensorReading[], id: string): SessionSummary {
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
  const remReadings = readings.filter((r) => r.sleep_stage === "REM").length;
  const nonRemReadings = readings.filter((r) => r.sleep_stage === "NREM").length;
  const avgSpo2 = parseFloat(avg(readings.map((r) => r.spo2)).toFixed(1));
  const avgHr = parseFloat(avg(readings.map((r) => r.heart_rate)).toFixed(0));
  const avgTemp = parseFloat(avg(readings.map((r) => r.temperature)).toFixed(1));
  const score = Math.min(100, Math.round((avgSpo2 - 90) * 4 + (remReadings / (readings.length || 1)) * 30 + 50));

  return {
    id,
    date: new Date().toISOString(),
    duration: readings.length, // assuming 1 reading per second
    readings,
    avgSpo2,
    avgHeartRate: avgHr,
    avgTemperature: avgTemp,
    sleepScore: score,
    remDuration: remReadings, // assuming 1 reading per second
    nonRemDuration: nonRemReadings, // assuming 1 reading per second
    insights: [],
  };
}

function generateWeeklyStats(): DailyStats[] {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((label) => ({
    label,
    rem: Math.round(60 + Math.random() * 90),
    nonRem: Math.round(180 + Math.random() * 120),
    score: Math.round(62 + Math.random() * 35),
  }));
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionData, setSessionData] = useState<SensorReading[]>([]);
  const [currentReading, setCurrentReading] = useState<SensorReading | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [completedSession, setCompletedSession] = useState<SessionSummary | null>(null);
  const [savedSessions, setSavedSessions] = useState<SessionSummary[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<DailyStats[]>([]);
  const [deviceConnected, setDeviceConnected] = useState(true);
  const [batteryLevel] = useState(78);
  const [sensorStatus] = useState({ spo2: true, hr: true, temp: true, motion: true });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const dataRef = useRef<SensorReading[]>([]);
  const prevReadingRef = useRef<SensorReading | null>(null);

  const {user} = useAuth();
  const sessionKey = user ?`sleepsense_sessions_${user?.id}` : null;

useEffect(() => {
  const load = async () => {
    if (!sessionKey) { 
      setSavedSessions([]); 
      setWeeklyStats([]);
      return; 
    }
    try {
      const stored = await AsyncStorage.getItem(sessionKey);
      if (stored) {
        setSavedSessions(JSON.parse(stored));
        setWeeklyStats(generateWeeklyStats());
      } else {
        setSavedSessions([]);
        setWeeklyStats([]);
      }
    } catch {}
  };
  load();
}, [sessionKey]);

  const startSession = useCallback(() => {
  elapsedRef.current = 0;
  dataRef.current = [];
  prevReadingRef.current = null;
  setSessionData([]);
  setSessionDuration(0);
  setIsSessionActive(true);

  let readingIndex = 0;
  let allReadings: SensorReading[] = [];

  // Fetch all readings once upfront
  fetch(`${BACKEND_URL}/api/ingest/sessions/${DEMO_SESSION_ID}/readings`)
    .then((res) => res.json())
    .then((json) => {
      allReadings = json.readings ?? [];
    })
    .catch(() => {
      console.log("Backend unreachable, using mock data");
    });

  intervalRef.current = setInterval(() => {
    if (allReadings.length > 0 && readingIndex < allReadings.length) {
      const reading = allReadings[readingIndex];
      readingIndex++;
      prevReadingRef.current = reading;
      dataRef.current = [...dataRef.current, reading];
      setSessionData((prev) => [...prev, reading]);
      setCurrentReading(reading);
      setSessionDuration(readingIndex);
    } else if (allReadings.length === 0) {
      // fallback mock
      elapsedRef.current += 1;
      const reading = generateReading(prevReadingRef.current, elapsedRef.current);
      prevReadingRef.current = reading;
      dataRef.current = [...dataRef.current, reading];
      setSessionData((prev) => [...prev, reading]);
      setCurrentReading(reading);
      setSessionDuration(elapsedRef.current);
    }
  }, 1000);
}, []);

  const stopSession = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsSessionActive(false);

    const id = "session_" + Date.now();
    const summary = computeSummary(dataRef.current, id);
    setCompletedSession(summary);

    let insights: string[] = [];
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer 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",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are a clinical sleep analyst. Analyze this sleep session and return exactly 3 insights as a JSON array of strings. Each insight must be unique, specific, and actionable. Vary the focus — one about sleep quality/score, one about a specific metric (SpO2, HR, or temperature), one about REM vs NREM balance. Do not use template sentences. Return ONLY the JSON array, no other text.

            Session:
            - Duration: ${Math.floor(summary.duration / 60)} minutes
            - Sleep score: ${summary.sleepScore}/100
            - Avg SpO2: ${summary.avgSpo2}% (normal: 95-100%)
            - Avg Heart Rate: ${summary.avgHeartRate} bpm (normal: 48-100)
            - Avg Temperature: ${summary.avgTemperature}°C (normal: 36.1-37.2°C)
            - REM: ${Math.floor(summary.remDuration / 60)} min (${Math.round((summary.remDuration / Math.max(summary.duration, 1)) * 100)}% of session)
            - Non-REM: ${Math.floor(summary.nonRemDuration / 60)} min (${Math.round((summary.nonRemDuration / Math.max(summary.duration, 1)) * 100)}% of session)
            - Ideal REM proportion: 20-25%`
          }],
        }),
      });
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content ?? "[]";
      const clean = text.replace(/```json|```/g, "").trim();
      insights = JSON.parse(clean);
      } catch(e) {
      insights = ["Couldn't generate insights for this session."];
    }

    const summaryWithInsights = { ...summary, insights };
    setCompletedSession(summaryWithInsights);

    const updated = [summaryWithInsights, ...savedSessions].slice(0, 30);
    setSavedSessions(updated);
    try {
      if (sessionKey) await AsyncStorage.setItem(sessionKey, JSON.stringify(updated));
    } catch {}
  }, [savedSessions, sessionKey]);

  const reconnectDevice = useCallback(() => {
    setDeviceConnected(false);
    setTimeout(() => setDeviceConnected(true), 2000);
  }, []);

  return (
    <SessionContext.Provider
      value={{
        isSessionActive,
        sessionData,
        currentReading,
        sessionDuration,
        completedSession,
        savedSessions,
        weeklyStats,
        deviceConnected,
        batteryLevel,
        sensorStatus,
        startSession,
        stopSession,
        reconnectDevice,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
