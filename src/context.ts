import { createContext } from 'react';
import type { CellData, CluesData, Direction, GridData } from './types';

// ---------------------------------------------------------------------------
// CrosswordContext – shared state & handlers consumed by grid + clues
// ---------------------------------------------------------------------------

export interface CrosswordContextType {
  /** Number of rows in the grid. */
  rows: number;
  /** Number of columns in the grid. */
  cols: number;
  /** The full grid data. */
  gridData: GridData;
  /** Processed clues (across & down). */
  clues: CluesData | undefined;

  // --- interaction handlers ---
  handleCellTap: (row: number, col: number) => void;
  handleClueSelected: (direction: Direction, number: string) => void;
  handleTextInput: (char: string) => void;
  handleBackspace: () => void;

  // --- selection state ---
  focused: boolean;
  focusedRow: number;
  focusedCol: number;
  currentDirection: Direction;
  currentNumber: string;

  /** `true` when the entire crossword is correct. */
  crosswordCorrect: boolean;
}

export const CrosswordContext = createContext<CrosswordContextType>({
  rows: 0,
  cols: 0,
  gridData: [],
  clues: undefined,
  handleCellTap: () => {},
  handleClueSelected: () => {},
  handleTextInput: () => {},
  handleBackspace: () => {},
  focused: false,
  focusedRow: 0,
  focusedCol: 0,
  currentDirection: 'across',
  currentNumber: '1',
  crosswordCorrect: false,
});

// ---------------------------------------------------------------------------
// CrosswordSizeContext – cell dimensions for rendering
// ---------------------------------------------------------------------------

export interface CrosswordSizeContextType {
  cellSize: number;
  cellPadding: number;
  cellInner: number;
  cellHalf: number;
  fontSize: number;
  numberFontSize: number;
}

export const CrosswordSizeContext = createContext<CrosswordSizeContextType>({
  cellSize: 10,
  cellPadding: 0.125,
  cellInner: 9.75,
  cellHalf: 5,
  fontSize: 6.825,
  numberFontSize: 3.4125,
});
