import React, { useCallback, useContext, useEffect, useRef } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { CrosswordContext } from './context';
import { defaultTheme } from './theme';
import type { ClueData, CrosswordTheme, Direction } from './types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ClueListProps {
  /** Which direction to display clues for. */
  direction: Direction;
  /** Optional label displayed above the list (e.g. "Across"). */
  label?: string;
  /** Theme overrides. */
  theme?: CrosswordTheme;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ClueList({ direction, label, theme: themeOverrides }: ClueListProps) {
  const {
    clues,
    handleClueSelected,
    focused,
    currentDirection,
    currentNumber,
  } = useContext(CrosswordContext);

  const theme = React.useMemo(
    () => ({ ...defaultTheme, ...themeOverrides }),
    [themeOverrides]
  );

  const listRef = useRef<FlatList<ClueData>>(null);
  const clueData = clues?.[direction] ?? [];

  // Auto-scroll to the active clue
  const activeIndex = clueData.findIndex(
    (c) => currentDirection === direction && c.number === currentNumber
  );

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      listRef.current.scrollToIndex({
        index: activeIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, [activeIndex]);

  const onCluePress = useCallback(
    (number: string) => {
      handleClueSelected(direction, number);
    },
    [direction, handleClueSelected]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ClueData; index: number }) => {
      const isActive =
        focused && currentDirection === direction && item.number === currentNumber;
      const isComplete = item.correct;

      return (
        <TouchableOpacity
          style={[
            styles.clueItem,
            isActive && { backgroundColor: theme.clueActiveBackground },
          ]}
          onPress={() => onCluePress(item.number)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.clueText,
              { color: theme.clueTextColor },
              isComplete && styles.clueComplete,
            ]}
          >
            <Text style={styles.clueNumber}>{item.number}. </Text>
            {item.clue}
          </Text>
        </TouchableOpacity>
      );
    },
    [
      focused,
      currentDirection,
      currentNumber,
      direction,
      theme.clueActiveBackground,
      theme.clueTextColor,
      onCluePress,
    ]
  );

  const keyExtractor = useCallback((item: ClueData) => `${direction}-${item.number}`, [direction]);

  const onScrollToIndexFailed = useCallback(
    (info: { index: number; averageItemLength: number }) => {
      // Fallback: scroll to approximate offset
      listRef.current?.scrollToOffset({
        offset: info.averageItemLength * info.index,
        animated: true,
      });
    },
    []
  );

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.header, { color: theme.clueTextColor }]}>{label}</Text>}
      <FlatList
        ref={listRef}
        data={clueData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onScrollToIndexFailed={onScrollToIndexFailed}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  clueItem: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  clueText: {
    fontSize: 14,
    lineHeight: 20,
  },
  clueNumber: {
    fontWeight: '700',
  },
  clueComplete: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
});
