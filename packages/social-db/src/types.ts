import type { DeepPartial } from '@bos-web-engine/common';
import type { BlockId, Finality } from '@near-js/types';
import type { NetworkId, WalletSelector } from '@near-wallet-selector/core';

export type RpcFetchParams = {
  contractId?: string;
  data: Record<any, any>;
  methodName: string;
} & (
  | {
      blockId?: never;
      finality?: Finality;
    }
  | {
      blockId: BlockId;
      finality?: never;
    }
);

export type SocialSdkConstructorParams = {
  debug?: boolean;
  networkId: NetworkId;
  walletSelector?: WalletSelector | null;
};

interface SocialGetOptions {
  with_block_height?: boolean;
  with_node_id?: boolean;
  return_deleted?: boolean;
}

export type SocialGetParams = {
  options?: SocialGetOptions;
} & (
  | {
      key: string;
      keys?: never;
    }
  | {
      key?: never;
      keys: string[];
    }
) &
  (
    | {
        blockId?: never;
        finality?: Finality;
      }
    | {
        blockId: BlockId;
        finality?: never;
      }
  );

export type SocialSetParams = {
  data: Record<string, any>;
  strategy?: 'DIFF' | 'FORCE';
};

export type SocialGetResponse<T> = {
  [accountId: string]: DeepPartial<T> | undefined;
};

export type SocialProfile = DeepPartial<{
  backgroundImage: {
    ipfs_cid: string;
    url: string;
  };
  description: string;
  linktree: {
    github: string;
    twitter: string;
    website: string;
  };
  name: string;
  image: {
    ipfs_cid: string;
    url: string;
  };
  tags: Record<string, ''>;
}>;
