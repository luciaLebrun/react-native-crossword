import { saveGuesses, loadGuesses, clearGuesses } from '../storage';
import type { UsedCellData } from '../types';
import { createGridData } from '../utils';
import type { CluesInput } from '../types';

// ---------------------------------------------------------------------------
// Mock AsyncStorage
// ---------------------------------------------------------------------------

const store: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
  },
}));

const sampleData: CluesInput = {
  across: {
    '1': { clue: 'Test', answer: 'AB', row: 0, col: 0 },
  },
  down: {
    '1': { clue: 'Test', answer: 'AC', row: 0, col: 0 },
  },
};

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
});

describe('storage', () => {
  test('saveGuesses and loadGuesses round-trip', async () => {
    const { gridData } = createGridData(sampleData);
    (gridData[0]![0] as UsedCellData).guess = 'A';
    (gridData[0]![1] as UsedCellData).guess = 'B';

    await saveGuesses(gridData, 'test-key');
    expect(store['test-key']).toBeDefined();

    // Clear guesses in memory
    (gridData[0]![0] as UsedCellData).guess = '';
    (gridData[0]![1] as UsedCellData).guess = '';

    const loaded = await loadGuesses(gridData, 'test-key');
    expect(loaded).toBe(true);
    expect((gridData[0]![0] as UsedCellData).guess).toBe('A');
    expect((gridData[0]![1] as UsedCellData).guess).toBe('B');
  });

  test('loadGuesses returns false when no data', async () => {
    const { gridData } = createGridData(sampleData);
    const loaded = await loadGuesses(gridData, 'nonexistent');
    expect(loaded).toBe(false);
  });

  test('clearGuesses removes data', async () => {
    store['clear-key'] = '{"guesses":{}}';
    await clearGuesses('clear-key');
    expect(store['clear-key']).toBeUndefined();
  });
});
