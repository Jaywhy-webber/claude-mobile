import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

export function TerminalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Waiting for desktop…</Text>
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
  text: {
    color: theme.colors.textSecondary,
    fontFamily: theme.font.family,
    fontSize: theme.font.size,
  },
});
