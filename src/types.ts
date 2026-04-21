// ---------------------------------------------------------------------------
// Types for react-native-crossword
// ---------------------------------------------------------------------------

/** Direction of a crossword clue. */
export type Direction = 'across' | 'down';

/** A single clue/answer entry as supplied by the consumer. */
export interface ClueInput {
  /** The clue text to display. */
  clue: string;
  /** The correct answer (uppercase). */
  answer: string;
  /** 0-based row where the answer starts. */
  row: number;
  /** 0-based column where the answer starts. */
  col: number;
}

/**
 * The consumer-facing puzzle data format.
 *
 * Keys under `across` and `down` are the clue numbers (as strings).
 *
 * ```ts
 * const data: CluesInput = {
 *   across: { '1': { clue: 'one plus one', answer: 'TWO', row: 0, col: 0 } },
 *   down:   { '2': { clue: 'three minus two', answer: 'ONE', row: 0, col: 2 } },
 * };
 * ```
 */
export type CluesInput = Record<Direction, Record<string, ClueInput>>;

// ---------------------------------------------------------------------------
// Internal grid cell types
// ---------------------------------------------------------------------------

/** A position in the grid. */
export interface GridPosition {
  row: number;
  col: number;
}

/** A cell that is part of an answer. */
export interface UsedCellData extends GridPosition {
  used: true;
  /** The correct single-letter answer for this cell. */
  answer: string;
  /** The player's current guess (single letter or empty string). */
  guess: string;
  /** Display number label, if this cell starts a clue. */
  number?: string;
  /** The clue number for the "across" answer passing through this cell. */
  across?: string;
  /** The clue number for the "down" answer passing through this cell. */
  down?: string;
}

/** A cell that is not part of any answer (black square). */
export interface UnusedCellData extends GridPosition {
  used: false;
  outOfBounds?: boolean;
}

/** Any cell in the grid. */
export type CellData = UsedCellData | UnusedCellData;

/** The full grid, indexed as `[row][col]`. */
export type GridData = CellData[][];

// ---------------------------------------------------------------------------
// Processed clue data (internal)
// ---------------------------------------------------------------------------

/** A clue enriched with completion status during gameplay. */
export interface ClueData {
  number: string;
  clue: string;
  answer: string;
  row: number;
  col: number;
  complete?: boolean;
  correct?: boolean;
}

/** Processed clues by direction. */
export type CluesData = Record<Direction, ClueData[]>;

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

export interface CrosswordTheme {
  /** Allow the grid to be non-square. @default false */
  allowNonSquare?: boolean;
  /** Background color of the overall grid (gap color). @default '#000000' */
  gridBackground?: string;
  /** Background for an answer cell. @default '#FFFFFF' */
  cellBackground?: string;
  /** Border color for a cell. @default '#000000' */
  cellBorder?: string;
  /** Border width for a cell. @default 0.5 */
  cellBorderWidth?: number;
  /** Color for the player's guess text. @default '#000000' */
  textColor?: string;
  /** Color for the clue numbers inside cells. @default 'rgba(0,0,0,0.25)' */
  numberColor?: string;
  /** Background for the focused (active) cell. @default '#FFFF00' */
  focusBackground?: string;
  /** Background for highlighted cells in the current answer. @default '#FFFFCC' */
  highlightBackground?: string;
  /** Color for clue list text. @default '#000000' */
  clueTextColor?: string;
  /** Background for the active clue in the list. @default '#FFFFCC' */
  clueActiveBackground?: string;
  /** Animation duration in ms. @default 150 */
  animationDuration?: number;
}

// ---------------------------------------------------------------------------
// Callback / result types
// ---------------------------------------------------------------------------

/** Tuple returned for correct answers: [direction, number, answer]. */
export type AnswerTuple = [Direction, string, string];

/** A handler that can be registered to receive focus. */
export type FocusHandler = () => void;

// ---------------------------------------------------------------------------
// Component prop helpers
// ---------------------------------------------------------------------------

/** Imperative methods exposed via ref on `Crossword` / `CrosswordProvider`. */
export interface CrosswordImperative {
  /** Focus the crossword input. */
  focus: () => void;
  /** Clear all guesses and persisted data. */
  reset: () => void;
  /** Fill every cell with the correct answer. */
  fillAllAnswers: () => void;
  /** Returns `true` when every cell matches its answer. */
  isCrosswordCorrect: () => boolean;
  /** Set a single cell's guess. */
  setGuess: (row: number, col: number, guess: string) => void;
}
