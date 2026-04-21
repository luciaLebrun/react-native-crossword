import {
  calculateExtents,
  createEmptyGrid,
  createGridData,
  fillClues,
  serializeGuesses,
  deserializeGuesses,
  findCorrectAnswers,
  bothDirections,
  isAcross,
  otherDirection,
} from '../utils';
import type { CluesInput, CluesData, UsedCellData } from '../types';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const sampleData: CluesInput = {
  across: {
    '1': { clue: 'One plus one', answer: 'TWO', row: 0, col: 0 },
    '4': { clue: 'Opposite of night', answer: 'DAY', row: 1, col: 0 },
  },
  down: {
    '1': { clue: 'Casual upper garment', answer: 'TD', row: 0, col: 0 },
    '2': { clue: 'Unit of resistance', answer: 'WA', row: 0, col: 1 },
    '3': { clue: 'Mineral deposit', answer: 'OY', row: 0, col: 2 },
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('direction helpers', () => {
  test('bothDirections contains across and down', () => {
    expect(bothDirections).toEqual(['across', 'down']);
  });

  test('isAcross', () => {
    expect(isAcross('across')).toBe(true);
    expect(isAcross('down')).toBe(false);
  });

  test('otherDirection', () => {
    expect(otherDirection('across')).toBe('down');
    expect(otherDirection('down')).toBe('across');
  });
});

describe('calculateExtents', () => {
  test('calculates across extents', () => {
    const ext = calculateExtents(sampleData, 'across');
    // '1' across: row 0, col 0, answer 'TWO' (len 3) → col max = 2, row max = 0
    // '4' across: row 1, col 0, answer 'DAY' (len 3) → col max = 2, row max = 1
    expect(ext.col).toBe(2);
    expect(ext.row).toBe(1);
  });

  test('calculates down extents', () => {
    const ext = calculateExtents(sampleData, 'down');
    // '1' down: row 0, col 0, answer 'TD' (len 2) → row max = 1, col max = 0
    // '2' down: row 0, col 1, answer 'WA' (len 2) → row max = 1, col max = 1
    // '3' down: row 0, col 2, answer 'OY' (len 2) → row max = 1, col max = 2
    expect(ext.row).toBe(1);
    expect(ext.col).toBe(2);
  });
});

describe('createEmptyGrid', () => {
  test('creates grid of correct size', () => {
    const grid = createEmptyGrid(3, 4);
    expect(grid.length).toBe(3);
    expect(grid[0]!.length).toBe(4);
  });

  test('all cells are unused', () => {
    const grid = createEmptyGrid(2, 2);
    grid.forEach((row) => {
      row.forEach((cell) => {
        expect(cell.used).toBe(false);
      });
    });
  });

  test('cells have correct coordinates', () => {
    const grid = createEmptyGrid(2, 3);
    expect(grid[0]![0]).toMatchObject({ row: 0, col: 0 });
    expect(grid[1]![2]).toMatchObject({ row: 1, col: 2 });
  });
});

describe('createGridData', () => {
  test('creates square grid by default', () => {
    const { rows, cols } = createGridData(sampleData);
    expect(rows).toBe(cols);
  });

  test('creates non-square grid when allowed', () => {
    const data: CluesInput = {
      across: {
        '1': { clue: 'Test', answer: 'HELLO', row: 0, col: 0 },
      },
      down: {
        '1': { clue: 'Test', answer: 'HI', row: 0, col: 0 },
      },
    };
    const { rows, cols } = createGridData(data, true);
    expect(cols).toBe(5); // HELLO is 5 chars
    expect(rows).toBe(2); // HI is 2 chars
  });

  test('fills cells with correct data', () => {
    const { gridData } = createGridData(sampleData);
    const cell00 = gridData[0]![0] as UsedCellData;
    expect(cell00.used).toBe(true);
    expect(cell00.answer).toBe('T');
    expect(cell00.number).toBe('1');
    expect(cell00.across).toBe('1');
    expect(cell00.down).toBe('1');
  });

  test('clues are sorted by number', () => {
    const { clues } = createGridData(sampleData);
    const acrossNumbers = clues.across.map((c) => parseInt(c.number, 10));
    expect(acrossNumbers).toEqual([...acrossNumbers].sort((a, b) => a - b));
  });
});

describe('serializeGuesses / deserializeGuesses', () => {
  test('round-trips guesses', () => {
    const { gridData } = createGridData(sampleData);
    // Set some guesses
    (gridData[0]![0] as UsedCellData).guess = 'T';
    (gridData[0]![1] as UsedCellData).guess = 'W';

    const serialized = serializeGuesses(gridData);
    expect(serialized['0_0']).toBe('T');
    expect(serialized['0_1']).toBe('W');

    // Clear and restore
    (gridData[0]![0] as UsedCellData).guess = '';
    (gridData[0]![1] as UsedCellData).guess = '';

    deserializeGuesses(gridData, serialized);
    expect((gridData[0]![0] as UsedCellData).guess).toBe('T');
    expect((gridData[0]![1] as UsedCellData).guess).toBe('W');
  });

  test('ignores out-of-bounds guesses', () => {
    const { gridData } = createGridData(sampleData);
    const guesses = { '99_99': 'X' };
    // Should not throw
    expect(() => deserializeGuesses(gridData, guesses)).not.toThrow();
  });
});

describe('findCorrectAnswers', () => {
  test('returns correct answers', () => {
    const { gridData } = createGridData(sampleData);

    // Fill in correct answers for '1' across: TWO
    (gridData[0]![0] as UsedCellData).guess = 'T';
    (gridData[0]![1] as UsedCellData).guess = 'W';
    (gridData[0]![2] as UsedCellData).guess = 'O';

    const correct = findCorrectAnswers(sampleData, gridData);
    const acrossCorrect = correct.filter(([dir]) => dir === 'across');
    expect(acrossCorrect).toContainEqual(['across', '1', 'TWO']);
  });

  test('returns empty when nothing is correct', () => {
    const { gridData } = createGridData(sampleData);
    const correct = findCorrectAnswers(sampleData, gridData);
    expect(correct).toEqual([]);
  });
});
