import { useTheme } from '@/context/ThemeContext';
import { ThemeColors, THEMES } from '@/constants/themes';

export type { ThemeColors };

export function useColors(): ThemeColors {
  return useTheme().colors;
}

export function avatarColorForName(name: string): { bg: string; text: string } {
  const palette = THEMES.midnight.avatarPalette;
  if (!name) return palette[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return palette[Math.abs(hash) % palette.length];
}

export default THEMES.midnight;
