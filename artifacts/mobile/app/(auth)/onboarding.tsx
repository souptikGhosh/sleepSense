import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Animated,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const { width: SW } = Dimensions.get("window");

const slides = [
  {
    icon: "pulse-outline" as const,
    title: "Medical-Grade\nSleep Monitoring",
    body: "Track SpO2, heart rate, temperature, and movement in real time while you sleep.",
    color: "#00D4FF",
  },
  {
    icon: "stats-chart-outline" as const,
    title: "Real-Time\nLive Analysis",
    body: "Continuous streaming data from your wearable band, visualized as it happens.",
    color: "#00FFB3",
  },
  {
    icon: "shield-checkmark-outline" as const,
    title: "AI-Powered\nSleep Insights",
    body: "Emergency alerts, sleep stage detection, and intelligent health recommendations.",
    color: "#A78BFA",
  },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const handleScroll = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SW);
    setActiveIndex(idx);
  };

  const goNext = () => {
    if (activeIndex < slides.length - 1) {
      scrollRef.current?.scrollTo({ x: SW * (activeIndex + 1), animated: true });
    } else {
      router.push("/(auth)/login");
    }
  };

  const activeSlide = slides[activeIndex];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#050B18", "#0A1628", "#050B18"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: topInset + 16 }]}>
        <View style={styles.logo}>
          <Ionicons name="medical-outline" size={20} color={colors.primary} />
          <Text style={[styles.logoText, { color: colors.foreground }]}>SleepSense</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
          <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {slides.map((slide, i) => (
          <View key={i} style={[styles.slide, { width: SW }]}>
            <View style={[styles.iconCircle, { borderColor: `${slide.color}40`, backgroundColor: `${slide.color}12` }]}>
              <View style={[styles.iconInner, { backgroundColor: `${slide.color}25` }]}>
                <Ionicons name={slide.icon} size={44} color={slide.color} />
              </View>
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>{slide.title}</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomInset + 20 }]}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === activeIndex ? activeSlide.color : colors.border,
                  width: i === activeIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: activeSlide.color }]}
          onPress={goNext}
          activeOpacity={0.85}
        >
          <Text style={[styles.btnText, { color: colors.background }]}>
            {activeIndex === slides.length - 1 ? "Get Started" : "Next"}
          </Text>
          <Ionicons name="arrow-forward" size={18} color={colors.background} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/login")} style={styles.signinBtn}>
          <Text style={[styles.signinText, { color: colors.mutedForeground }]}>
            Already have an account?{" "}
            <Text style={{ color: colors.primary }}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  logo: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoText: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  skipText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  slide: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 24,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    lineHeight: 40,
  },
  body: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 24,
  },
  footer: { paddingHorizontal: 24, gap: 16, alignItems: "center" },
  dots: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: { height: 8, borderRadius: 4 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    height: 52,
    borderRadius: 14,
  },
  btnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  signinBtn: { paddingVertical: 8 },
  signinText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
