import Babel from '@babel/standalone';

/**
 * Transpile the Component's JSX source code, replacing React.createElement with `createElement`
 * @param source Component function source code using JSX
 */
export function transpileSource(source: string): {
  code?: string | null;
} {
  return Babel.transform(source, {
    plugins: [
      [
        Babel.availablePlugins['transform-react-jsx'],
        { pragma: 'createElement' },
      ],
    ],
  });
}
