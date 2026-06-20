import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'claudeMobile.session';

export interface Session {
  relay: string;
  token: string;
}

export async function getSession(): Promise<Session | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.relay === 'string' && typeof parsed.token === 'string') {
      return parsed as Session;
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveSession(session: Session): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function parseQrPayload(data: string): Session | null {
  try {
    const parsed = JSON.parse(data);
    if (typeof parsed.relay === 'string' && typeof parsed.token === 'string') {
      return { relay: parsed.relay, token: parsed.token };
    }
    return null;
  } catch {
    return null;
  }
}
