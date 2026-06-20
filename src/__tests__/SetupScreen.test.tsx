import React from 'react';
import { View } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SetupScreen } from '../screens/SetupScreen';
import * as session from '../session';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

let mockPermission: any = null;
const mockRequestPermission = jest.fn();
let capturedOnBarcodeScanned: ((result: any) => void) | undefined;

jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    CameraView: React.forwardRef((props: any, _ref: any) => {
      capturedOnBarcodeScanned = props.onBarcodeScanned;
      return React.createElement(View, { testID: 'camera-view' });
    }),
    useCameraPermissions: () => [mockPermission, mockRequestPermission],
  };
});

const mockReplace = jest.fn();
const mockNavigation = { replace: mockReplace } as any;

jest.mock('../session');
const mockedSession = session as jest.Mocked<typeof session>;

describe('SetupScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPermission = null;
    capturedOnBarcodeScanned = undefined;
  });

  it('shows a loading message while permission is pending', async () => {
    mockPermission = null;

    const { getByText } = await render(
      <SetupScreen navigation={mockNavigation} />,
    );

    expect(getByText(/Requesting camera permission/)).toBeTruthy();
  });

  it('shows a fallback message when permission is denied', async () => {
    mockPermission = { granted: false };

    const { getByText } = await render(
      <SetupScreen navigation={mockNavigation} />,
    );

    expect(getByText(/Camera access is required/)).toBeTruthy();
  });

  it('allows requesting permission when denied', async () => {
    mockPermission = { granted: false };

    const { getByText } = await render(
      <SetupScreen navigation={mockNavigation} />,
    );

    fireEvent.press(getByText('Grant Permission'));
    expect(mockRequestPermission).toHaveBeenCalled();
  });

  it('renders the camera when permission is granted', async () => {
    mockPermission = { granted: true };

    const { getByTestId, getByText } = await render(
      <SetupScreen navigation={mockNavigation} />,
    );

    expect(getByTestId('camera-view')).toBeTruthy();
    expect(getByText(/Scan QR code/)).toBeTruthy();
  });

  it('saves session and navigates on valid QR scan', async () => {
    mockPermission = { granted: true };
    mockedSession.parseQrPayload.mockReturnValue({
      relay: 'wss://relay.example.com',
      token: 'tok123',
    });
    mockedSession.saveSession.mockResolvedValue(undefined);

    await render(<SetupScreen navigation={mockNavigation} />);

    expect(capturedOnBarcodeScanned).toBeDefined();

    await waitFor(async () => {
      await capturedOnBarcodeScanned!({
        data: '{"relay":"wss://relay.example.com","token":"tok123"}',
      });
    });

    expect(mockedSession.saveSession).toHaveBeenCalledWith({
      relay: 'wss://relay.example.com',
      token: 'tok123',
    });
    expect(mockReplace).toHaveBeenCalledWith('Terminal');
  });

  it('does not navigate on invalid QR scan', async () => {
    mockPermission = { granted: true };
    mockedSession.parseQrPayload.mockReturnValue(null);

    await render(<SetupScreen navigation={mockNavigation} />);

    expect(capturedOnBarcodeScanned).toBeDefined();

    await waitFor(async () => {
      await capturedOnBarcodeScanned!({ data: 'not-valid-json' });
    });

    expect(mockedSession.saveSession).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
