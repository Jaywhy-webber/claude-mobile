import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import { parseQrPayload, saveSession } from '../session';
import { theme } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Setup'>;
};

export function SetupScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);

  const handleBarCodeScanned = useCallback(
    async (result: BarcodeScanningResult) => {
      if (!scanning) return;
      setScanning(false);

      const session = parseQrPayload(result.data);
      if (!session) {
        setScanning(true);
        return;
      }

      await saveSession(session);
      navigation.replace('Terminal');
    },
    [scanning, navigation],
  );

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera access is required to scan the QR code.</Text>
        <Text style={styles.link} onPress={requestPermission}>
          Grant Permission
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
      />
      <View style={styles.overlay}>
        <Text style={styles.hint}>Scan QR code from terminal</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  camera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
  },
  text: {
    color: theme.colors.textSecondary,
    fontFamily: theme.font.family,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  hint: {
    color: theme.colors.text,
    fontFamily: theme.font.family,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  link: {
    color: theme.colors.accent,
    fontFamily: theme.font.family,
    fontSize: 16,
    marginTop: 16,
  },
});
