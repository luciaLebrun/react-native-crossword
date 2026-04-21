# react-native-crossword

[![npm version](https://img.shields.io/npm/v/react-native-crossword.svg)](https://www.npmjs.com/package/react-native-crossword)
[![license](https://img.shields.io/npm/l/react-native-crossword.svg)](https://github.com/luciaLebrun/react-native-crossword/blob/main/LICENSE)
![platforms](https://img.shields.io/badge/platforms-iOS%20%7C%20Android-lightgrey)

A flexible, high-performance crossword puzzle component for React Native — powered by **Skia**, **Reanimated** and **Gesture Handler**.

<!-- TODO: add hero GIF/screenshot -->

## Features

- **GPU-accelerated rendering** via `@shopify/react-native-skia` — silky smooth even on large grids
- **Fluid animations** via `react-native-reanimated` — focus/highlight transitions on the UI thread
- **Native gestures** via `react-native-gesture-handler` — tap cells, swipe clues
- **Full theming** — customize every color, border width and font size
- **Built-in persistence** — automatically saves/restores player progress via AsyncStorage (optional)
- **Imperative API** — `focus()`, `reset()`, `fillAllAnswers()`, `isCrosswordCorrect()`, `setGuess()`
- **Custom layouts** — use `CrosswordProvider` + `CrosswordGrid` + `ClueList` independently
- **TypeScript-first** — full type definitions for every export

## Requirements

| Dependency | Minimum version |
|---|---|
| React | 19.0.0 |
| React Native | 0.79.0 |
| `@shopify/react-native-skia` | 1.0.0 |
| `react-native-reanimated` | 4.0.0 |
| `react-native-gesture-handler` | 2.0.0 |

## Installation

```sh
yarn add react-native-crossword
```

Install peer dependencies (if not already in your project):

```sh
yarn add @shopify/react-native-skia react-native-reanimated react-native-gesture-handler
```

For persistence support (optional):

```sh
yarn add @react-native-async-storage/async-storage
```

Then follow the setup instructions for each peer dependency ([Skia](https://shopify.github.io/react-native-skia/docs/getting-started/installation), [Reanimated](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/), [Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/installation)).

## Quick Start

```tsx
import React from 'react';
import { Crossword } from 'react-native-crossword';
import type { CluesInput } from 'react-native-crossword';

const data: CluesInput = {
  across: {
    '1': { clue: 'One plus one', answer: 'TWO', row: 0, col: 0 },
    '4': { clue: 'Opposite of night', answer: 'DAY', row: 1, col: 0 },
  },
  down: {
    '1': { clue: 'Used for writing', answer: 'TYPE', row: 0, col: 0 },
    '2': { clue: 'Possessed', answer: 'OWN', row: 0, col: 1 },
    '3': { clue: 'Mineral deposit', answer: 'ORE', row: 0, col: 2 },
  },
};

export default function App() {
  return (
    <Crossword
      data={data}
      onCrosswordComplete={(correct) => {
        console.log('Crossword complete!', correct ? 'All correct!' : 'Some mistakes.');
      }}
    />
  );
}
```

## Data Format

Puzzle data is structured as a `CluesInput` object with `across` and `down` entries:

```ts
type CluesInput = {
  across: Record<string, ClueInput>;
  down: Record<string, ClueInput>;
};

type ClueInput = {
  clue: string;     // The clue text
  answer: string;   // Uppercase answer
  row: number;      // 0-based starting row
  col: number;      // 0-based starting column
};
```

The grid size is calculated automatically from the data — no need to specify dimensions.

## Props

### `<Crossword>` props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `CluesInput` | **required** | Puzzle clue/answer data |
| `theme` | `CrosswordTheme` | `defaultTheme` | Theme overrides |
| `useStorage` | `boolean` | `true` | Persist guesses via AsyncStorage |
| `storageKey` | `string` | `'crossword-guesses'` | Custom AsyncStorage key |
| `acrossLabel` | `string` | `'Across'` | Header for across clues |
| `downLabel` | `string` | `'Down'` | Header for down clues |
| `layoutBreakpoint` | `number` | `600` | Width (dp) to switch to horizontal layout |
| `onAnswerComplete` | `(direction, number, correct, answer) => void` | — | Fired when a player completes an answer |
| `onAnswerCorrect` | `(direction, number, answer) => void` | — | Fired when an answer is correct |
| `onAnswerIncorrect` | `(direction, number, answer) => void` | — | Fired when an answer is incorrect |
| `onCrosswordComplete` | `(correct: boolean) => void` | — | Fired when the entire crossword is filled |
| `onCellChange` | `(row, col, char) => void` | — | Fired when a cell value changes |
| `onClueSelected` | `(direction, number) => void` | — | Fired when a clue is selected |

## Theming

Pass a `theme` prop to customize appearance:

```tsx
<Crossword
  data={data}
  theme={{
    gridBackground: '#1a1a2e',
    cellBackground: '#16213e',
    cellBorder: '#0f3460',
    textColor: '#e94560',
    numberColor: 'rgba(233,69,96,0.4)',
    focusBackground: '#e94560',
    highlightBackground: '#533483',
    clueTextColor: '#eaeaea',
    clueActiveBackground: '#533483',
  }}
/>
```

### Theme properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `allowNonSquare` | `boolean` | `false` | Allow non-square grid rendering |
| `gridBackground` | `string` | `'#000000'` | Grid gap/background color |
| `cellBackground` | `string` | `'#FFFFFF'` | Default cell background |
| `cellBorder` | `string` | `'#000000'` | Cell border color |
| `cellBorderWidth` | `number` | `0.5` | Cell border width |
| `textColor` | `string` | `'#000000'` | Player's guess text color |
| `numberColor` | `string` | `'rgba(0,0,0,0.25)'` | Clue numbers inside cells |
| `focusBackground` | `string` | `'#FFFF00'` | Focused cell background |
| `highlightBackground` | `string` | `'#FFFFCC'` | Highlighted answer cells |
| `clueTextColor` | `string` | `'#000000'` | Clue list text color |
| `clueActiveBackground` | `string` | `'#FFFFCC'` | Active clue highlight |
| `animationDuration` | `number` | `150` | Animation duration (ms) |

## Imperative Methods

Access via a ref:

```tsx
const crosswordRef = useRef<CrosswordImperative>(null);

<Crossword ref={crosswordRef} data={data} />

// Then:
crosswordRef.current?.focus();
crosswordRef.current?.reset();
crosswordRef.current?.fillAllAnswers();
crosswordRef.current?.isCrosswordCorrect(); // => boolean
crosswordRef.current?.setGuess(0, 0, 'T');
```

| Method | Description |
|--------|-------------|
| `focus()` | Focus the crossword input |
| `reset()` | Clear all guesses and persisted data |
| `fillAllAnswers()` | Fill the grid with correct answers |
| `isCrosswordCorrect()` | Returns `true` if every cell is correct |
| `setGuess(row, col, guess)` | Set a specific cell's guess |

## Custom Layouts

For full control over the layout, use the building blocks directly:

```tsx
import {
  CrosswordProvider,
  CrosswordGrid,
  ClueList,
} from 'react-native-crossword';

function CustomCrossword({ data }) {
  return (
    <CrosswordProvider data={data}>
      <View style={{ flexDirection: 'row' }}>
        <CrosswordGrid />
        <View>
          <ClueList direction="across" label="Across" />
          <ClueList direction="down" label="Down" />
        </View>
      </View>
    </CrosswordProvider>
  );
}
```

## Architecture

```
┌──────────────────────────────────────────────┐
│ Crossword (composite)                        │
│ ┌──────────────────────────────────────────┐ │
│ │ CrosswordProvider (state + context)      │ │
│ │ ┌────────────────┐ ┌──────────────────┐ │ │
│ │ │ CrosswordGrid  │ │ ClueList (across)│ │ │
│ │ │ (Skia Canvas)  │ │ ClueList (down)  │ │ │
│ │ └────────────────┘ └──────────────────┘ │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

- **CrosswordProvider** manages all state (grid data, selection, correctness checking, persistence)
- **CrosswordGrid** renders the puzzle via Skia `Canvas` with gesture handling and a hidden `TextInput` for keyboard input
- **ClueList** displays clues as a `FlatList` with auto-scroll to the active clue

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository.

## License

MIT
