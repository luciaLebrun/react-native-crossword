import type { CrosswordTheme } from './types';

export const defaultTheme: Required<CrosswordTheme> = {
  allowNonSquare: false,
  gridBackground: '#000000',
  cellBackground: '#FFFFFF',
  cellBorder: '#000000',
  cellBorderWidth: 0.5,
  textColor: '#000000',
  numberColor: 'rgba(0,0,0,0.25)',
  focusBackground: '#FFFF00',
  highlightBackground: '#FFFFCC',
  clueTextColor: '#000000',
  clueActiveBackground: '#FFFFCC',
  animationDuration: 150,
};
