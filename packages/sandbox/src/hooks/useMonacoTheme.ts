import { useTheme } from '@bos-web-engine/ui';

export function useMonacoTheme() {
  const { theme } = useTheme();
  const monacoTheme = theme === 'dark' ? 'vs-dark' : 'vs-light';
  return monacoTheme;
}
