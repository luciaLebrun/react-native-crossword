import type { GuessData } from './utils';
import { serializeGuesses, deserializeGuesses } from './utils';

// ---------------------------------------------------------------------------
// AsyncStorage persistence – optional peer dependency
// ---------------------------------------------------------------------------

let AsyncStorage: {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
} | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch {
  // AsyncStorage is not installed — persistence will be silently disabled.
}

export async function saveGuesses(
  gridData: GuessData,
  storageKey: string
): Promise<void> {
  if (!AsyncStorage) return;
  const guesses = serializeGuesses(gridData);
  const saveData = { date: Date.now(), guesses };
  await AsyncStorage.setItem(storageKey, JSON.stringify(saveData));
}

export async function loadGuesses(
  gridData: GuessData,
  storageKey: string
): Promise<boolean> {
  if (!AsyncStorage) return false;
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    if (!raw) return false;
    const saveData = JSON.parse(raw) as { guesses: Record<string, string> };
    deserializeGuesses(gridData, saveData.guesses);
    return true;
  } catch {
    return false;
  }
}

export async function clearGuesses(storageKey: string): Promise<void> {
  if (!AsyncStorage) return;
  await AsyncStorage.removeItem(storageKey);
}
