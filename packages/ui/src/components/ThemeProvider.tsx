import {
  createContext,
  useCallback,
  type HTMLAttributes,
  useState,
  useEffect,
} from 'react';

import s from './ThemeProvider.module.css';

const THEME_STORAGE_KEY = 'bwe-theme-provider-value';
const THEME_VALUES = ['dark', 'light'] as const;
const DEFAULT_THEME: Theme = 'light';

type Theme = (typeof THEME_VALUES)[number];

type Props = HTMLAttributes<HTMLDivElement> & {
  allowThemeChange?: boolean;
  defaultTheme: Theme;
};

type ThemeContext = {
  setTheme: (newTheme: Theme) => any;
  theme: Theme;
};

export const ThemeContext = createContext<ThemeContext | undefined>(undefined);

export function ThemeProvider({
  allowThemeChange,
  className = '',
  defaultTheme = DEFAULT_THEME,
  ...props
}: Props) {
  const [theme, _setTheme] = useState<Theme>(defaultTheme);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      if (!allowThemeChange) {
        console.warn(
          `Wrapping <ThemeProvider> does not have allowThemeChange enabled. Theme change ignored.`
        );
        return;
      }

      localStorage.setItem(THEME_STORAGE_KEY, newTheme);

      THEME_VALUES.forEach((value) => {
        document.body.classList.remove(value);
      });
      document.body.classList.add(newTheme);

      _setTheme(newTheme);
    },
    [allowThemeChange]
  );

  useEffect(() => {
    if (allowThemeChange) {
      const storedThemeValue = localStorage.getItem(THEME_STORAGE_KEY) as any;
      if (THEME_VALUES.includes(storedThemeValue)) {
        setTheme(storedThemeValue);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        setTheme,
        theme,
      }}
    >
      <div
        className={`${s.theme} ${
          allowThemeChange ? undefined : theme
        } ${className}`}
        data-allow-theme-change={allowThemeChange}
        {...props}
      />
    </ThemeContext.Provider>
  );
}

// https://www.joshwcomeau.com/react/dark-mode/

export function initializeSsrTheme(defaulTheme: Theme = DEFAULT_THEME) {
  return `
  (function() {
    function getStoredTheme() {
      if (localStorage.getItem('${THEME_STORAGE_KEY}')) {
        return localStorage.getItem('${THEME_STORAGE_KEY}');
      }
      return '${defaulTheme}';
    }
    
    document.body.classList.add(getStoredTheme());
  })();
`;
}

/*
  NOTE: If we wanted to respect a user's OS preference for theme, we could update
  initializeTheme() to use window.matchMedia() like so:

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' ;
*/
