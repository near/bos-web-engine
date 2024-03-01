/*
  This file re-exports the plugin type definitions that will be provided to Monaco in 
  the "file:///plugins.d.ts" in "constants.ts".
  
  This file is processed by the "build:artifacts" script setup in "package.json" (which uses 
  dts-bundle-generator) and outputs a file at "./artifacts/plugins.d.ts.txt". The "string" 
  rollup plugin will resolve any "*.txt" imports as strings.

  If a new plugin is added (or removed/renamed), you'll need to:

  1. Update this file with an export below

  2. Update the contents of the "file:///plugins.d.ts" entry of "MONACO_EXTERNAL_LIBRARIES" in 
  "constants.ts" to export the module

  If an existing plugin is modified (maybe a new method is added), no updates are necessary. 
  You'll just need to make sure that the "build:artifacts" command is re-run to pull in the 
  updated type definitions. This happens automatically if you quit and restart "pnpm dev" 
  or simply run "pnpm build" for the entire monorepo.
*/

export type {
  SocialDbPlugin,
  SocialGetResponse,
} from '@bos-web-engine/social-db-plugin';
export type { WalletSelectorPlugin } from '@bos-web-engine/wallet-selector-plugin';
