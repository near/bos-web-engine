import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import postcssPresetEnv from 'postcss-preset-env';
import copy from 'rollup-plugin-copy';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss';

const extensions = ['.js', '.jsx', '.ts', '.tsx'];
const globals = {
  react: 'React',
  'react-dom': 'ReactDOM',
};

/** @type {import('rollup').RollupOptions} */
const options = {
  input: ['./src/index.ts'],
  output: [
    {
      file: './lib/index.esm.js',
      format: 'esm',
      globals,
    },
    {
      file: './lib/index.cjs.js',
      format: 'cjs',
      globals,
    },
  ],
  plugins: [
    peerDepsExternal(),
    nodeResolve({ extensions, browser: true }),
    commonjs(),
    typescript(),
    copy({
      targets: [{ src: 'reset.css', dest: 'lib' }],
    }),
    postcss({
      extract: 'styles.css',
      modules: true,
      plugins: [
        postcssPresetEnv({
          stage: 3,
          features: {
            'nesting-rules': true,
          },
        }),
      ],
    }),
  ],
};

export default options;
