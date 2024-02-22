/* eslint-disable import/order */
import type { SerializedArgs } from '@bos-web-engine/common';
import type { Action } from '@near-js/transactions';
import type { SignMessageParams, Wallet } from '@near-wallet-selector/core';
import { Buffer } from 'buffer'; // NPM package for browser compatibility
/* eslint-disable import/order */

interface SignComponentMessageParams {
  args: SerializedArgs;
  wallet: Wallet;
}

/**
 * Convert serialized Uint8Array into Buffer and return result of wallet method invocation
 * @param args Raw serialized arguments sent from the calling iframe container
 * @param wallet Wallet instance
 */
function signMessage({ args, wallet }: SignComponentMessageParams) {
  if (!wallet.signMessage) {
    throw new Error('Wallet does not support signMessage()');
  }

  const params = args[0] as SignMessageParams & { nonce: object };
  return wallet.signMessage({
    ...params,
    nonce: Buffer.from(Object.values(params.nonce)),
  });
}

/**
 * Convert serialized Uint8Array into Buffer and return result of wallet method invocation
 * @param args Raw serialized arguments sent from the calling iframe container
 * @param wallet Wallet instance
 */
function signAndSendTransaction({ args, wallet }: SignComponentMessageParams) {
  if (!wallet.signAndSendTransaction) {
    throw new Error('Wallet does not support signAndSendTransaction()');
  }

  const params = args[0] as { receiverId: string; actions: Action[] };
  // @ts-expect-error FIXME incompatible @near-js versions?
  return wallet.signAndSendTransaction(params);
}

const WalletSelector = {
  signMessage,
  signAndSendTransaction,
};

export default WalletSelector;
