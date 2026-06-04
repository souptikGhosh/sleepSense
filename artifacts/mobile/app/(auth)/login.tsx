import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, Platform, KeyboardAvoidingView, ScrollView, Dimensions,
} from "react-native";
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming,
  withSpring, withDelay, Easing, interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

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
    <Animated.View style={[{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: size / 2, backgroundColor: "#cfd8dc" }, style]} />
  );
}

function MoonIcon() {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withRepeat(withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.sin) }), -1, true);
    glow.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: glow.value,
  }));

  return (
    <Animated.View style={[styles.moonWrap, style]}>
      <Text style={styles.moonEmoji}>🌙</Text>
    </Animated.View>
  );
}

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const formSlide = useSharedValue(60);
  const formOpacity = useSharedValue(0);

  useEffect(() => {
    formSlide.value = withDelay(300, withSpring(0, { damping: 18, stiffness: 120 }));
    formOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
  }, []);

  const formStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: formSlide.value }],
    opacity: formOpacity.value,
  }));

  const getInputBorder = (field: string) => focusedField === field ? colors.primary : colors.border;
  const getInputGlow = (field: string) => focusedField === field ? `${colors.primary}40` : "transparent";

  const handleSubmit = async () => {
    if (!email || !password || (mode === "signup" && !name)) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
        router.replace("/(tabs)/dashboard");
      } else {
        await signup(email, password, name);
        router.replace("/(auth)/profile-setup");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={[styles.container, { backgroundColor: "#1a2a35" }]}>
        <LinearGradient colors={["#1a2a35", "#1a2a35", "#263238"]} style={StyleSheet.absoluteFill} />

        {/* Floating stars */}
        {STARS.map((s) => <Star key={s.id} {...s} />)}

        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={[styles.topBar, { paddingTop: topInset + 12 }]}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <MoonIcon />

            <View style={{ alignItems: "center", marginBottom: 8 }}>
              <Text style={[styles.appName, { color: colors.foreground }]}>SleepSense</Text>
              <Text style={[styles.tagline, { color: colors.mutedForeground }]}>Medical Sleep Monitor</Text>
            </View>

            {/* Glassmorphism card */}
            <Animated.View style={[styles.glassCard, formStyle]}>
              <LinearGradient
                colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.03)"]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />

              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, mode === "login" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                  onPress={() => setMode("login")}
                >
                  <Text style={[styles.toggleText, { color: mode === "login" ? colors.primary : colors.mutedForeground }]}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, mode === "signup" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                  onPress={() => setMode("signup")}
                >
                  <Text style={[styles.toggleText, { color: mode === "signup" ? colors.primary : colors.mutedForeground }]}>Create Account</Text>
                </TouchableOpacity>
              </View>

              {mode === "signup" && (
                <View style={[styles.inputWrap, { borderColor: getInputBorder("name"), backgroundColor: "rgba(255,255,255,0.06)" }]}>
                  <Ionicons name="person-outline" size={18} color={colors.mutedForeground} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="Full Name"
                    placeholderTextColor={colors.mutedForeground}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              )}

              <View style={[styles.inputWrap, { borderColor: getInputBorder("email"), backgroundColor: "rgba(255,255,255,0.06)" }]}>
                <Ionicons name="mail-outline" size={18} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Email address"
                  placeholderTextColor={colors.mutedForeground}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <View style={[styles.inputWrap, { borderColor: getInputBorder("password"), backgroundColor: "rgba(255,255,255,0.06)" }]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Password"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity onPress={() => setShowPass((v) => !v)}>
                  <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
                    {mode === "login" ? "Sign In" : "Create Account"}
                  </Text>
                )}
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or</Text>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              </View>

              <TouchableOpacity
                style={[styles.googleBtn, { borderColor: colors.border, backgroundColor: "rgba(255,255,255,0.06)" }]}
                activeOpacity={0.85}
              >
                <Ionicons name="logo-google" size={18} color={colors.mutedForeground} />
                <Text style={[styles.googleText, { color: colors.foreground }]}>Continue with Google</Text>
              </TouchableOpacity>

              <Text style={[styles.terms, { color: colors.mutedForeground }]}>
                By continuing, you agree to our Terms of Service and Privacy Policy
              </Text>
            </Animated.View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingHorizontal: 20, paddingBottom: 8 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 16, gap: 16, alignItems: "center" },
  moonWrap: { alignItems: "center", justifyContent: "center", shadowColor: "#1e88e5", shadowRadius: 20, shadowOffset: { width: 0, height: 0 } },
  moonEmoji: { fontSize: 56 },
  appName: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  tagline: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  glassCard: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 24,
    gap: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  toggleRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#455a64", marginBottom: 4 },
  toggleBtn: { flex: 1, alignItems: "center", paddingBottom: 12 },
  toggleText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: 12, borderWidth: 1,
    elevation: 0,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  submitBtn: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 4 },
  submitText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  googleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, height: 52, borderRadius: 14, borderWidth: 1 },
  googleText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  terms: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 17 },
});
