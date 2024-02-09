import { useContext } from 'react';

import { ThemeContext } from '../components/ThemeProvider';

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useTheme() must be used inside the context provided by <ThemeProvider>'
    );
  }

  let { theme, setTheme } = context;

  return {
    theme,
    setTheme,
  };
};
