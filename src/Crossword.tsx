import React, { useImperativeHandle, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import CrosswordProvider, { type CrosswordProviderProps } from './CrosswordProvider';
import CrosswordGrid from './CrosswordGrid';
import ClueList from './ClueList';
import type { CrosswordImperative, CrosswordTheme } from './types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CrosswordProps extends Omit<CrosswordProviderProps, 'children'> {
  /** Label for the "across" clue section. @default 'Across' */
  acrossLabel?: string;
  /** Label for the "down" clue section. @default 'Down' */
  downLabel?: string;
  /** Breakpoint (in dp) to switch between vertical & horizontal layout. @default 600 */
  layoutBreakpoint?: number;
  /** Theme overrides. */
  theme?: CrosswordTheme;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Ready-to-use crossword component with grid and clue lists.
 *
 * ```tsx
 * <Crossword data={puzzleData} />
 * ```
 */
const Crossword = React.forwardRef<CrosswordImperative, CrosswordProps>(
  (
    {
      acrossLabel = 'Across',
      downLabel = 'Down',
      layoutBreakpoint = 600,
      theme,
      ...providerProps
    },
    ref
  ) => {
    const providerRef = useRef<CrosswordImperative>(null);
    const { width } = useWindowDimensions();
    const isHorizontal = width >= layoutBreakpoint;

    useImperativeHandle(
      ref,
      () => ({
        focus: () => providerRef.current?.focus(),
        reset: () => providerRef.current?.reset(),
        fillAllAnswers: () => providerRef.current?.fillAllAnswers(),
        isCrosswordCorrect: () => !!providerRef.current?.isCrosswordCorrect(),
        setGuess: (row, col, guess) => providerRef.current?.setGuess(row, col, guess),
      }),
      []
    );

    return (
      <CrosswordProvider {...providerProps} theme={theme} ref={providerRef}>
        <View style={[styles.wrapper, isHorizontal && styles.wrapperHorizontal]}>
          <View style={styles.gridContainer}>
            <CrosswordGrid theme={theme} />
          </View>
          <View style={[styles.cluesContainer, isHorizontal && styles.cluesHorizontal]}>
            <ClueList direction="across" label={acrossLabel} theme={theme} />
            <ClueList direction="down" label={downLabel} theme={theme} />
          </View>
        </View>
      </CrosswordProvider>
    );
  }
);

Crossword.displayName = 'Crossword';

export default Crossword;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    flexDirection: 'column',
  },
  wrapperHorizontal: {
    flexDirection: 'row',
  },
  gridContainer: {
    flex: 2,
    aspectRatio: 1,
    maxWidth: '100%',
  },
  cluesContainer: {
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: 12,
    paddingTop: 16,
    gap: 16,
  },
  cluesHorizontal: {
    paddingTop: 0,
    paddingLeft: 16,
  },
});
