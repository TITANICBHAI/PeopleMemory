import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { ThemeColors, ThemeId, THEMES } from '@/constants/themes';

const STORAGE_KEY = 'app_theme_v1';

interface ThemeContextValue {
  themeId: ThemeId;
  colors: ThemeColors;
  setTheme: (id: ThemeId) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeId: 'midnight',
  colors: THEMES.midnight,
  setTheme: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>('midnight');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val === 'midnight' || val === 'eclipse' || val === 'spectrum') {
        setThemeId(val);
      }
    });
  }, []);

  const setTheme = async (id: ThemeId) => {
    setThemeId(id);
    await AsyncStorage.setItem(STORAGE_KEY, id);
  };

  return (
    <ThemeContext.Provider value={{ themeId, colors: THEMES[themeId], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
