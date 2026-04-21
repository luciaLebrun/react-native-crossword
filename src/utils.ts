import type {
  ClueData,
  CluesData,
  CluesInput,
  CellData,
  Direction,
  GridData,
  UsedCellData,
  AnswerTuple,
} from './types';

// ---------------------------------------------------------------------------
// Direction helpers
// ---------------------------------------------------------------------------

type RowOrCol = 'row' | 'col';

const directionInfo: Record<Direction, { primary: RowOrCol; orthogonal: RowOrCol }> = {
  across: { primary: 'col', orthogonal: 'row' },
  down: { primary: 'row', orthogonal: 'col' },
};

export const bothDirections: Direction[] = ['across', 'down'];

export function isAcross(direction: Direction): boolean {
  return direction === 'across';
}

export function otherDirection(direction: Direction): Direction {
  return isAcross(direction) ? 'down' : 'across';
}

// ---------------------------------------------------------------------------
// Grid creation
// ---------------------------------------------------------------------------

interface RowColMax {
  row: number;
  col: number;
}

export function calculateExtents(data: CluesInput, direction: Direction): RowColMax {
  const dir = directionInfo[direction];
  let primaryMax = 0;
  let orthogonalMax = 0;

  Object.entries(data[direction]).forEach(([, info]) => {
    const primary = info[dir.primary] + info.answer.length - 1;
    if (primary > primaryMax) primaryMax = primary;

    const orthogonal = info[dir.orthogonal];
    if (orthogonal > orthogonalMax) orthogonalMax = orthogonal;
  });

  const rowColMax: RowColMax = { row: 0, col: 0 };
  rowColMax[dir.primary] = primaryMax;
  rowColMax[dir.orthogonal] = orthogonalMax;
  return rowColMax;
}

export function createEmptyGrid(rows: number, cols: number): GridData {
  const gridData: GridData = Array(rows);
  for (let r = 0; r < rows; r++) {
    gridData[r] = Array(cols);
    for (let c = 0; c < cols; c++) {
      gridData[r]![c] = { row: r, col: c, used: false };
    }
  }
  return gridData;
}

export function fillClues(
  gridData: GridData,
  clues: CluesData,
  data: CluesInput,
  direction: Direction
): void {
  const dir = directionInfo[direction];

  Object.entries(data[direction]).forEach(([number, info]) => {
    const { row: rowStart, col: colStart, clue, answer } = info;

    for (let i = 0; i < answer.length; i++) {
      const row = rowStart + (dir.primary === 'row' ? i : 0);
      const col = colStart + (dir.primary === 'col' ? i : 0);
      const cellData = gridData[row]![col] as UsedCellData;

      cellData.used = true;
      cellData.answer = answer[i]!;
      cellData.guess = cellData.guess ?? '';
      cellData[direction] = number;

      if (i === 0) {
        cellData.number = number;
      }
    }

    clues[direction].push({
      number,
      clue,
      answer,
      col: colStart,
      row: rowStart,
    });
  });

  clues[direction].sort(byNumber);
}

export function createGridData(
  data: CluesInput,
  allowNonSquare = false
): { rows: number; cols: number; gridData: GridData; clues: CluesData } {
  const acrossMax = calculateExtents(data, 'across');
  const downMax = calculateExtents(data, 'down');

  let rows = Math.max(acrossMax.row, downMax.row) + 1;
  let cols = Math.max(acrossMax.col, downMax.col) + 1;

  if (!allowNonSquare) {
    const size = Math.max(rows, cols);
    rows = size;
    cols = size;
  }

  const gridData = createEmptyGrid(rows, cols);
  const clues: CluesData = { across: [], down: [] };

  fillClues(gridData, clues, data, 'across');
  fillClues(gridData, clues, data, 'down');

  return { rows, cols, gridData, clues };
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

function byNumber(a: { number: string }, b: { number: string }): number {
  return Number.parseInt(a.number, 10) - Number.parseInt(b.number, 10);
}

// ---------------------------------------------------------------------------
// Guess serialization (for persistence)
// ---------------------------------------------------------------------------

export type GuessData = ({ guess?: string } | CellData)[][];

export function serializeGuesses(gridData: GuessData): Record<string, string> {
  const guesses: Record<string, string> = {};
  gridData.forEach((row, r) => {
    row.forEach((cellData, c) => {
      const guess = (cellData as UsedCellData).guess;
      if (guess && guess !== '') {
        guesses[`${r}_${c}`] = guess;
      }
    });
  });
  return guesses;
}

export function deserializeGuesses(
  gridData: GuessData,
  guesses: Record<string, string>
): void {
  Object.entries(guesses).forEach(([key, val]) => {
    const [rStr, cStr] = key.split('_');
    const r = parseInt(rStr!, 10);
    const c = parseInt(cStr!, 10);
    if (r <= gridData.length - 1 && c <= gridData[0]!.length - 1) {
      (gridData[r]![c] as UsedCellData).guess = val;
    }
  });
}

// ---------------------------------------------------------------------------
// Answer checking
// ---------------------------------------------------------------------------

export function findCorrectAnswers(
  data: CluesInput,
  gridData: GuessData
): AnswerTuple[] {
  const correctAnswers: AnswerTuple[] = [];

  bothDirections.forEach((direction) => {
    const across = isAcross(direction);
    Object.entries(data[direction]).forEach(([num, info]) => {
      const { row, col } = info;
      let correct = true;
      for (let i = 0; i < info.answer.length; i++) {
        const r = across ? row : row + i;
        const c = across ? col + i : col;
        if ((gridData[r]![c] as UsedCellData).guess !== info.answer[i]) {
          correct = false;
          break;
        }
      }
      if (correct) {
        correctAnswers.push([direction, num, info.answer]);
      }
    });
  });

  return correctAnswers;
}
