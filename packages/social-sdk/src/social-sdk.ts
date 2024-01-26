import { JsonRpcProvider } from '@near-js/providers';
import { CodeResult } from '@near-js/types';
import type {
  AccountState,
  Action,
  NetworkId,
  WalletSelector,
} from '@near-wallet-selector/core';
import { Big } from 'big.js';

import {
  EXTRA_STORAGE_BALANCE,
  INITIAL_ACCOUNT_STORAGE_BALANCE,
  MAINNET_RPC_URL,
  MAINNET_SOCIAL_CONTRACT_ID,
  MIN_STORAGE_BALANCE,
  ONE_TGAS,
  STORAGE_COST_PER_BYTE,
  TESTNET_RPC_URL,
  TESTNET_SOCIAL_CONTRACT_ID,
  WRITE_PERMISSION_STORAGE_BALANCE,
} from './constants';
import {
  type DebugLogMessage,
  type DebugLogParams,
  debugLog,
} from './debug-log';
import type {
  RpcFetchParams,
  SocialGetParams,
  SocialGetResponse,
  SocialSdkConstructorParams,
  SocialSetParams,
} from './types';
import {
  bigMax,
  convertToStringLeaves,
  encodeJsonRpcArgs,
  estimateRequiredBytesForStorage,
  extractKeys,
  parseJsonRpcResponse,
  removeDuplicateData,
} from './utils';

export class SocialSdk {
  debug;
  networkId: NetworkId;
  walletSelector: WalletSelector | null;

  private testnetProvider: JsonRpcProvider;
  private mainnetProvider: JsonRpcProvider;

  /**
   * Interact with the `social.near` contract (Social DB).
   * @param debug - Optionally pass as `true` to enable logging. Defaults to `false`.
   * @param networkId - Used to determine which RPC provider will be used internally.
   * @param walletSelector - Optionally pass a `walletSelector` instance. This is only needed if you plan on setting data - eg: `set()`. Defaults to `null`.
   */
  constructor({
    debug = false,
    networkId,
    walletSelector,
  }: SocialSdkConstructorParams) {
    if (!networkId) {
      throw new Error('Must pass `networkId`.');
    }

    this.debug = debug;
    this.networkId = networkId;
    this.walletSelector = walletSelector ?? null;

    this.testnetProvider = new JsonRpcProvider({
      url: TESTNET_RPC_URL,
    });

    this.mainnetProvider = new JsonRpcProvider({
      url: MAINNET_RPC_URL,
    });
  }

  private get contractId() {
    return this.networkId === 'mainnet'
      ? MAINNET_SOCIAL_CONTRACT_ID
      : TESTNET_SOCIAL_CONTRACT_ID;
  }

  private get accountState() {
    return this.walletSelectorState?.accounts[0] ?? null;
  }

  private get provider() {
    if (this.networkId === 'mainnet') return this.mainnetProvider;
    return this.testnetProvider;
  }

  private get walletSelectorState() {
    return this.walletSelector?.store.getState() ?? null;
  }

  /**
   * Fetch data for the specified `key` or `keys`.
   *
   * @example
   * ```
   * const response = await get<T>({
   *  key: 'foobar.near/profile/*',
   * });
   * ```
   *
   * @param blockId - Optionally specify a specific block height (number) or block hash (string). {@link https://docs.near.org/api/rpc/block-chunk}
   * @param key - Return data from a single key.
   * @param keys - Return data from multiple keys. This param is ignored if a value is passed for `key`.
   * @param finality - Optionally specify a finality. Defaults to `optimistic`. This param is ignored if a value is passed for `blockId`. {@link https://docs.near.org/api/rpc/block-chunk}
   */
  async get<T = Record<string, any>>({
    blockId,
    key,
    keys,
    finality = 'optimistic',
  }: SocialGetParams): Promise<SocialGetResponse<T>> {
    const normalizedKeys = ((key ? [key] : keys) ?? []).filter(
      (value) => value
    );

    if (normalizedKeys.length === 0) {
      throw new Error(
        'Must pass a valid `key` or `keys` parameter with non empty string(s).'
      );
    }

    if (!blockId && !finality) {
      throw new Error('Must pass either `blockId` or `finality`');
    }

    const response = await this.rpcFetch<SocialGetResponse<T>>({
      data: {
        keys: normalizedKeys,
      },
      methodName: 'get',
      ...(blockId ? { blockId } : { finality }),
    });

    return response;
  }

