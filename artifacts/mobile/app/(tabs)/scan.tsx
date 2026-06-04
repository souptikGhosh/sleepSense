import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, Image, StyleSheet, Linking, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export default function ScanTab() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const askCameraThenTakePhoto = () => {
    Alert.alert(
      "Camera Access",
      "SleepSense needs your camera to scan a prescription.",
      [
        { text: "Not Now", style: "cancel" },
        {
          text: "Allow",
          onPress: async () => {
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if (!perm.granted) {
              Alert.alert(
                "Permission Denied",
                "Enable camera access in Settings.",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Open Settings", onPress: () => Linking.openSettings() },
                ]
              );
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              quality: 0.8,
              allowsEditing: true,
              cameraType: ImagePicker.CameraType.back,
            });
            if (!result.canceled) setPhotoUri(result.assets[0].uri);
          },
        },
      ]
    );
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={["#1a2a35", colors.background]} style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.heading, { color: colors.foreground }]}>Prescription Scanner</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>Scan or upload a prescription for analysis</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={askCameraThenTakePhoto}
          activeOpacity={0.85}
        >
          <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}18` }]}>
            <Ionicons name="camera-outline" size={32} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Take Photo</Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Use back camera to photograph prescription</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={pickFromGallery}
          activeOpacity={0.85}
        >
          <View style={[styles.iconWrap, { backgroundColor: `${colors.accent}30` }]}>
            <Ionicons name="images-outline" size={32} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Upload from Gallery</Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Choose an existing photo</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>

        {photoUri ? (
          <View style={[styles.previewWrap, { borderColor: colors.border }]}>
            <Image source={{ uri: photoUri }} style={styles.preview} />
            <TouchableOpacity
              style={[styles.retakeBtn, { backgroundColor: colors.secondary }]}
              onPress={() => setPhotoUri(null)}
            >
              <Ionicons name="refresh-outline" size={16} color={colors.foreground} />
              <Text style={[styles.retakeText, { color: colors.foreground }]}>Retake</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.placeholder, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
            <Ionicons name="document-text-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.placeholderText, { color: colors.mutedForeground }]}>No prescription scanned yet</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingBottom: 20 },
  heading: { fontSize: 24, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4 },
  card: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, borderWidth: 1 },
  iconWrap: { width: 56, height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cardSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  previewWrap: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  preview: { width: "100%", height: 280 },
  retakeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 12 },
  retakeText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  placeholder: { height: 200, borderRadius: 16, borderWidth: 1, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 12 },
  placeholderText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});