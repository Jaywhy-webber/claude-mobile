import { Platform } from 'react-native';

export const theme = {
  colors: {
    background: '#0d0d0d',
    accent: '#ff6b00',
    text: '#ffffff',
    textSecondary: '#888888',
  },
  font: {
    family: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    size: 13,
  },
} as const;
