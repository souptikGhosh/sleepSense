import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#050B18" }, animation: "fade" }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}
