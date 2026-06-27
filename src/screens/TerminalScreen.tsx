import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import { getSession } from '../session';
import type { Session } from '../session';
import { theme } from '../theme';
import { XTERM_HTML } from '../xterm-html';
import { Toolbar } from '../components/Toolbar';

const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30_000;

export function TerminalScreen() {
  const webViewRef = useRef<WebView>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [desktopConnected, setDesktopConnected] = useState(false);

  const connect = useCallback(() => {
    const sess = sessionRef.current;
    if (!sess) return;

    const ws = new WebSocket(sess.relay);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
      ws.send(JSON.stringify({ token: sess.token, role: 'mobile' }));
    };

    ws.onmessage = (event: MessageEvent) => {
      setDesktopConnected(true);
      webViewRef.current?.postMessage(
        JSON.stringify({ type: 'write', data: event.data }),
      );
    };

    ws.onclose = () => {
      const delay = reconnectDelayRef.current;
      reconnectDelayRef.current = Math.min(
        reconnectDelayRef.current * 2,
        MAX_RECONNECT_DELAY,
      );
      reconnectTimerRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      // error is always followed by close
    };
  }, []);

  useEffect(() => {
    getSession().then((sess) => {
      if (!sess) return;
      sessionRef.current = sess;
      connect();
    });

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  const sendToRelay = useCallback((data: string) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }, []);

  const handleWebViewMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as Record<string, unknown>;
      if (msg.type === 'resize') {
        sendToRelay(
          JSON.stringify({
            type: 'resize',
            cols: msg.cols,
            rows: msg.rows,
          }),
        );
      } else if (msg.type === 'input') {
        sendToRelay(msg.data as string);
      }
    } catch {
      // ignore invalid messages
    }
  }, [sendToRelay]);

  const handleKeyboardInput = useCallback((text: string) => {
    if (text.length > 0) {
      sendToRelay(text);
    }
  }, [sendToRelay]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: XTERM_HTML }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        onMessage={handleWebViewMessage}
      />
      {!desktopConnected && (
        <View style={styles.waitingOverlay}>
          <Text style={styles.waitingText}>Waiting for desktop…</Text>
        </View>
      )}
      <Toolbar onSend={sendToRelay} />
      <TextInput
        testID="keyboard-input"
        style={styles.hiddenInput}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        blurOnSubmit={false}
        onChangeText={handleKeyboardInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  webview: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  waitingOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  waitingText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.font.family,
    fontSize: theme.font.size,
  },
  hiddenInput: {
    height: 1,
    width: 1,
    opacity: 0,
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
  },
});
