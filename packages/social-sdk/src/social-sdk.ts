import { JsonRpcProvider } from '@near-js/providers';
import type {
  AccountState,
  NetworkId,
  WalletSelector,
  WalletSelectorState,
} from '@near-wallet-selector/core';

import {
  MAINNET_RPC_URL,
  MAINNET_SOCIAL_CONTRACT_ID,
  TESTNET_RPC_URL,
  TESTNET_SOCIAL_CONTRACT_ID,
} from './constants';
import { fetchWithProvider } from './provider';

export class SocialSdk {
  private walletSelector: WalletSelector;
  private provider: JsonRpcProvider;
  private networkId: NetworkId;

  constructor(walletSelector: WalletSelector) {
    const networkId = walletSelector.options.network.networkId as NetworkId;

    this.networkId = networkId;
    this.walletSelector = walletSelector;
    this.provider = new JsonRpcProvider({
      url: networkId === 'mainnet' ? MAINNET_RPC_URL : TESTNET_RPC_URL,
    });
  }

  private get contractId(): string {
    return this.networkId === 'mainnet'
      ? MAINNET_SOCIAL_CONTRACT_ID
      : TESTNET_SOCIAL_CONTRACT_ID;
  }

  private get accountState(): AccountState | null {
    return this.walletSelectorState?.accounts[0] ?? null;
  }

  private get walletSelectorState(): WalletSelectorState | null {
    return this.walletSelector.store.getState();
  }

  async set() {
    // if (!this.wallet || !this.account?.publicKey) return;
    // try {
    //   const foo = await this.wallet.signAndSendTransaction({
    //     actions: [
    //       {
    //         params: {
    //           methodName: 'grant_write_permission',
    //           args: {
    //             public_key: this.account.publicKey,
    //             keys: [this.account.accountId],
    //           },
    //           gas: (ONE_TGAS * 100).toString(),
    //           deposit: '',
    //         },
    //         type: 'FunctionCall',
    //       },
    //     ],
    //     receiverId: 'social.near',
    //   });
    // } catch (error) {
    //   console.error(error);
    // }
  }

  async test() {
    const data = await fetchWithProvider<any>(this.provider, {
      accountId: this.contractId,
      args: {
        account_id: this.accountState?.accountId,
      },
      methodName: 'get_account_storage',
    });

    console.log(data);
  }

  async wallet() {
    try {
      if (
        this.walletSelectorState &&
        this.walletSelectorState.accounts.length > 0 &&
        this.walletSelectorState.selectedWalletId
      ) {
        return await this.walletSelector.wallet();
      }
    } catch (error) {
      console.error(error);
    }

    return null;
  }
}
