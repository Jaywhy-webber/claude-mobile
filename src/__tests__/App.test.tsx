import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import App from '../../App';
import * as session from '../session';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: () => [{ granted: false }, jest.fn()],
}));

jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: React.forwardRef((props: any, ref: any) => {
      return React.createElement(View, { testID: 'webview' });
    }),
  };
});

jest.mock('../session');
const mockedSession = session as jest.Mocked<typeof session>;

describe('App', () => {
  it('shows Setup screen when no session is stored', async () => {
    mockedSession.getSession.mockResolvedValue(null);

    const { getByText } = await render(<App />);

    await waitFor(() => {
      expect(getByText('Camera access is required to scan the QR code.')).toBeTruthy();
    });
  });

  it('shows Terminal screen when a session exists', async () => {
    mockedSession.getSession.mockResolvedValue({
      relay: 'wss://relay.example.com',
      token: 'test-token',
    });

    const { getByText } = await render(<App />);

    await waitFor(() => {
      expect(getByText(/Waiting for desktop/)).toBeTruthy();
    });
  });
});
