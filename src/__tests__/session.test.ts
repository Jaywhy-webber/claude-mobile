import { getSession, saveSession, parseQrPayload } from '../session';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockedStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('parseQrPayload', () => {
  it('parses a valid JSON payload with relay and token', () => {
    const result = parseQrPayload('{"relay":"wss://example.com","token":"abc123"}');
    expect(result).toEqual({ relay: 'wss://example.com', token: 'abc123' });
  });

  it('returns null for invalid JSON', () => {
    expect(parseQrPayload('not json')).toBeNull();
  });

  it('returns null when relay is missing', () => {
    expect(parseQrPayload('{"token":"abc"}')).toBeNull();
  });

  it('returns null when token is missing', () => {
    expect(parseQrPayload('{"relay":"wss://example.com"}')).toBeNull();
  });

  it('returns null when relay is not a string', () => {
    expect(parseQrPayload('{"relay":123,"token":"abc"}')).toBeNull();
  });

  it('ignores extra fields and returns only relay and token', () => {
    const result = parseQrPayload('{"relay":"wss://r.com","token":"t","extra":"x"}');
    expect(result).toEqual({ relay: 'wss://r.com', token: 't' });
  });
});

describe('getSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when nothing is stored', async () => {
    mockedStorage.getItem.mockResolvedValue(null);
    const result = await getSession();
    expect(result).toBeNull();
  });

  it('returns session when valid data is stored', async () => {
    mockedStorage.getItem.mockResolvedValue('{"relay":"wss://r.com","token":"t"}');
    const result = await getSession();
    expect(result).toEqual({ relay: 'wss://r.com', token: 't' });
  });

  it('returns null when stored data is invalid JSON', async () => {
    mockedStorage.getItem.mockResolvedValue('corrupted');
    const result = await getSession();
    expect(result).toBeNull();
  });

  it('returns null when stored data is missing required fields', async () => {
    mockedStorage.getItem.mockResolvedValue('{"relay":"wss://r.com"}');
    const result = await getSession();
    expect(result).toBeNull();
  });
});

describe('saveSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores session as JSON under the correct key', async () => {
    mockedStorage.setItem.mockResolvedValue(undefined);
    await saveSession({ relay: 'wss://r.com', token: 'tok' });
    expect(mockedStorage.setItem).toHaveBeenCalledWith(
      'claudeMobile.session',
      '{"relay":"wss://r.com","token":"tok"}'
    );
  });
});
