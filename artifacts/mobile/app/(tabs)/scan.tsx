import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, Image, StyleSheet, Linking } from "react-native";
import * as ImagePicker from "expo-image-picker";

export default function IndexTab() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const askCameraThenTakePhoto = () => {
    Alert.alert(
      "Camera access",
      "SleepSense needs your back camera to take a photo of a prescription.",
      [
        { text: "Not now", style: "cancel" },
        {
          text: "Allow",
          onPress: async () => {
            const perm = await ImagePicker.requestCameraPermissionsAsync();

            if (!perm.granted) {
              Alert.alert(
                "Permission denied",
                "Camera permission is off. You can enable it in Settings.",
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

            if (!result.canceled) {
              setPhotoUri(result.assets[0].uri);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan / Upload</Text>

      <TouchableOpacity style={styles.btn} onPress={askCameraThenTakePhoto}>
        <Text style={styles.btnText}>Take prescription photo</Text>
      </TouchableOpacity>

      {photoUri ? <Image source={{ uri: photoUri }} style={styles.preview} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
  btn: { backgroundColor: "#2E7D32", padding: 14, borderRadius: 12 },
  btnText: { color: "white", fontWeight: "700", textAlign: "center" },
  preview: { width: "100%", height: 260, borderRadius: 12, marginTop: 16 },
});