import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useSession } from "@/context/SessionContext";
import RealtimeChart from "@/components/RealtimeChart";

const { width: SW } = Dimensions.get("window");
const CHART_W = SW - 40;

function formatTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function SessionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { startSession, stopSession, isSessionActive, sessionData, currentReading, sessionDuration } = useSession();
  const [showConfirm, setShowConfirm] = useState(false);
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const spo2Data = sessionData.map((r) => r.spo2);
  const hrData = sessionData.map((r) => r.heart_rate);

  useEffect(() => {
    startSession();
    return () => {};
  }, []);

  const handleStop = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowConfirm(true);
  };

  const confirmStop = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowConfirm(false);
    await stopSession();
    router.replace("/analysis");
  };

  const stageColor = (stage?: string) => {
    if (stage === "REM") return colors.primary;
    if (stage === "NREM") return colors.movColor;
    return colors.mutedForeground;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={["#0A1628", colors.background]} style={[styles.header, { paddingTop: topInset + 10 }]}>
        <View style={styles.headerRow}>
          <View style={styles.recIndicator}>
            <View style={[styles.recDot, { backgroundColor: colors.danger }]} />
            <Text style={[styles.recLabel, { color: colors.danger }]}>REC</Text>
          </View>
          <Text style={[styles.timerText, { color: colors.foreground }]}>{formatTime(sessionDuration)}</Text>
          <View style={[styles.stageBadge, { backgroundColor: `${stageColor(currentReading?.sleep_stage)}20`, borderColor: `${stageColor(currentReading?.sleep_stage)}50` }]}>
            <Text style={[styles.stageText, { color: stageColor(currentReading?.sleep_stage) }]}>
              {currentReading?.sleep_stage ?? "—"}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 90 }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.readingsRow]}>
          <View style={[styles.readingChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="water" size={12} color={colors.spo2Color} />
            <Text style={[styles.chipLabel, { color: colors.mutedForeground }]}>SpO2</Text>
            <Text style={[styles.chipValue, { color: colors.spo2Color }]}>{currentReading?.spo2 ?? "--"}%</Text>
          </View>
          <View style={[styles.readingChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="heart" size={12} color={colors.hrColor} />
            <Text style={[styles.chipLabel, { color: colors.mutedForeground }]}>HR</Text>
            <Text style={[styles.chipValue, { color: colors.hrColor }]}>{currentReading?.heart_rate ?? "--"} bpm</Text>
          </View>
          <View style={[styles.readingChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="thermometer" size={12} color={colors.tempColor} />
            <Text style={[styles.chipLabel, { color: colors.mutedForeground }]}>Temp</Text>
            <Text style={[styles.chipValue, { color: colors.tempColor }]}>{currentReading?.temperature ?? "--"}°</Text>
          </View>
          <View style={[styles.readingChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="move" size={12} color={colors.movColor} />
            <Text style={[styles.chipLabel, { color: colors.mutedForeground }]}>Move</Text>
            <Text style={[styles.chipValue, { color: currentReading?.movement ? colors.warning : colors.success }]}>
              {currentReading?.movement ? "Yes" : "Still"}
            </Text>
          </View>
        </View>

        <RealtimeChart
          data={spo2Data}
          color={colors.spo2Color}
          label="Blood Oxygen (SpO2)"
          unit="%"
          minVal={88}
          maxVal={100}
          height={140}
          width={CHART_W}
          currentValue={currentReading?.spo2}
        />

        <RealtimeChart
          data={hrData}
          color={colors.hrColor}
          label="Heart Rate"
          unit="bpm"
          minVal={40}
          maxVal={120}
          height={140}
          width={CHART_W}
          currentValue={currentReading?.heart_rate}
        />

        <View style={[styles.sensorStatusWrap, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.sensorTitle, { color: colors.mutedForeground }]}>Sensor Status</Text>
          <View style={styles.sensorGrid}>
            {[
              { label: "SpO2", active: true, color: colors.spo2Color },
              { label: "Heart Rate", active: true, color: colors.hrColor },
              { label: "Temperature", active: true, color: colors.tempColor },
              { label: "Motion", active: true, color: colors.movColor },
            ].map((s) => (
              <View key={s.label} style={styles.sensorCell}>
                <View style={[styles.sensorDot, { backgroundColor: `${s.color}20` }]}>
                  <View style={[styles.sensorDotInner, { backgroundColor: s.color }]} />
                </View>
                <Text style={[styles.sensorCellLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: bottomInset + 16 }]}>
        <TouchableOpacity style={[styles.stopBtn, { backgroundColor: `${colors.danger}15`, borderColor: colors.danger }]} onPress={handleStop} activeOpacity={0.85}>
          <Ionicons name="stop-circle-outline" size={22} color={colors.danger} />
          <Text style={[styles.stopText, { color: colors.danger }]}>Stop Session</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="warning-outline" size={36} color={colors.warning} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Stop Recording?</Text>
            <Text style={[styles.modalBody, { color: colors.mutedForeground }]}>
              Are you sure you want to stop the recording session? This prevents accidental touches during sleep.
            </Text>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowConfirm(false)}
              activeOpacity={0.85}
            >
              <Text style={[styles.modalBtnText, { color: colors.background }]}>Continue Session</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtnOutline, { borderColor: colors.danger }]}
              onPress={confirmStop}
              activeOpacity={0.85}
            >
              <Text style={[styles.modalBtnText, { color: colors.danger }]}>Confirm Stop</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  recIndicator: { flexDirection: "row", alignItems: "center", gap: 6 },
  recDot: { width: 8, height: 8, borderRadius: 4 },
  recLabel: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  timerText: { fontSize: 36, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  stageBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  stageText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },
  readingsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  readingChip: { flex: 1, borderWidth: 1, borderRadius: 10, alignItems: "center", padding: 8, gap: 2 },
  chipLabel: { fontSize: 9, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  chipValue: { fontSize: 13, fontFamily: "Inter_700Bold" },
  sensorStatusWrap: { borderWidth: 1, padding: 14, marginBottom: 16 },
  sensorTitle: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 12 },
  sensorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  sensorCell: { flexDirection: "row", alignItems: "center", gap: 8, width: "45%" },
  sensorDot: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sensorDotInner: { width: 8, height: 8, borderRadius: 4 },
  sensorCellLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  bottomBar: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: "#050B18" },
  stopBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, height: 52, borderRadius: 14, borderWidth: 1 },
  stopText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  modal: { width: "100%", borderRadius: 20, borderWidth: 1, padding: 24, gap: 14, alignItems: "center" },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  modalBody: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
  modalBtn: { width: "100%", height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  modalBtnOutline: { width: "100%", height: 48, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  modalBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
