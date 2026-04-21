import React, { useRef } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Crossword } from 'react-native-crossword';
import type { CluesInput, CrosswordImperative } from 'react-native-crossword';

// ---------------------------------------------------------------------------
// Sample puzzle data
// ---------------------------------------------------------------------------

const puzzleData: CluesInput = {
  across: {
    '1': { clue: 'One plus one', answer: 'TWO', row: 0, col: 0 },
    '4': { clue: 'Opposite of night', answer: 'DAY', row: 1, col: 0 },
    '5': { clue: 'Past tense of run', answer: 'RAN', row: 2, col: 0 },
  },
  down: {
    '1': { clue: 'Casual upper garment', answer: 'TEE', row: 0, col: 0 },
    '2': { clue: 'Unit of resistance', answer: 'OHM', row: 0, col: 1 },
    '3': { clue: 'Mineral deposit', answer: 'ORE', row: 0, col: 2 },
  },
};

// ---------------------------------------------------------------------------
// Dark theme example
// ---------------------------------------------------------------------------

const darkTheme = {
  gridBackground: '#1a1a2e',
  cellBackground: '#16213e',
  cellBorder: '#0f3460',
  textColor: '#e94560',
  numberColor: 'rgba(233,69,96,0.4)',
  focusBackground: '#e94560',
  highlightBackground: '#533483',
  clueTextColor: '#eaeaea',
  clueActiveBackground: '#533483',
};

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const crosswordRef = useRef<CrosswordImperative>(null);
  const [useDark, setUseDark] = React.useState(false);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={[styles.safe, useDark && styles.safeDark]}>
        <Text style={[styles.title, useDark && styles.titleDark]}>
          react-native-crossword
        </Text>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.btn} onPress={() => crosswordRef.current?.reset()}>
            <Text style={styles.btnText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => crosswordRef.current?.fillAllAnswers()}
          >
            <Text style={styles.btnText}>Reveal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => {
              const correct = crosswordRef.current?.isCrosswordCorrect();
              Alert.alert('Check', correct ? 'All correct!' : 'Not yet…');
            }}
          >
            <Text style={styles.btnText}>Check</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={() => setUseDark((v) => !v)}>
            <Text style={styles.btnText}>{useDark ? 'Light' : 'Dark'}</Text>
          </TouchableOpacity>
        </View>

        <Crossword
          ref={crosswordRef}
          data={puzzleData}
          theme={useDark ? darkTheme : undefined}
          onAnswerCorrect={(dir, num, ans) =>
            console.log(`Correct! ${dir} ${num}: ${ans}`)
          }
          onCrosswordComplete={(correct) =>
            Alert.alert('Done!', correct ? 'Perfect!' : 'Some mistakes.')
          }
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  safeDark: { backgroundColor: '#0f0f23' },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  titleDark: { color: '#eaeaea' },
  buttons: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12 },
  btn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
