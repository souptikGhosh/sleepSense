import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useSession, SensorReading } from "@/context/SessionContext";
import RealtimeChart from "@/components/RealtimeChart";
import GlowCard from "@/components/GlowCard";

const { width: SW } = Dimensions.get("window");
const CHART_W = SW - 40;

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AnalysisScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { completedSession, savedSessions } = useSession();
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const session = completedSession ?? savedSessions[0];

  if (!session) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="moon-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No session data available</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backLink, { color: colors.primary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const spo2Data = session.readings.map((r) => r.spo2);
  const hrData = session.readings.map((r) => r.heart_rate);
  const tempData = session.readings.map((r) => r.temperature);
  const movementEvents = session.readings
    .map((r, i) => ({ ...r, index: i }))
    .filter((r) => r.movement);

  const scoreColor = session.sleepScore >= 80 ? colors.success : session.sleepScore >= 60 ? colors.warning : colors.danger;

  const alertLevel =
    session.avgSpo2 < 92 ? "Emergency"
      : session.avgSpo2 < 95 ? "Mild Concern"
        : "Normal";

  const alertColor =
    alertLevel === "Emergency" ? colors.danger
      : alertLevel === "Mild Concern" ? colors.warning
        : colors.success;

  const today = new Date();
  const calDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d;
  });

  const selectedSession = selectedDate !== null ? savedSessions[selectedDate] : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={["#0A1628", colors.background]} style={[styles.header, { paddingTop: topInset + 10 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.replace("/(tabs)/dashboard")} style={styles.backBtn}>
            <Ionicons name="home-outline" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Session Analysis</Text>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 24 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="time-outline" size={14} color={colors.primary} />
            <Text style={[styles.chipLabel, { color: colors.mutedForeground }]}>Duration</Text>
            <Text style={[styles.chipValue, { color: colors.foreground }]}>{formatDuration(session.duration)}</Text>
          </View>
          <View style={[styles.summaryChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="ribbon-outline" size={14} color={scoreColor} />
            <Text style={[styles.chipLabel, { color: colors.mutedForeground }]}>Score</Text>
            <Text style={[styles.chipValue, { color: scoreColor }]}>{session.sleepScore}</Text>
          </View>
          <View style={[styles.summaryChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="moon-outline" size={14} color={colors.movColor} />
            <Text style={[styles.chipLabel, { color: colors.mutedForeground }]}>REM</Text>
            <Text style={[styles.chipValue, { color: colors.foreground }]}>{Math.floor(session.remDuration / 60)}m {session.remDuration % 60}s</Text>
          </View>
          </View>

        <GlowCard glowColor={alertColor} style={{ marginBottom: 16 }}>
          <View style={styles.alertRow}>
            <Ionicons
              name={alertLevel === "Normal" ? "shield-checkmark-outline" : alertLevel === "Mild Concern" ? "alert-circle-outline" : "warning-outline"}
              size={24}
              color={alertColor}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertLabel, { color: colors.mutedForeground }]}>Emergency Status</Text>
              <Text style={[styles.alertValue, { color: alertColor }]}>{alertLevel}</Text>
              <Text style={[styles.alertDesc, { color: colors.mutedForeground }]}>
                {alertLevel === "Normal"
                  ? "All vital signs within normal range."
                  : alertLevel === "Mild Concern"
                    ? "SpO2 slightly below optimal. Monitor closely."
                    : "Critical SpO2 levels detected. Consult physician."}
              </Text>
            </View>
          </View>
        </GlowCard>

        <RealtimeChart data={spo2Data} color={colors.spo2Color} label="SpO2 Timeline" unit="%" minVal={88} maxVal={100} height={140} width={CHART_W} currentValue={Math.round(session.avgSpo2)} />
        <RealtimeChart data={hrData} color={colors.hrColor} label="Heart Rate Timeline" unit="bpm" minVal={40} maxVal={120} height={140} width={CHART_W} currentValue={Math.round(session.avgHeartRate)} />
        <RealtimeChart data={tempData} color={colors.tempColor} label="Temperature Timeline" unit="°C" minVal={35} maxVal={39} height={120} width={CHART_W} currentValue={session.avgTemperature} />

        <GlowCard style={{ marginBottom: 16 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 12 }]}>Sleep Stage Segmentation</Text>
          <View style={styles.stageBar}>
            <View style={[styles.stageSegment, { flex: session.nonRemDuration || 1, backgroundColor: `${colors.movColor}50` }]}>
              <Text style={[styles.stageSegLabel, { color: colors.movColor }]}>NREM</Text>
            </View>
            <View style={[styles.stageSegment, { flex: session.remDuration || 1, backgroundColor: `${colors.primary}50` }]}>
              <Text style={[styles.stageSegLabel, { color: colors.primary }]}>REM</Text>
            </View>
          </View>
          <View style={styles.stageStats}>
            <View style={styles.stageStat}>
              <View style={[styles.stageDot, { backgroundColor: colors.movColor }]} />
              <Text style={[styles.stageStatLabel, { color: colors.mutedForeground }]}>Non-REM: {Math.floor(session.nonRemDuration / 60)}m {session.nonRemDuration % 60}s</Text>
            </View>
            <View style={styles.stageStat}>
              <View style={[styles.stageDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.stageStatLabel, { color: colors.mutedForeground }]}>REM: {Math.floor(session.remDuration / 60)}m {session.remDuration % 60}s</Text>
            </View>
            </View>
        </GlowCard>

        <GlowCard style={{ marginBottom: 16 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 12 }]}>
            Movement Events ({movementEvents.length})
          </Text>
          {movementEvents.length === 0 ? (
            <Text style={[styles.emptyInsight, { color: colors.mutedForeground }]}>No significant movement detected.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {movementEvents.slice(0, 12).map((evt, i) => (
                <View key={i} style={[styles.movChip, { backgroundColor: `${colors.warning}15`, borderColor: `${colors.warning}40` }]}>
                  <Ionicons name="move-outline" size={12} color={colors.warning} />
                  <Text style={[styles.movLabel, { color: colors.warning }]}>t={evt.index}s</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </GlowCard>

        <GlowCard style={{ marginBottom: 16 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 8 }]}>AI Medical Insights</Text>
          <View style={[styles.aiChip, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}30` }]}>
            <Ionicons name="hardware-chip-outline" size={14} color={colors.primary} />
            <Text style={[styles.aiLabel, { color: colors.primary }]}>AI Analysis</Text>
          </View>
          {session?.insights?.length > 0 ? (
            session.insights.map((insight, i) => (
              <Text key={i} style={[styles.aiInsight, { color: colors.mutedForeground }]}>• {insight}</Text>
              ))
              ) : (
                <Text style={[styles.aiInsight, { color: colors.mutedForeground }]}>No insights available for this session.</Text>
              )}
        </GlowCard>
        <GlowCard noPadding style={{ marginBottom: 16, overflow: "hidden" }}>
          <View style={{ padding: 16, paddingBottom: 12 }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Session History</Text>
            <Text style={[styles.calSubtitle, { color: colors.mutedForeground }]}>Past 7 days</Text>
          </View>
          <View style={styles.calRow}>
            {calDays.map((d, i) => {
              const hasSession = i < savedSessions.length;
              const isSelected = selectedDate === i;
              const dayScore = savedSessions[i]?.sleepScore;
              const dc = dayScore !== undefined ? (dayScore >= 80 ? colors.success : dayScore >= 60 ? colors.warning : colors.danger) : colors.mutedForeground;
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.calDay,
                    isSelected && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary },
                    !isSelected && { borderColor: colors.border },
                  ]}
                  onPress={() => setSelectedDate(isSelected ? null : i)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.calDayName, { color: colors.mutedForeground }]}>{DAYS[d.getDay()]}</Text>
                  <Text style={[styles.calDayNum, { color: isSelected ? colors.primary : colors.foreground }]}>{d.getDate()}</Text>
                  {hasSession && <View style={[styles.calDot, { backgroundColor: dc }]} />}
                </TouchableOpacity>
              );
            })}
          </View>
          {selectedSession && (
            <View style={[styles.selectedSession, { borderTopColor: colors.border }]}>
              <Text style={[styles.selTitle, { color: colors.foreground }]}>
                {new Date(selectedSession.date).toLocaleDateString()}
              </Text>
              <View style={styles.selRow}>
                <Text style={[styles.selStat, { color: colors.mutedForeground }]}>Score: <Text style={{ color: scoreColor }}>{selectedSession.sleepScore}</Text></Text>
                <Text style={[styles.selStat, { color: colors.mutedForeground }]}>SpO2: <Text style={{ color: colors.spo2Color }}>{selectedSession.avgSpo2}%</Text></Text>
                <Text style={[styles.selStat, { color: colors.mutedForeground }]}>HR: <Text style={{ color: colors.hrColor }}>{Math.round(selectedSession.avgHeartRate)}bpm</Text></Text>
              </View>
            </View>
          )}
        </GlowCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  emptyText: { fontSize: 16, fontFamily: "Inter_400Regular", marginTop: 12 },
  backLink: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginTop: 16 },
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  summaryChip: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 12, gap: 3, alignItems: "center" },
  chipLabel: { fontSize: 10, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  chipValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  alertRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  alertLabel: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  alertValue: { fontSize: 20, fontFamily: "Inter_700Bold", marginTop: 2 },
  alertDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, marginTop: 4 },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  stageBar: { flexDirection: "row", height: 36, borderRadius: 8, overflow: "hidden", marginBottom: 10 },
  stageSegment: { alignItems: "center", justifyContent: "center" },
  stageSegLabel: { fontSize: 11, fontFamily: "Inter_700Bold" },
  stageStats: { flexDirection: "row", gap: 20 },
  stageStat: { flexDirection: "row", alignItems: "center", gap: 6 },
  stageDot: { width: 8, height: 8, borderRadius: 4 },
  stageStatLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  movChip: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8 },
  movLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  emptyInsight: { fontSize: 13, fontFamily: "Inter_400Regular" },
  aiChip: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 12 },
  aiLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  aiInsight: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 6 },
  calRow: { flexDirection: "row", paddingHorizontal: 12, gap: 6, paddingBottom: 16 },
  calSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  calDay: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 10, borderWidth: 1, gap: 3 },
  calDayName: { fontSize: 9, fontFamily: "Inter_500Medium" },
  calDayNum: { fontSize: 14, fontFamily: "Inter_700Bold" },
  calDot: { width: 5, height: 5, borderRadius: 3 },
  selectedSession: { borderTopWidth: 1, padding: 14 },
  selTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  selRow: { flexDirection: "row", gap: 16 },
  selStat: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
