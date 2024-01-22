import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import nodePolyfills from 'rollup-plugin-polyfill-node';

/** @type {import('rollup').RollupOptions} */
const options = {
  treeshake: 'smallest',
  input: ['./src/index.ts'],
  output: [
    {
      intro: 'var process = { env: {}, cwd: () => {} };',
      file: './lib/index.esm.js',
      format: 'esm',
    },
    {
      intro: 'var process = { env: {}, cwd: () => {} };',
      file: './lib/index.cjs.js',
      format: 'cjs',
    },
  ],
  plugins: [
    peerDepsExternal(),
    nodePolyfills(),
    nodeResolve({
      browser: true,
    }),
    commonjs(),
    typescript(),
    json(),
  ],
};

export default options;
