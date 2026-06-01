import Animated, {
  useSharedValue, withTiming, withRepeat, withDelay, Easing, useAnimatedStyle,
} from "react-native-reanimated";
import {Dimensions} from "react-native";
import React, { useState } from "react";
import { useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Alert, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const ACTIVITY_LEVELS = [
  { key: "sedentary", label: "Sedentary" },
  { key: "moderate", label: "Moderate" },
  { key: "active", label: "Active" },
  { key: "very_active", label: "Very Active" },
];

const { width: SW, height: SH } = Dimensions.get("window");

const STARS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  x: Math.random() * SW,
  y: Math.random() * SH,
  size: Math.random() * 2.5 + 1,
  delay: Math.random() * 3000,
  duration: Math.random() * 3000 + 2000,
}));

function Star({ x, y, size, delay, duration }: { x: number; y: number; size: number; delay: number; duration: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withRepeat(withTiming(Math.random() * 0.8 + 0.2, { duration, easing: Easing.inOut(Easing.sin) }), -1, true));
    translateY.value = withDelay(delay, withRepeat(withTiming(-8, { duration: duration * 1.5, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: size / 2, backgroundColor: "#c8e6c9" }, style]} />
  );
}

export default function ProfileSetup() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { updateProfile } = useAuth();

  const [age, setAge] = useState("");
  const [biologicalSex, setBiologicalSex] = useState<"male" | "female" | "other" | "">("");
  const [bloodType, setBloodType] = useState("");
  const [bedtime, setBedtime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [avgSleepHours, setAvgSleepHours] = useState("");
  const [sleepConsistency, setSleepConsistency] = useState<boolean | null>(null);
  const [snoringOrApnea, setSnoringOrApnea] = useState<boolean | null>(null);
  const [existingSleepDisorder, setExistingSleepDisorder] = useState<boolean | null>(null);
  const [caffeineIntake, setCaffeineIntake] = useState<boolean | null>(null);
  const [activityLevel, setActivityLevel] = useState<"sedentary" | "moderate" | "active" | "very_active" | "">("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!age || !biologicalSex || !bloodType || !avgSleepHours || !activityLevel ||
      sleepConsistency === null || snoringOrApnea === null ||
      existingSleepDisorder === null || caffeineIntake === null) {
      Alert.alert("Incomplete", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      await updateProfile({
        age: parseInt(age),
        biologicalSex,
        bloodType,
        usualBedtime: bedtime,
        usualWakeTime: wakeTime,
        avgSleepHours: parseFloat(avgSleepHours),
        sleepConsistency,
        snoringOrApnea,
        existingSleepDisorder,
        caffeineIntake,
        activityLevel,
      });
      router.replace("/(tabs)/dashboard");
    } catch {
      Alert.alert("Error", "Could not save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const YesNo = ({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) => (
    <View style={styles.yesNoRow}>
      <TouchableOpacity
        style={[styles.yesNoBtn, { borderColor: value === true ? colors.primary : colors.border, backgroundColor: value === true ? `${colors.primary}22` : colors.secondary }]}
        onPress={() => onChange(true)}
      >
        <Text style={{ color: value === true ? colors.primary : colors.mutedForeground, fontFamily: "Inter_500Medium" }}>Yes</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.yesNoBtn, { borderColor: value === false ? colors.primary : colors.border, backgroundColor: value === false ? `${colors.primary}22` : colors.secondary }]}
        onPress={() => onChange(false)}
      >
        <Text style={{ color: value === false ? colors.primary : colors.mutedForeground, fontFamily: "Inter_500Medium" }}>No</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#263238" }}>
      <LinearGradient colors={["#1a2a2e", "#263238", "#2e3d45"]} style={StyleSheet.absoluteFill} />
      {STARS.map((s) => <Star key={s.id} {...s} />)}
      <ScrollView style={{ backgroundColor: "transparent" }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: insets.top + 24, paddingBottom: 48, gap: 24 }}>
      

        <View style={{ gap: 6 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Your Health Profile</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>This helps us personalise your sleep insights</Text>
        </View>

        {/* Basic */}
        <Section title="Basic Profile" colors={colors}>
          <Field label="Age">
            <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.secondary }]}
              placeholder="e.g. 22" placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric" value={age} onChangeText={setAge} />
          </Field>

          <Field label="Biological Sex">
            <View style={styles.optionRow}>
              {(["male", "female", "other"] as const).map((s) => (
                <TouchableOpacity key={s}
                  style={[styles.optionBtn, { borderColor: biologicalSex === s ? colors.primary : colors.border, backgroundColor: biologicalSex === s ? `${colors.primary}22` : colors.secondary }]}
                  onPress={() => setBiologicalSex(s)}>
                  <Text style={{ color: biologicalSex === s ? colors.primary : colors.mutedForeground, fontFamily: "Inter_500Medium", textTransform: "capitalize" }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <Field label="Blood Type">
            <View style={styles.optionRow}>
              {BLOOD_TYPES.map((bt) => (
                <TouchableOpacity key={bt}
                  style={[styles.optionBtn, { borderColor: bloodType === bt ? colors.primary : colors.border, backgroundColor: bloodType === bt ? `${colors.primary}22` : colors.secondary }]}
                  onPress={() => setBloodType(bt)}>
                  <Text style={{ color: bloodType === bt ? colors.primary : colors.mutedForeground, fontFamily: "Inter_500Medium" }}>{bt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>
        </Section>

        {/* Sleep Schedule */}
        <Section title="Sleep Schedule" colors={colors}>
          <Field label="Usual Bedtime (HH:MM)">
            <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.secondary }]}
              placeholder="23:00" placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              maxLength={5}
              value={bedtime} 
              onChangeText={(val) => {
                const digits = val.replace(/[^0-9]/g, "");
                const formatted = digits.length > 2 ? digits.slice(0,2) + ":" + digits.slice(2,4) : digits;
                setBedtime(formatted);
              }} 
            />
          </Field>
          <Field label="Usual Wake Time (HH:MM)">
            <TextInput
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.secondary }]}
            placeholder="07:00"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            maxLength={5}
            value={wakeTime}
            onChangeText={(val) => {
              const digits = val.replace(/[^0-9]/g, "");
              const formatted = digits.length > 2 ? digits.slice(0, 2) + ":" + digits.slice(2, 4) : digits;
              setWakeTime(formatted);
            }}
            />
          </Field>
          <Field label="Average Sleep Hours">
            <TextInput
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.secondary }]}
            placeholder="e.g. 7"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            value={avgSleepHours}
            onChangeText={(val) => {
              if (val === "" || parseFloat(val) >= 0) setAvgSleepHours(val);
            }}
          />
          </Field>
        </Section>

        {/* Health */}
        <Section title="Health Flags" colors={colors}>
          <Field label="Snoring or breathing pauses during sleep?">
            <YesNo value={snoringOrApnea} onChange={setSnoringOrApnea} />
          </Field>
          <Field label="Any existing sleep disorder?">
            <YesNo value={existingSleepDisorder} onChange={setExistingSleepDisorder} />
          </Field>
          <Field label="Do you sleep at consistent times?">
            <YesNo value={sleepConsistency} onChange={setSleepConsistency} />
          </Field>
        </Section>

        {/* Lifestyle */}
        <Section title="Lifestyle" colors={colors}>
          <Field label="Regular caffeine intake?">
            <YesNo value={caffeineIntake} onChange={setCaffeineIntake} />
          </Field>
          <Field label="Activity Level">
            <View style={styles.optionRow}>
              {ACTIVITY_LEVELS.map((a) => (
                <TouchableOpacity key={a.key}
                  style={[styles.optionBtn, { borderColor: activityLevel === a.key ? colors.primary : colors.border, backgroundColor: activityLevel === a.key ? `${colors.primary}22` : colors.secondary }]}
                  onPress={() => setActivityLevel(a.key as any)}>
                  <Text style={{ color: activityLevel === a.key ? colors.primary : colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 12 }}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>
        </Section>

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.background} /> :
            <Text style={{ color: colors.background, fontFamily: "Inter_600SemiBold", fontSize: 16 }}>Save & Continue</Text>}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={{ gap: 16 }}>
      <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold", fontSize: 13, letterSpacing: 1, textTransform: "uppercase" }}>{title}</Text>
      <View style={{ gap: 14 }}>{children}</View>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: "#8A9BB5", fontFamily: "Inter_400Regular", fontSize: 13 }}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular" },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  yesNoRow: { flexDirection: "row", gap: 10 },
  yesNoBtn: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  saveBtn: { height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 8 },
});