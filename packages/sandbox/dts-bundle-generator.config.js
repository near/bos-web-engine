// @ts-check

// https://github.com/timocov/dts-bundle-generator/blob/master/src/config-file/README.md

/** @type import('dts-bundle-generator/config-schema').BundlerConfig */
const config = {
  compilationOptions: {
    preferredConfigPath: './tsconfig.json',
  },

  entries: [
    {
      filePath: './src/plugins.ts',
      outFile: './artifacts/plugins.d.ts',

      libraries: {
        importedLibraries: [],
        inlinedLibraries: [
          'bn.js',
          'rxjs',
          'near-api-js',
          '@near-js/crypto',
          '@near-js/types',
          '@near-wallet-selector/core',
        ],
      },

      output: {
        noBanner: true,
        inlineDeclareGlobals: false,
        exportReferencedTypes: false,
      },
    },
  ],
};

module.exports = config;
