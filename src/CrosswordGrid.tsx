import React, { useCallback, useContext, useMemo, useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import {
  Canvas,
  Group,
  Rect,
  Text as SkiaText,
  useFont,
} from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  useSharedValue,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';

import { CrosswordContext, CrosswordSizeContext } from './context';
import { defaultTheme } from './theme';
import type { CrosswordTheme, UsedCellData } from './types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CrosswordGridProps {
  /** Theme overrides for colors/layout. */
  theme?: CrosswordTheme;
}

// ---------------------------------------------------------------------------
// Individual cell (pure component for performance)
// ---------------------------------------------------------------------------

interface CellRendererProps {
  cellData: UsedCellData;
  x: number;
  y: number;
  cellInner: number;
  cellPadding: number;
  cellHalf: number;
  fontSize: number;
  numberFontSize: number;
  isFocused: boolean;
  isHighlighted: boolean;
  theme: Required<CrosswordTheme>;
  guessFont: ReturnType<typeof useFont>;
  numberFont: ReturnType<typeof useFont>;
}

const CellRenderer = React.memo(function CellRenderer({
  cellData,
  x,
  y,
  cellInner,
  cellPadding,
  cellHalf,
  fontSize,
  numberFontSize,
  isFocused,
  isHighlighted,
  theme,
  guessFont,
  numberFont,
}: CellRendererProps) {
  const bgColor = isFocused
    ? theme.focusBackground
    : isHighlighted
      ? theme.highlightBackground
      : theme.cellBackground;

  return (
    <Group>
      {/* Cell background */}
      <Rect
        x={x + cellPadding}
        y={y + cellPadding}
        width={cellInner}
        height={cellInner}
        color={bgColor}
      />
      {/* Cell border */}
      <Rect
        x={x + cellPadding}
        y={y + cellPadding}
        width={cellInner}
        height={cellInner}
        color={theme.cellBorder}
        style="stroke"
        strokeWidth={theme.cellBorderWidth}
      />
      {/* Number label */}
      {cellData.number && numberFont && (
        <SkiaText
          x={x + cellPadding * 4}
          y={y + cellPadding * 4 + numberFontSize}
          text={cellData.number}
          font={numberFont}
          color={theme.numberColor}
        />
      )}
      {/* Guess text */}
      {cellData.guess ? (
        guessFont ? (
          <SkiaText
            x={x + cellHalf - fontSize * 0.3}
            y={y + cellHalf + fontSize * 0.35}
            text={cellData.guess}
            font={guessFont}
            color={theme.textColor}
          />
        ) : null
      ) : null}
    </Group>
  );
});

// ---------------------------------------------------------------------------
// CrosswordGrid
// ---------------------------------------------------------------------------

export default function CrosswordGrid({ theme: themeOverrides }: CrosswordGridProps) {
  const {
    rows,
    cols,
    gridData,
    handleCellTap,
    handleTextInput,
    handleBackspace,
    focused,
    focusedRow,
    focusedCol,
    currentDirection,
    currentNumber,
  } = useContext(CrosswordContext);

  const inputRef = useRef<TextInput>(null);

  const theme = useMemo(
    () => ({ ...defaultTheme, ...themeOverrides }),
    [themeOverrides]
  );

  // ----- sizing -----
  const canvasSize = useSharedValue({ width: 0, height: 0 });

  // We compute cellSize on JS thread from a layout event
  const [cellSize, setCellSize] = React.useState(0);

  const onLayout = useCallback(
    (e: { nativeEvent: { layout: { width: number; height: number } } }) => {
      const { width, height } = e.nativeEvent.layout;
      const maxCellW = width / Math.max(cols, 1);
      const maxCellH = height / Math.max(rows, 1);
      setCellSize(Math.min(maxCellW, maxCellH));
    },
    [rows, cols]
  );

  const cellPadding = cellSize * 0.0125;
  const cellInner = cellSize - cellPadding * 2;
  const cellHalf = cellSize / 2;
  const fontSize = cellInner * 0.7;
  const numberFontSize = cellInner * 0.35;

  const guessFont = useFont(null, fontSize);
  const numberFont = useFont(null, numberFontSize);

  const gridWidth = cols * cellSize;
  const gridHeight = rows * cellSize;

  // ----- size context -----
  const sizeContext = useMemo(
    () => ({ cellSize, cellPadding, cellInner, cellHalf, fontSize, numberFontSize }),
    [cellSize, cellPadding, cellInner, cellHalf, fontSize, numberFontSize]
  );

  // ----- gesture: tap to select cell -----
  const tapGesture = useMemo(
    () =>
      Gesture.Tap().onEnd((e) => {
        if (cellSize === 0) return;
        const col = Math.floor(e.x / cellSize);
        const row = Math.floor(e.y / cellSize);
        if (row >= 0 && row < rows && col >= 0 && col < cols) {
          handleCellTap(row, col);
          // Focus the hidden TextInput so the keyboard opens
          inputRef.current?.focus();
        }
      }),
    [cellSize, rows, cols, handleCellTap]
  );

  // ----- keyboard handling via hidden TextInput -----
  const handleChangeText = useCallback(
    (text: string) => {
      if (text.length > 0) {
        handleTextInput(text[text.length - 1]!);
      }
    },
    [handleTextInput]
  );

  const handleKeyPress = useCallback(
    (e: { nativeEvent: { key: string } }) => {
      if (e.nativeEvent.key === 'Backspace') {
        handleBackspace();
      }
    },
    [handleBackspace]
  );

  // ----- render -----
  if (gridData.length === 0 || cellSize === 0) {
    // We still need the View for onLayout
    return <View style={styles.container} onLayout={onLayout} />;
  }

  return (
    <CrosswordSizeContext.Provider value={sizeContext}>
      <View style={styles.container} onLayout={onLayout}>
        <GestureDetector gesture={tapGesture}>
          <View style={{ width: gridWidth, height: gridHeight }}>
            <Canvas style={{ width: gridWidth, height: gridHeight }} onSize={canvasSize}>
              {/* Grid background */}
              <Rect x={0} y={0} width={gridWidth} height={gridHeight} color={theme.gridBackground} />

              {/* Cells */}
              {gridData.flatMap((rowData, r) =>
                rowData.map((cellData, c) => {
                  if (!cellData.used) return null;
                  const usedCell = cellData as UsedCellData;
                  const isFocused = focused && r === focusedRow && c === focusedCol;
                  const isHighlighted =
                    focused &&
                    !!currentNumber &&
                    usedCell[currentDirection] === currentNumber;

                  return (
                    <CellRenderer
                      key={`R${r}C${c}`}
                      cellData={usedCell}
                      x={c * cellSize}
                      y={r * cellSize}
                      cellInner={cellInner}
                      cellPadding={cellPadding}
                      cellHalf={cellHalf}
                      fontSize={fontSize}
                      numberFontSize={numberFontSize}
                      isFocused={isFocused}
                      isHighlighted={isHighlighted}
                      theme={theme}
                      guessFont={guessFont}
                      numberFont={numberFont}
                    />
                  );
                })
              )}
            </Canvas>

            {/* Hidden TextInput for keyboard input */}
            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              autoCapitalize="characters"
              autoCorrect={false}
              autoComplete="off"
              spellCheck={false}
              keyboardType="default"
              onChangeText={handleChangeText}
              onKeyPress={handleKeyPress}
              value=""
              caretHidden
            />
          </View>
        </GestureDetector>
      </View>
    </CrosswordSizeContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    // Push off-screen but keep focusable
    top: -100,
    left: -100,
  },
});
