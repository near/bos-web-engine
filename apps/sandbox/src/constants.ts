import { WalletSelectorParams } from '@near-wallet-selector/core';
import { setupHereWallet } from '@near-wallet-selector/here-wallet';
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet';
import { setupNightly } from '@near-wallet-selector/nightly';
import { setupSender } from '@near-wallet-selector/sender';

export const MAINNET_WALLET_SELECTOR_PARAMS: WalletSelectorParams = {
  network: 'mainnet',
  modules: [
    setupSender(),
    setupHereWallet(),
    setupMeteorWallet(),
    setupNightly(),
  ],
};
