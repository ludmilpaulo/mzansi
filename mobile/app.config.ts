import type { ExpoConfig } from "expo/config";

// Android emulator: use http://10.0.2.2:8000/api/v1 to reach Django on the host machine.
// iOS simulator can use 127.0.0.1. A physical device needs your LAN IP, e.g. http://192.168.x.x:8000/api/v1.
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

const config: ExpoConfig = {
  name: "Mzansi Visa Solutions",
  slug: "mzansi-visa",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "mzansi",
  userInterfaceStyle: "light",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "za.co.mzansivisa.client",
    config: {
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      NSCameraUsageDescription: "Mzansi uses the camera so you can photograph immigration documents for your application checklist.",
      NSPhotoLibraryUsageDescription: "Mzansi needs photo library access so you can upload existing document images.",
    },
  },
  android: {
    package: "za.co.mzansivisa.client",
    permissions: ["CAMERA"],
  },
  plugins: [
    "expo-secure-store",
    [
      "expo-image-picker",
      {
        photosPermission: "Allow Mzansi Visa Solutions to access photos so you can upload documents.",
        cameraPermission: "Allow Mzansi Visa Solutions to use the camera to photograph documents.",
      },
    ],
  ],
  extra: {
    apiBaseUrl,
  },
};

export default config;
