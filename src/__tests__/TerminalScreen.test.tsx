import React from 'react';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
import { TerminalScreen } from '../screens/TerminalScreen';
import * as session from '../session';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('../session');
const mockedSession = session as jest.Mocked<typeof session>;

let capturedWebViewProps: Record<string, any> = {};

jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: React.forwardRef((props: any, ref: any) => {
      capturedWebViewProps = props;
      React.useImperativeHandle(ref, () => ({
        postMessage: jest.fn(),
        injectJavaScript: jest.fn(),
      }));
      return React.createElement(View, { testID: 'webview' });
    }),
  };
});

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  url: string;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((e: { data: any }) => void) | null = null;
  onerror: (() => void) | null = null;
  readyState = 0;
  binaryType = 'blob';
  static OPEN = 1;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  send = jest.fn();
  close = jest.fn();

  simulateOpen() {
    this.readyState = 1;
    this.onopen?.();
  }

  simulateMessage(data: any) {
    this.onmessage?.({ data });
  }

  simulateClose() {
    this.readyState = 3;
    this.onclose?.();
  }
}

(globalThis as any).WebSocket = MockWebSocket;

describe('TerminalScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MockWebSocket.instances = [];
    capturedWebViewProps = {};
  });

  it('shows "Waiting for desktop" on mount before receiving data', async () => {
    mockedSession.getSession.mockResolvedValue({
      relay: 'wss://relay.example.com',
      token: 'test-token',
    });

    const { getByText } = await render(<TerminalScreen />);

    await waitFor(() => {
      expect(getByText(/Waiting for desktop/)).toBeTruthy();
    });
  });

  it('connects to relay WebSocket on mount using stored session', async () => {
    mockedSession.getSession.mockResolvedValue({
      relay: 'wss://relay.example.com',
      token: 'test-token',
    });

    await render(<TerminalScreen />);

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    expect(MockWebSocket.instances[0].url).toBe('wss://relay.example.com');
  });

  it('sends handshake after WebSocket opens', async () => {
    mockedSession.getSession.mockResolvedValue({
      relay: 'wss://relay.example.com',
      token: 'test-token',
    });

    await render(<TerminalScreen />);

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    const ws = MockWebSocket.instances[0];
    await act(async () => {
      ws.simulateOpen();
    });

    expect(ws.send).toHaveBeenCalledWith(
      JSON.stringify({ token: 'test-token', role: 'mobile' }),
    );
  });

  it('hides "Waiting for desktop" after receiving data', async () => {
    mockedSession.getSession.mockResolvedValue({
      relay: 'wss://relay.example.com',
      token: 'test-token',
    });

    const { getByText, queryByText } = await render(<TerminalScreen />);

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    const ws = MockWebSocket.instances[0];
    await act(async () => {
      ws.simulateOpen();
    });

    expect(getByText(/Waiting for desktop/)).toBeTruthy();

    await act(async () => {
      ws.simulateMessage('aGVsbG8=');
    });

    expect(queryByText(/Waiting for desktop/)).toBeNull();
  });

  it('reconnects with exponential backoff on disconnect', async () => {
    mockedSession.getSession.mockResolvedValue({
      relay: 'wss://relay.example.com',
      token: 'test-token',
    });

    await render(<TerminalScreen />);

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    const ws1 = MockWebSocket.instances[0];
    await act(async () => {
      ws1.simulateOpen();
    });

    jest.useFakeTimers();

    await act(async () => {
      ws1.simulateClose();
    });

    expect(MockWebSocket.instances.length).toBe(1);

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(MockWebSocket.instances.length).toBe(2);

    const ws2 = MockWebSocket.instances[1];
    await act(async () => {
      ws2.simulateOpen();
      ws2.simulateClose();
    });

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(MockWebSocket.instances.length).toBe(3);

    jest.useRealTimers();
  });

  it('sends resize message when xterm.js reports dimensions', async () => {
    mockedSession.getSession.mockResolvedValue({
      relay: 'wss://relay.example.com',
      token: 'test-token',
    });

    await render(<TerminalScreen />);

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    const ws = MockWebSocket.instances[0];
    await act(async () => {
      ws.simulateOpen();
    });

    expect(capturedWebViewProps.onMessage).toBeDefined();
    await act(async () => {
      capturedWebViewProps.onMessage({
        nativeEvent: {
          data: JSON.stringify({ type: 'resize', cols: 80, rows: 24 }),
        },
      });
    });

    expect(ws.send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'resize', cols: 80, rows: 24 }),
    );
  });

  it('renders the toolbar with all buttons', async () => {
    mockedSession.getSession.mockResolvedValue({
      relay: 'wss://relay.example.com',
      token: 'test-token',
    });

    const { getByText } = await render(<TerminalScreen />);

    await waitFor(() => {
      expect(getByText('Ctrl+C')).toBeTruthy();
    });

    expect(getByText('Tab')).toBeTruthy();
    expect(getByText('↑')).toBeTruthy();
    expect(getByText('↓')).toBeTruthy();
    expect(getByText('Esc')).toBeTruthy();
    expect(getByText('Enter')).toBeTruthy();
  });

  it('sends Ctrl+C byte through WebSocket when toolbar button is tapped', async () => {
    mockedSession.getSession.mockResolvedValue({
      relay: 'wss://relay.example.com',
      token: 'test-token',
    });

    const { getByText } = await render(<TerminalScreen />);

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    const ws = MockWebSocket.instances[0];
    await act(async () => {
      ws.simulateOpen();
    });

    await act(async () => {
      fireEvent.press(getByText('Ctrl+C'));
    });

    expect(ws.send).toHaveBeenCalledWith('\x03');
  });

  it('sends arrow key escape sequences through WebSocket', async () => {
    mockedSession.getSession.mockResolvedValue({
      relay: 'wss://relay.example.com',
      token: 'test-token',
    });

    const { getByText } = await render(<TerminalScreen />);

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    const ws = MockWebSocket.instances[0];
    await act(async () => {
      ws.simulateOpen();
    });

    await act(async () => {
      fireEvent.press(getByText('↑'));
    });
    expect(ws.send).toHaveBeenCalledWith('\x1b[A');

    await act(async () => {
      fireEvent.press(getByText('↓'));
    });
    expect(ws.send).toHaveBeenCalledWith('\x1b[B');
  });

  it('sends native keyboard text input through WebSocket', async () => {
    mockedSession.getSession.mockResolvedValue({
      relay: 'wss://relay.example.com',
      token: 'test-token',
    });

    const { getByTestId } = await render(<TerminalScreen />);

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    const ws = MockWebSocket.instances[0];
    await act(async () => {
      ws.simulateOpen();
    });

    const input = getByTestId('keyboard-input');
    await act(async () => {
      fireEvent.changeText(input, 'hello');
    });

    expect(ws.send).toHaveBeenCalledWith('hello');
  });

  it('does not clear terminal state on reconnection', async () => {
    mockedSession.getSession.mockResolvedValue({
      relay: 'wss://relay.example.com',
      token: 'test-token',
    });

    const { queryByText } = await render(<TerminalScreen />);

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    const ws = MockWebSocket.instances[0];
    await act(async () => {
      ws.simulateOpen();
    });
    await act(async () => {
      ws.simulateMessage('aGVsbG8=');
    });

    expect(queryByText(/Waiting for desktop/)).toBeNull();

    jest.useFakeTimers();

    await act(async () => {
      ws.simulateClose();
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(queryByText(/Waiting for desktop/)).toBeNull();

    jest.useRealTimers();
  });
});
