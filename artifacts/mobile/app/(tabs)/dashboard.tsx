import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useSession, SessionSummary } from "@/context/SessionContext";
import MetricCard from "@/components/MetricCard";
import SleepBarChart from "@/components/SleepBarChart";
import GlowCard from "@/components/GlowCard";

const { width: SW } = Dimensions.get("window");
type Timeframe = "daily" | "weekly";

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { weeklyStats, savedSessions } = useSession();
  const [timeframe, setTimeframe] = useState<Timeframe>("weekly");
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const lastSession = savedSessions[0];
  const avgSpo2 = lastSession?.avgSpo2 ?? null; 
  const avgHr = lastSession?.avgHeartRate ?? null;
  const avgTemp = lastSession?.avgTemperature ?? null;
  const sleepScore = lastSession?.sleepScore ?? null;
  const remDuration = lastSession?.remDuration ?? null;
  const nonRemDuration = lastSession?.nonRemDuration ?? null;

  const isAbnormal = avgSpo2 < 94 || avgHr > 100 || avgHr < 48;
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] ?? "User";

  const getChartData = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  if (timeframe === "daily") {
    return days.map((label) => {
      const daySessions = savedSessions.filter((s) => {
        const d = new Date(s.date);
        return days[d.getDay() === 0 ? 6 : d.getDay() - 1] === label;
      });
      if (daySessions.length === 0) return { label, rem: 0, nonRem: 0, score: 0 };
      return {
        label,
        rem: Math.round(daySessions.reduce((a, s) => a + s.remDuration, 0) / daySessions.length),
        nonRem: Math.round(daySessions.reduce((a, s) => a + s.nonRemDuration, 0) / daySessions.length),
        score: Math.round(daySessions.reduce((a, s) => a + s.sleepScore, 0) / daySessions.length),
      };
    });
  }

  const weekLabels = ["W1", "W2", "W3", "W4"];
  const now = new Date();
  return weekLabels.map((label, i) => {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (5 - i) * 7 - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekSessions = savedSessions.filter((s) => {
      const d = new Date(s.date);
      return d >= weekStart && d < weekEnd;
    });

    if (weekSessions.length === 0) return { label, rem: 0, nonRem: 0, score: 0 };
    return {
      label,
      rem: Math.round(weekSessions.reduce((a, s) => a + s.remDuration, 0) / weekSessions.length),
      nonRem: Math.round(weekSessions.reduce((a, s) => a + s.nonRemDuration, 0) / weekSessions.length),
      score: Math.round(weekSessions.reduce((a, s) => a + s.sleepScore, 0) / weekSessions.length),
    };
  });
};

  const handleStart = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push("/session");
  };

  const scoreColor = sleepScore >= 80 ? colors.success : sleepScore >= 60 ? colors.warning : colors.danger;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#0A1628", colors.background]}
        style={[styles.headerGrad, { paddingTop: topInset + 16 }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{greeting}</Text>
            <Text style={[styles.name, { color: colors.foreground }]}>{firstName}</Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: `${colors.success}20`, borderColor: `${colors.success}60` }]}>
            <View style={[styles.dot, { backgroundColor: colors.success }]} />
            <Text style={[styles.statusText, { color: colors.success }]}>Live</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {isAbnormal && (
          <GlowCard glowColor={colors.danger} style={{ marginBottom: 16 }}>
            <View style={styles.alertRow}>
              <Ionicons name="warning" size={20} color={colors.danger} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.alertTitle, { color: colors.danger }]}>Abnormal Vitals Detected</Text>
                <Text style={[styles.alertBody, { color: colors.mutedForeground }]}>
                  SpO2 or heart rate outside normal range. Consult your physician.
                </Text>
              </View>
            </View>
          </GlowCard>
        )}

        <View style={styles.metricsGrid}>
          <MetricCard
            label="SpO2"
            value={avgSpo2 !== null ? avgSpo2.toFixed(1) : "--"}
            unit="%"
            icon="water-outline"
            color={colors.spo2Color}
            subtitle={avgSpo2 !== null ? "Normal: 95-100%" : "No session data"}
            isAlert={avgSpo2 !== null && avgSpo2 < 94}
          />
          <MetricCard
            label="Heart Rate"
            value={avgHr !== null ? Math.round(avgHr).toString() : "--"}
            unit="bpm"
            icon="heart-outline"
            color={colors.hrColor}
            subtitle={avgHr !== null ? "Normal: 48-100 bpm" : "No session data"}
            isAlert={avgHr !== null && (avgHr > 100 || avgHr < 48)}
          />
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard
            label="Temperature"
            value={avgTemp !== null ? avgTemp.toFixed(1) : "--"}
            unit="°C"
            icon="thermometer-outline"
            color={colors.tempColor}
            subtitle={avgTemp !== null ? "Normal: 36.0-37.9°C" : "No session data"}
          />
          <MetricCard
            label="Movement"
            value={lastSession ? `${Math.round((lastSession.readings.filter((r) => r.movement).length / Math.max(lastSession.readings.length, 1)) * 100)}` : "--"}
            unit="%"
            icon="walk-outline"
            color={colors.movColor}
            subtitle={lastSession ? "Normal: <20%" : "No session data"}
          />
        </View>

        <View style={styles.sleepRow}>
          <View style={[styles.sleepChip, { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}40` }]}>
            <Ionicons name="moon-outline" size={14} color={colors.primary} />
            <Text style={[styles.sleepChipLabel, { color: colors.primary }]}>REM</Text>
            <Text style={[styles.sleepChipValue, { color: colors.foreground }]}>{remDuration != null ? `${Math.floor(remDuration / 60)}m ${remDuration % 60}s` : "--"}</Text>
          </View>
          <View style={[styles.sleepChip, { backgroundColor: `${colors.secondary}80`, borderColor: colors.border }]}>
            <Ionicons name="cloudy-night-outline" size={14} color={colors.mutedForeground} />
            <Text style={[styles.sleepChipLabel, { color: colors.mutedForeground }]}>Non-REM</Text>
            <Text style={[styles.sleepChipValue, { color: colors.foreground }]}>{nonRemDuration != null ? `${Math.floor(nonRemDuration / 60)}m ${nonRemDuration % 60}s` : "--"}</Text>
          </View>
        </View>

        <GlowCard glowColor={scoreColor} style={{ marginBottom: 16 }}>
          <View style={styles.scoreRow}>
            <View>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Sleep Quality Score</Text>
              <Text style={[styles.scoreValue, { color: scoreColor }]}>{sleepScore}<Text style={styles.scoreMax}>/100</Text></Text>
              <Text style={[styles.scoreDesc, { color: colors.mutedForeground }]}>
                {sleepScore >= 80 ? "Excellent recovery" : sleepScore >= 60 ? "Moderate quality" : "Needs improvement"}
              </Text>
            </View>
            <View style={[styles.scoreCircle, { borderColor: `${scoreColor}60`, backgroundColor: `${scoreColor}12` }]}>
              <Ionicons name="ribbon-outline" size={28} color={scoreColor} />
            </View>
          </View>
        </GlowCard>

        <GlowCard noPadding style={{ marginBottom: 16, overflow: "hidden" }}>
          <View style={styles.chartHeader}>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Sleep Cycles</Text>
            <View style={styles.timeframeRow}>
              {(["daily", "weekly"] as Timeframe[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setTimeframe(t)}
                  style={[
                    styles.tfBtn,
                    timeframe === t && { backgroundColor: `${colors.primary}20`, borderColor: `${colors.primary}60` },
                    { borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.tfText, { color: timeframe === t ? colors.primary : colors.mutedForeground }]}>
                    {t.charAt(0).toUpperCase() + t.slice(1, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <SleepBarChart data={getChartData()} width={SW - 48} />
          </View>
        </GlowCard>

        <GlowCard style={{ marginBottom: 16 }}>
          <Text style={[styles.sectionLabel, { color: colors.foreground, marginBottom: 12 }]}>Sleep Insights</Text>
          {lastSession?.insights && lastSession.insights.length > 0 ? (
            lastSession.insights.map((insight, i) => (
              <View key={i} style={[styles.insightRow, i < lastSession.insights.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
                <Text style={[styles.insightText, { color: colors.mutedForeground }]}>{insight}</Text>
              </View>
              ))
              ) : (
                <View style={styles.insightRow}>
                  <Ionicons name="moon-outline" size={16} color={colors.mutedForeground} />
                  <Text style={[styles.insightText, { color: colors.mutedForeground }]}>Record a session to get AI-powered sleep insights.</Text>
                </View>
                )}
        </GlowCard>
      </ScrollView>

      <View style={[styles.startWrap, { paddingBottom: bottomInset + 74, backgroundColor: colors.background }]}>
        <LinearGradient
          colors={["transparent", colors.background]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <TouchableOpacity style={[styles.startBtn, { backgroundColor: colors.primary }]} onPress={handleStart} activeOpacity={0.88}>
          <Ionicons name="radio-button-on" size={20} color={colors.background} />
          <Text style={[styles.startText, { color: colors.background }]}>Start Session</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGrad: { paddingHorizontal: 24, paddingBottom: 20 },
  headerContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
  name: { fontSize: 26, fontFamily: "Inter_700Bold", marginTop: 2 },
  statusDot: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },
  alertRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  alertTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  alertBody: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  metricsGrid: { flexDirection: "row", gap: 12, marginBottom: 12 },
  sleepRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  sleepChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  sleepChipLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  sleepChipValue: { fontSize: 16, fontFamily: "Inter_700Bold", marginLeft: "auto" },
  sectionLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.7 },
  scoreRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  scoreValue: { fontSize: 48, fontFamily: "Inter_700Bold", lineHeight: 56 },
  scoreMax: { fontSize: 20, fontFamily: "Inter_400Regular" },
  scoreDesc: { fontSize: 13, fontFamily: "Inter_400Regular" },
  scoreCircle: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, paddingBottom: 8 },
  timeframeRow: { flexDirection: "row", gap: 6 },
  tfBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  tfText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  insightRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 10 },
  insightText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  startWrap: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 16 },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 56,
    borderRadius: 16,
  },
  startText: { fontSize: 17, fontFamily: "Inter_700Bold" },
});
