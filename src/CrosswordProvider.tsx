import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { produce } from 'immer';

import { CrosswordContext, type CrosswordContextType } from './context';
import { defaultTheme } from './theme';
import type {
  AnswerTuple,
  CluesData,
  CluesInput,
  CrosswordImperative,
  CrosswordTheme,
  Direction,
  GridData,
  GridPosition,
  UsedCellData,
  UnusedCellData,
} from './types';
import {
  bothDirections,
  createGridData,
  isAcross,
  otherDirection,
} from './utils';
import { clearGuesses, loadGuesses, saveGuesses } from './storage';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CrosswordProviderProps {
  /** Clue / answer data. */
  data: CluesInput;
  /** Theme overrides (merged with defaults). */
  theme?: CrosswordTheme;
  /** Persist guesses via AsyncStorage. @default true */
  useStorage?: boolean;
  /** Custom key for AsyncStorage. @default 'crossword-guesses' */
  storageKey?: string;

  // --- callbacks ---
  onAnswerComplete?: (direction: Direction, number: string, correct: boolean, answer: string) => void;
  onAnswerCorrect?: (direction: Direction, number: string, answer: string) => void;
  onAnswerIncorrect?: (direction: Direction, number: string, answer: string) => void;
  onCrosswordComplete?: (correct: boolean) => void;
  onCellChange?: (row: number, col: number, char: string) => void;
  onClueSelected?: (direction: Direction, number: string) => void;

  children?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_STORAGE_KEY = 'crossword-guesses';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CrosswordProvider = React.forwardRef<CrosswordImperative, CrosswordProviderProps>(
  (
    {
      data,
      theme: themeOverrides,
      useStorage = true,
      storageKey,
      onAnswerComplete,
      onAnswerCorrect,
      onAnswerIncorrect,
      onCrosswordComplete,
      onCellChange,
      onClueSelected,
      children,
    },
    ref
  ) => {
    // ----- theme -----
    const theme = useMemo(
      () => ({ ...defaultTheme, ...themeOverrides }),
      [themeOverrides]
    );

    // ----- master grid (derived from input data) -----
    const { rows, cols, gridData: masterGridData, clues: masterClues } = useMemo(
      () => createGridData(data, theme.allowNonSquare),
      [data, theme.allowNonSquare]
    );

    // ----- player state -----
    const [gridData, setGridData] = useState<GridData>([]);
    const [clues, setClues] = useState<CluesData | undefined>();
    const [focused, setFocused] = useState(false);
    const [focusedRow, setFocusedRow] = useState(0);
    const [focusedCol, setFocusedCol] = useState(0);
    const [currentDirection, setCurrentDirection] = useState<Direction>('across');
    const [currentNumber, setCurrentNumber] = useState('1');
    const [checkQueue, setCheckQueue] = useState<GridPosition[]>([]);

    const effectiveStorageKey = storageKey || DEFAULT_STORAGE_KEY;

    // Focus handler registered by the grid component
    const registeredFocusHandler = useRef<(() => void) | null>(null);

    // ----- helpers -----

    const getCellData = useCallback(
      (row: number, col: number) => {
        if (row >= 0 && row < rows && col >= 0 && col < cols) {
          return gridData[row]![col]!;
        }
        return { row, col, used: false, outOfBounds: true } as GridPosition & UnusedCellData;
      },
      [cols, gridData, rows]
    );

    const setCellCharacter = useCallback(
      (row: number, col: number, char: string) => {
        const cell = getCellData(row, col);
        if (!cell.used) return;
        if ((cell as UsedCellData).guess === char) return;

        setGridData(
          produce((draft) => {
            (draft[row]![col] as UsedCellData).guess = char;
          })
        );
        setCheckQueue(
          produce((draft) => {
            draft.push({ row, col });
          })
        );
        onCellChange?.(row, col, char);
      },
      [getCellData, onCellChange]
    );

    // ----- answer checking -----

    const notifyAnswerComplete = useCallback(
      (direction: Direction, number: string, correct: boolean, answer: string) => {
        onAnswerComplete?.(direction, number, correct, answer);
        if (correct) {
          onAnswerCorrect?.(direction, number, answer);
        } else {
          onAnswerIncorrect?.(direction, number, answer);
        }
      },
      [onAnswerComplete, onAnswerCorrect, onAnswerIncorrect]
    );

    const checkCorrectness = useCallback(
      (row: number, col: number) => {
        const cell = getCellData(row, col);
        if (!cell.used) return;

        bothDirections.forEach((direction) => {
          const across = isAcross(direction);
          const number = (cell as UsedCellData)[direction];
          if (!number) return;

          const info = data[direction][number]!;
          let complete = true;
          let correct = true;

          for (let i = 0; i < info.answer.length; i++) {
            const checkCell = getCellData(
              info.row + (across ? 0 : i),
              info.col + (across ? i : 0)
            ) as UsedCellData;

            if (!checkCell.guess) {
              complete = false;
              correct = false;
              break;
            }
            if (checkCell.guess !== checkCell.answer) {
              correct = false;
            }
          }

          setClues(
            produce((draft) => {
              if (!draft) return;
              const clueInfo = draft[direction].find((c) => c.number === number);
              if (clueInfo) {
                clueInfo.complete = complete;
                clueInfo.correct = correct;
              }
            })
          );

          if (complete) {
            notifyAnswerComplete(direction, number, correct, info.answer);
          }
        });
      },
      [data, getCellData, notifyAnswerComplete]
    );

    // Process check queue
    useEffect(() => {
      if (checkQueue.length === 0) return;
      checkQueue.forEach(({ row, col }) => checkCorrectness(row, col));
      setCheckQueue([]);
    }, [checkQueue, checkCorrectness]);

    // Overall correctness
    const { crosswordComplete, crosswordCorrect } = useMemo(() => {
      const complete = !!(
        clues &&
        bothDirections.every((dir) => clues[dir].every((c) => c.complete))
      );
      const correct =
        complete &&
        !!(clues && bothDirections.every((dir) => clues[dir].every((c) => c.correct)));
      return { crosswordComplete: complete, crosswordCorrect: correct };
    }, [clues]);

    useEffect(() => {
      if (crosswordComplete) {
        onCrosswordComplete?.(crosswordCorrect);
      }
    }, [crosswordComplete, crosswordCorrect, onCrosswordComplete]);

    // ----- navigation -----

    const focus = useCallback(() => {
      registeredFocusHandler.current?.();
      setFocused(true);
    }, []);

    const moveTo = useCallback(
      (row: number, col: number, directionOverride?: Direction) => {
        let direction = directionOverride ?? currentDirection;
        const candidate = getCellData(row, col);
        if (!candidate.used) return false;

        if (!(candidate as UsedCellData)[direction]) {
          direction = otherDirection(direction);
        }

        setFocusedRow(row);
        setFocusedCol(col);
        setCurrentDirection(direction);
        setCurrentNumber((candidate as UsedCellData)[direction] ?? '');
        return candidate;
      },
      [currentDirection, getCellData]
    );

    const moveRelative = useCallback(
      (dRow: number, dCol: number) => {
        let direction: Direction | undefined;
        if (dRow !== 0 && dCol === 0) direction = 'down';
        else if (dRow === 0 && dCol !== 0) direction = 'across';
        return moveTo(focusedRow + dRow, focusedCol + dCol, direction);
      },
      [focusedRow, focusedCol, moveTo]
    );

    const moveForward = useCallback(() => {
      const across = isAcross(currentDirection);
      moveRelative(across ? 0 : 1, across ? 1 : 0);
    }, [currentDirection, moveRelative]);

    const moveBackward = useCallback(() => {
      const across = isAcross(currentDirection);
      moveRelative(across ? 0 : -1, across ? -1 : 0);
    }, [currentDirection, moveRelative]);

    // ----- interaction handlers (exposed via context) -----

    const handleCellTap = useCallback(
      (row: number, col: number) => {
        const cell = getCellData(row, col);
        if (!cell.used) return;

        const other = otherDirection(currentDirection);
        let direction = currentDirection;

        if (
          !(cell as UsedCellData)[currentDirection] ||
          (focused && row === focusedRow && col === focusedCol && (cell as UsedCellData)[other])
        ) {
          direction = other;
        }

        setFocusedRow(row);
        setFocusedCol(col);
        setCurrentDirection(direction);
        setCurrentNumber((cell as UsedCellData)[direction] ?? '');
        focus();
      },
      [currentDirection, focus, focused, focusedCol, focusedRow, getCellData]
    );

    const handleTextInput = useCallback(
      (char: string) => {
        if (!char || char.length === 0) return;
        setCellCharacter(focusedRow, focusedCol, char[0]!.toUpperCase());
        moveForward();
      },
      [focusedRow, focusedCol, setCellCharacter, moveForward]
    );

    const handleBackspace = useCallback(() => {
      setCellCharacter(focusedRow, focusedCol, '');
      moveBackward();
    }, [focusedRow, focusedCol, setCellCharacter, moveBackward]);

    const handleClueSelected = useCallback(
      (direction: Direction, number: string) => {
        const info = clues?.[direction].find((c) => c.number === number);
        if (!info) return;

        moveTo(info.row, info.col, direction);
        focus();
        onClueSelected?.(direction, number);
      },
      [clues, focus, moveTo, onClueSelected]
    );

    // ----- data initialisation & persistence -----

    useEffect(() => {
      const newGridData = masterGridData.map((row) => row.map((cell) => ({ ...cell })));
      const newCluesData: CluesData = {
        across: masterClues.across.map((c) => ({ ...c })),
        down: masterClues.down.map((c) => ({ ...c })),
      };

      if (useStorage) {
        loadGuesses(newGridData, effectiveStorageKey).then((loaded) => {
          setClues(newCluesData);
          setGridData(newGridData);

          if (loaded) {
            setCheckQueue(
              bothDirections.flatMap((dir) =>
                newCluesData[dir].map(({ row, col }) => ({ row, col }))
              )
            );
          }
        });
      } else {
        setClues(newCluesData);
        setGridData(newGridData);
      }

      setFocusedRow(0);
      setFocusedCol(0);
      setCurrentDirection('across');
      setCurrentNumber('1');
    }, [masterClues, masterGridData, effectiveStorageKey, useStorage]);

    // Save on change
    useEffect(() => {
      if (gridData.length === 0 || !useStorage) return;
      saveGuesses(gridData, effectiveStorageKey);
    }, [gridData, effectiveStorageKey, useStorage]);

    // ----- imperative API -----

    useImperativeHandle(
      ref,
      () => ({
        focus,

        reset: () => {
          setGridData(
            produce((draft) => {
              draft.forEach((rowData) => {
                rowData.forEach((cellData) => {
                  if (cellData.used) {
                    (cellData as UsedCellData).guess = '';
                  }
                });
              });
            })
          );
          setClues(
            produce((draft) => {
              if (!draft) return;
              bothDirections.forEach((dir) => {
                draft[dir].forEach((c) => {
                  delete c.complete;
                  delete c.correct;
                });
              });
            })
          );
          if (useStorage) clearGuesses(effectiveStorageKey);
        },

        fillAllAnswers: () => {
          setGridData(
            produce((draft) => {
              draft.forEach((rowData) => {
                rowData.forEach((cellData) => {
                  if (cellData.used) {
                    (cellData as UsedCellData).guess = (cellData as UsedCellData).answer;
                  }
                });
              });
            })
          );
          setClues(
            produce((draft) => {
              if (!draft) return;
              bothDirections.forEach((dir) => {
                draft[dir].forEach((c) => {
                  c.complete = true;
                  c.correct = true;
                });
              });
            })
          );
        },

        isCrosswordCorrect: () => crosswordCorrect,

        setGuess: (row: number, col: number, guess: string) => {
          setCellCharacter(row, col, guess.toUpperCase());
        },
      }),
      [
        crosswordCorrect,
        focus,
        setCellCharacter,
        effectiveStorageKey,
        useStorage,
      ]
    );

    // ----- context value -----

    const contextValue = useMemo<CrosswordContextType>(
      () => ({
        rows,
        cols,
        gridData,
        clues,
        handleCellTap,
        handleClueSelected,
        handleTextInput,
        handleBackspace,
        focused,
        focusedRow,
        focusedCol,
        currentDirection,
        currentNumber,
        crosswordCorrect,
      }),
      [
        rows,
        cols,
        gridData,
        clues,
        handleCellTap,
        handleClueSelected,
        handleTextInput,
        handleBackspace,
        focused,
        focusedRow,
        focusedCol,
        currentDirection,
        currentNumber,
        crosswordCorrect,
      ]
    );

    return (
      <CrosswordContext.Provider value={contextValue}>
        {children}
      </CrosswordContext.Provider>
    );
  }
);

CrosswordProvider.displayName = 'CrosswordProvider';

export default CrosswordProvider;
