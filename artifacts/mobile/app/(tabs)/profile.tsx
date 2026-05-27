import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useSession } from "@/context/SessionContext";
import GlowCard from "@/components/GlowCard";

type SensorKey = "spo2" | "hr" | "temp" | "motion";

const SENSORS: Array<{ key: SensorKey; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: "spo2", label: "SpO2 Sensor", icon: "water-outline" },
  { key: "hr", label: "Heart Rate Sensor", icon: "heart-outline" },
  { key: "temp", label: "Temperature Sensor", icon: "thermometer-outline" },
  { key: "motion", label: "Motion Sensor", icon: "move-outline" },
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { deviceConnected, batteryLevel, sensorStatus, savedSessions, reconnectDevice } = useSession();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const spinAnim = useRef(new Animated.Value(0)).current;
  const [diagRunning, setDiagRunning] = useState(false);
  const [diagResults, setDiagResults] = useState<Record<SensorKey, boolean> | null>(null);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  const runDiag = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDiagRunning(true);
    setDiagResults(null);
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 800, useNativeDriver: true })
    ).start();
    setTimeout(() => {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
      setDiagRunning(false);
      setDiagResults({ spo2: true, hr: true, temp: true, motion: true });
    }, 2500);
  };

  const handleReconnect = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    reconnectDevice();
  };

  const lastSession = savedSessions[0];
  const totalSessions = savedSessions.length;
  const avgScore = savedSessions.length
    ? Math.round(savedSessions.reduce((a, b) => a + b.sleepScore, 0) / savedSessions.length)
    : 84;

  const statusColor = deviceConnected ? colors.success : colors.danger;
  const statusLabel = deviceConnected ? "Connected" : "Disconnected";
  const batteryColor = batteryLevel > 50 ? colors.success : batteryLevel > 20 ? colors.warning : colors.danger;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={["#0A1628", colors.background]} style={[styles.headerGrad, { paddingTop: topInset + 16 }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Profile</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomInset + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        <GlowCard glowColor={colors.primary} style={{ marginBottom: 16 }}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: `${colors.primary}20`, borderColor: `${colors.primary}50` }]}>
              <Ionicons name="person-outline" size={30} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.userName, { color: colors.foreground }]}>{user?.name ?? "User"}</Text>
              <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{user?.email ?? ""}</Text>
              <View style={styles.tagRow}>
                <View style={[styles.tag, { backgroundColor: `${colors.primary}15` }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>Age {user?.age ?? 28}</Text>
                </View>
                <View style={[styles.tag, { backgroundColor: `${colors.danger}15` }]}>
                  <Text style={[styles.tagText, { color: colors.danger }]}>{user?.bloodType ?? "O+"}</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
            <View style={styles.statCell}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{totalSessions}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Sessions</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statCell}>
              <Text style={[styles.statValue, { color: colors.success }]}>{avgScore}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Avg Score</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statCell}>
              <Text style={[styles.statValue, { color: colors.warning }]}>
                {lastSession ? `${Math.floor(lastSession.duration / 60)}h ${lastSession.duration % 60}m` : "0h"}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Last Sleep</Text>
            </View>
          </View>
        </GlowCard>

        <GlowCard glowColor={statusColor} style={{ marginBottom: 16 }}>
          <View style={styles.deviceRow}>
            <View style={styles.deviceInfo}>
              <View style={[styles.deviceIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="watch-outline" size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.deviceName, { color: colors.foreground }]}>SleepBand Pro</Text>
                <View style={styles.connRow}>
                  <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
                  <Text style={[styles.connText, { color: statusColor }]}>{statusLabel}</Text>
                </View>
              </View>
            </View>
            <View style={[styles.battWrap, { borderColor: batteryColor }]}>
              <Ionicons name="battery-half-outline" size={14} color={batteryColor} />
              <Text style={[styles.battText, { color: batteryColor }]}>{batteryLevel}%</Text>
            </View>
          </View>

          <View style={[styles.connTypeRow, { borderTopColor: colors.border }]}>
            <View style={styles.connType}>
              <Ionicons name="bluetooth-outline" size={14} color={colors.primary} />
              <Text style={[styles.connTypeText, { color: colors.mutedForeground }]}>Bluetooth 5.0</Text>
            </View>
            <View style={styles.connType}>
              <Ionicons name="wifi-outline" size={14} color={deviceConnected ? colors.success : colors.mutedForeground} />
              <Text style={[styles.connTypeText, { color: colors.mutedForeground }]}>WiFi Sync</Text>
            </View>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: colors.primary, backgroundColor: `${colors.primary}10` }]}
              onPress={handleReconnect}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh-outline" size={16} color={colors.primary} />
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>Reconnect</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: colors.accent, backgroundColor: `${colors.accent}10` }]}
              onPress={runDiag}
              activeOpacity={0.8}
              disabled={diagRunning}
            >
              <Animated.View style={{ transform: [{ rotate: diagRunning ? spin : "0deg" }] }}>
                <Ionicons name="pulse-outline" size={16} color={colors.accent} />
              </Animated.View>
              <Text style={[styles.actionBtnText, { color: colors.accent }]}>
                {diagRunning ? "Running..." : "Diagnostics"}
              </Text>
            </TouchableOpacity>
          </View>
        </GlowCard>

        <GlowCard style={{ marginBottom: 16 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sensor Diagnostics</Text>
          {SENSORS.map((sensor, i) => {
            const active = diagResults ? diagResults[sensor.key] : sensorStatus[sensor.key];
            const statusC = active ? colors.success : colors.danger;
            return (
              <View
                key={sensor.key}
                style={[styles.sensorRow, i < SENSORS.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
              >
                <View style={[styles.sensorIcon, { backgroundColor: `${statusC}15` }]}>
                  <Ionicons name={sensor.icon} size={16} color={statusC} />
                </View>
                <Text style={[styles.sensorLabel, { color: colors.foreground }]}>{sensor.label}</Text>
                <View style={[styles.sensorBadge, { backgroundColor: `${statusC}20`, borderColor: `${statusC}60` }]}>
                  <View style={[styles.sensorDot, { backgroundColor: statusC }]} />
                  <Text style={[styles.sensorStatus, { color: statusC }]}>
                    {diagRunning ? "Checking" : active ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>
            );
          })}
        </GlowCard>

        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: colors.border }]}
          onPress={logout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.mutedForeground} />
          <Text style={[styles.logoutText, { color: colors.mutedForeground }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGrad: { paddingHorizontal: 24, paddingBottom: 20 },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold" },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  profileRow: { flexDirection: "row", gap: 14, alignItems: "center", marginBottom: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  userName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  userEmail: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  tagRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  statsRow: { flexDirection: "row", borderTopWidth: 1, paddingTop: 14, marginTop: 4 },
  statCell: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  statDivider: { width: 1, marginVertical: 4 },
  deviceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  deviceInfo: { flexDirection: "row", gap: 12, alignItems: "center" },
  deviceIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  deviceName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  connRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
  statusIndicator: { width: 7, height: 7, borderRadius: 4 },
  connText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  battWrap: { flexDirection: "row", gap: 4, alignItems: "center", borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  battText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  connTypeRow: { flexDirection: "row", gap: 20, borderTopWidth: 1, paddingTop: 12, marginTop: 4, marginBottom: 12 },
  connType: { flexDirection: "row", gap: 6, alignItems: "center" },
  connTypeText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  btnRow: { flexDirection: "row", gap: 12 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 40, borderRadius: 10, borderWidth: 1 },
  actionBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  sensorRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  sensorIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  sensorLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  sensorBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  sensorDot: { width: 6, height: 6, borderRadius: 3 },
  sensorStatus: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  logoutText: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
