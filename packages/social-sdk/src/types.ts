import { BlockId, Finality } from '@near-js/types';

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

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

export type SocialGetParams = (
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
