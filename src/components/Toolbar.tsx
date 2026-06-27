import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';

const BUTTONS = [
  { label: 'Ctrl+C', sequence: '\x03' },
  { label: 'Tab', sequence: '\x09' },
  { label: '↑', sequence: '\x1b[A' },
  { label: '↓', sequence: '\x1b[B' },
  { label: 'Esc', sequence: '\x1b' },
  { label: 'Enter', sequence: '\r' },
] as const;

interface ToolbarProps {
  onSend: (data: string) => void;
}

export function Toolbar({ onSend }: ToolbarProps) {
  return (
    <View style={styles.container} testID="toolbar">
      {BUTTONS.map(({ label, sequence }) => (
        <TouchableOpacity
          key={label}
          style={styles.button}
          onPress={() => onSend(sequence)}
          activeOpacity={0.6}
        >
          <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: 4,
  },
  label: {
    color: theme.colors.accent,
    fontFamily: theme.font.family,
    fontSize: 12,
  },
});
