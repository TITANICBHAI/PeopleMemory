export interface ThemeColors {
  bg: string;
  panel: string;
  panelHigh: string;
  header: string;
  border: string;
  borderLight: string;
  accent: string;
  accentDim: string;
  accentGlow: string;
  text: string;
  textBright: string;
  textMuted: string;
  textDim: string;
  green: string;
  yellow: string;
  red: string;
  tag: {
    friend: { bg: string; text: string };
    work: { bg: string; text: string };
    family: { bg: string; text: string };
    online: { bg: string; text: string };
    custom: { bg: string; text: string };
  };
  avatarPalette: Array<{ bg: string; text: string }>;
}

export type ThemeId = 'midnight' | 'eclipse' | 'spectrum';

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  subtitle: string;
  description: string;
  previewBg: string;
  previewAccent: string;
  previewPanel: string;
}

export const THEME_META: ThemeMeta[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    subtitle: 'Classic dark',
    description: 'The original dark theme with a cool blue accent. Familiar, balanced, and easy on the eyes in any lighting condition.',
    previewBg: '#1A1A1A',
    previewAccent: '#007ACC',
    previewPanel: '#242424',
  },
  {
    id: 'eclipse',
    name: 'Eclipse',
    subtitle: 'AMOLED black',
    description: 'True pitch-black background with warm amber accents. Designed for AMOLED and OLED displays — saves battery, reduces eye strain in the dark, and delivers maximum contrast.',
    previewBg: '#000000',
    previewAccent: '#F59E0B',
    previewPanel: '#0f0f0f',
  },
  {
    id: 'spectrum',
    name: 'Spectrum',
    subtitle: 'Vibrant dark',
    description: 'Deep charcoal panels inspired by GitHub\'s dark mode, with rich indigo and violet accents. Colourful tag chips and glowing trust rings make every contact stand out.',
    previewBg: '#0d1117',
    previewAccent: '#6366F1',
    previewPanel: '#161b22',
  },
];

const AVATAR_PALETTE = [
  { bg: '#1A3A5C', text: '#5BB8F5' },
  { bg: '#2A1A4A', text: '#B07FEA' },
  { bg: '#1A3A28', text: '#52C97A' },
  { bg: '#3A1A1A', text: '#F07070' },
  { bg: '#2A2A1A', text: '#D4A74A' },
  { bg: '#1A3A38', text: '#4DC9C0' },
  { bg: '#3A1A30', text: '#E87BB5' },
  { bg: '#1E2A3A', text: '#6B9FD4' },
  { bg: '#1A2A1A', text: '#80C86A' },
  { bg: '#2E1A10', text: '#E8945A' },
  { bg: '#1A1A3A', text: '#8888E8' },
  { bg: '#2A3A1A', text: '#A8D46A' },
];

export const THEMES: Record<ThemeId, ThemeColors> = {
  midnight: {
    bg: '#1A1A1A',
    panel: '#242424',
    panelHigh: '#2D2D30',
    header: '#252526',
    border: '#3E3E42',
    borderLight: '#4A4A4F',
    accent: '#007ACC',
    accentDim: '#005F99',
    accentGlow: '#1E9EFF',
    text: '#D4D4D4',
    textBright: '#FFFFFF',
    textMuted: '#888888',
    textDim: '#555555',
    green: '#4EC94E',
    yellow: '#E5C07B',
    red: '#F44747',
    tag: {
      friend: { bg: '#1A3A4A', text: '#56B6C2' },
      work: { bg: '#3A2A1A', text: '#E5C07B' },
      family: { bg: '#1A3A1A', text: '#4EC94E' },
      online: { bg: '#2A1A3A', text: '#C678DD' },
      custom: { bg: '#2A2A2A', text: '#888888' },
    },
    avatarPalette: AVATAR_PALETTE,
  },
  eclipse: {
    bg: '#000000',
    panel: '#0f0f0f',
    panelHigh: '#1a1a1a',
    header: '#111111',
    border: '#1f1f1f',
    borderLight: '#2a2a2a',
    accent: '#F59E0B',
    accentDim: '#D97706',
    accentGlow: '#FCD34D',
    text: '#E5E5E5',
    textBright: '#FFFFFF',
    textMuted: '#666666',
    textDim: '#333333',
    green: '#10B981',
    yellow: '#F59E0B',
    red: '#EF4444',
    tag: {
      friend: { bg: '#1a150a', text: '#FCD34D' },
      work: { bg: '#0a1a0f', text: '#6EE7B7' },
      family: { bg: '#1a0a0a', text: '#FCA5A5' },
      online: { bg: '#0f0a1a', text: '#C4B5FD' },
      custom: { bg: '#151515', text: '#666666' },
    },
    avatarPalette: AVATAR_PALETTE,
  },
  spectrum: {
    bg: '#0d1117',
    panel: '#161b22',
    panelHigh: '#1c2128',
    header: '#161b22',
    border: '#21262d',
    borderLight: '#30363d',
    accent: '#6366F1',
    accentDim: '#4F46E5',
    accentGlow: '#818CF8',
    text: '#C9D1D9',
    textBright: '#F0F6FC',
    textMuted: '#8B949E',
    textDim: '#484F58',
    green: '#3FB950',
    yellow: '#D29922',
    red: '#F85149',
    tag: {
      friend: { bg: '#1d3a6e', text: '#93C5FD' },
      work: { bg: '#0a3a22', text: '#6EE7B7' },
      family: { bg: '#3a2206', text: '#FCD34D' },
      online: { bg: '#2d1a5c', text: '#C4B5FD' },
      custom: { bg: '#21262d', text: '#8B949E' },
    },
    avatarPalette: AVATAR_PALETTE,
  },
};
