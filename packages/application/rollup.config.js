import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import webWorkerLoader from 'rollup-plugin-web-worker-loader';

const extensions = ['.js', '.jsx', '.ts', '.tsx'];
const globals = {
  react: 'React',
  'react-dom': 'ReactDOM',
};

/** @type {import('rollup').RollupOptions} */
const options = {
  treeshake: 'smallest',
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
    webWorkerLoader({ targetPlatform: 'browser' }),
    json(),
  ],
};

export default options;