  /**
   * Sets data in the current user's namespace.
   *
   * @example
   * ```
   * await set({
   *  data: {
   *    profile: {
   *      name: 'Foo Bar'
   *    }
   *  }
   * });
   * ```
   *
   * @param data - Data to commit to the current user's namespace. Can contain multiple keys and each key can contain multiple values. All keys are merged with existing data.
   * @param strategy - Determines how data is set when compared with existing data. Defaults to `DIFF`.
   * - `DIFF` The most efficient option for storage cost. Will ignore saving keys that are equal to the value already stored.
   * - `FORCE` Will save all keys that are passed without checking the currently stored value. All keys are still merged with existing data.
   */
  async set({ data, strategy = 'DIFF' }: SocialSetParams) {
    const wallet = await this.wallet();

    if (!wallet || !this.accountState?.publicKey) {
      throw new Error(
        'User needs to be signed in with wallet before setting data.'
      );
    }

    const { availableBytes, hasInitializedStorageBalance, hasWritePermission } =
      await this.fetchStorageAndPermissions(
        this.accountState,
        this.accountState.publicKey
      );

    let currentData: Record<string, any> = {};
    let dataToWrite = {
      [this.accountState.accountId]: convertToStringLeaves(data),
    };

    if (strategy === 'DIFF') {
      currentData = await this.get({
        keys: extractKeys(dataToWrite),
      });
      dataToWrite = removeDuplicateData(dataToWrite, currentData);
    }

    const bytes = estimateRequiredBytesForStorage(dataToWrite, currentData);

    const expectedStorageBalance = STORAGE_COST_PER_BYTE.mul(bytes)
      .add(
        hasInitializedStorageBalance ? Big(0) : INITIAL_ACCOUNT_STORAGE_BALANCE
      )
      .add(hasWritePermission ? Big(0) : WRITE_PERMISSION_STORAGE_BALANCE)
      .add(EXTRA_STORAGE_BALANCE);

    let deposit = bigMax(
      expectedStorageBalance.sub(
        Big(availableBytes).mul(STORAGE_COST_PER_BYTE)
      ),
      hasInitializedStorageBalance ? Big(1) : MIN_STORAGE_BALANCE
    );

    const actions: Action[] = [];

    if (!hasWritePermission) {
      actions.push({
        params: {
          methodName: 'grant_write_permission',
          args: {
            public_key: this.accountState.publicKey,
            keys: [this.accountState.accountId],
          },
          gas: ONE_TGAS.mul(100).toFixed(0),
          deposit: deposit.toFixed(0),
        },
        type: 'FunctionCall',
      });

      deposit = Big(0);
    }

    actions.push({
      params: {
        methodName: 'set',
        args: {
          data: dataToWrite,
        },
        gas: ONE_TGAS.mul(100).toFixed(0),
        deposit: deposit.toFixed(0),
      },
      type: 'FunctionCall',
    });

    const request = {
      receiverId: this.contractId,
      actions,
    };

    const debugLogRequestMessage: DebugLogMessage = {
      data: request,
      type: 'REQUEST',
    };

    try {
      const response = await wallet.signAndSendTransaction(request);

      this.log({
        source: 'RPC Signed Transaction',
        messages: [
          debugLogRequestMessage,
          {
            data: response,
            type: 'RESPONSE',
          },
        ],
      });

      return response;
    } catch (error) {
      this.log({
        source: 'RPC Signed Transaction',
        messages: [
          debugLogRequestMessage,
          {
            data: error,
            type: 'ERROR',
          },
        ],
      });

      if (
        (error as any)?.message ===
        'Invalid message. Only transactions can be signed'
      ) {
        // This provides a more DX friendly message when cancelling a transaction
        throw new Error('RPC transaction cancelled by user.');
      }
      throw error;
    }
  }

  private async fetchStorageAndPermissions(
    accountState: AccountState,
    publicKey: string
  ) {
    const [accountStorage, hasWritePermission] = await Promise.all([
      this.rpcFetch<
        | {
            available_bytes: number;
            used_bytes: number;
          }
        | undefined
      >({
        data: {
          account_id: accountState.accountId,
        },
        methodName: 'get_account_storage',
      }),

      this.rpcFetch<boolean>({
        data: {
          public_key: publicKey,
          key: accountState.accountId,
        },
        methodName: 'is_write_permission_granted',
      }),
    ]);

    return {
      availableBytes: accountStorage?.available_bytes ?? 0,
      hasInitializedStorageBalance: !!accountStorage,
      hasWritePermission,
      usedBytes: accountStorage?.used_bytes ?? 0,
    };
  }

  private log(params: DebugLogParams) {
    if (this.debug) {
      debugLog(params);
    }
  }

  private async rpcFetch<T>({
    blockId,
    contractId,
    data,
    finality = 'optimistic',
    methodName,
  }: RpcFetchParams) {
    // TODO: Should we make this a public method? Would allow end users to easily fetch data from any contract.

    const request = {
      account_id: contractId ?? this.contractId,
      args_base64: encodeJsonRpcArgs(data),
      block_id: blockId,
      finality: blockId ? undefined : finality,
      method_name: methodName,
      request_type: 'call_function',
    };

    const debugLogRequestMessage: DebugLogMessage = {
      data: { data, ...request },
      type: 'REQUEST',
    };
    const debugLogIdentifier =
      'keys' in data && Array.isArray(data.keys)
        ? JSON.stringify(data.keys)
        : undefined;

    try {
      const response = await this.provider.query<CodeResult>(request);
      const responseData = parseJsonRpcResponse(response.result) as T;

      this.log({
        source: 'RPC View',
        identifier: debugLogIdentifier,
        messages: [
          debugLogRequestMessage,
          {
            data: responseData,
            type: 'RESPONSE',
          },
        ],
      });

      return responseData;
    } catch (error) {
      this.log({
        source: 'RPC View',
        identifier: debugLogIdentifier,
        messages: [
          debugLogRequestMessage,
          {
            data: error,
            type: 'ERROR',
          },
        ],
      });

      throw error;
    }
  }

  private async wallet() {
    if (!this.walletSelector) {
      throw new Error(
        'Social SDK must be configured with `walletSelector` instance to support setting data.'
      );
    }

    try {
      if (
        this.walletSelector &&
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
