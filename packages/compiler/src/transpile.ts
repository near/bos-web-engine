import Babel from '@babel/standalone';
import initSwc, { transformSync } from '@swc/wasm-web';

/**
 * Transpile the Component's JSX source code, replacing React.createElement with `createElement`
 * @param source Component function source code using JSX
 */
function transpileSourceBabel(source: string): {
  code?: string | null;
} {
  return Babel.transform(source, {
    presets: [Babel.availablePresets['typescript']],
    plugins: [
      [
        Babel.availablePlugins['transform-react-jsx'],
        { pragma: 'createElement' },
      ],
    ],
    filename: 'component.tsx', // name is not important, just the extension
  });
}

// ! make sure you uncomment the place in compiler.ts where we await this promise
export const initPromise = initSwc();

function transpileSourceSwc(source: string): {
  code?: string | null;
} {
  console.log('SWC');
  const output = transformSync(source, {
    jsc: {
      parser: {
        syntax: 'typescript',
        tsx: true,
      },
      transform: {
        react: {
          pragma: 'createElement',
          // pragmaFrag: 'Fragment',
        },
      },
    },
  });
  // debugger;
  return output;
}

// use these to easily swap between babel and swc
export const transpileSource = transpileSourceSwc;
// export const transpileSource = transpileSourceBabel;
