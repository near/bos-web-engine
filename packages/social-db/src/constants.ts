import { Big } from 'big.js';

export const TESTNET_SOCIAL_CONTRACT_ID = 'v1.social08.testnet';
export const MAINNET_SOCIAL_CONTRACT_ID = 'social.near';

export const TESTNET_RPC_URL = 'https://rpc.testnet.near.org';
export const MAINNET_RPC_URL = 'https://rpc.mainnet.near.org';

export const SOCIAL_COMPONENT_NAMESPACE = 'component_alpha';
export const SOCIAL_IPFS_BASE_URL = 'https://ipfs.near.social/ipfs';
export const BLOCK_HEIGHT_KEY = ':block';

// The following gas, storage, and size values were copied from NearSocial/VM:
export const ONE_TGAS = Big(10).pow(12);
export const MAX_GAS_PER_TRANSACTION = ONE_TGAS.mul(250);
export const STORAGE_COST_PER_BYTE = Big(10).pow(19);
export const MIN_STORAGE_BALANCE = STORAGE_COST_PER_BYTE.mul(2000);
export const INITIAL_ACCOUNT_STORAGE_BALANCE = STORAGE_COST_PER_BYTE.mul(500);
export const WRITE_PERMISSION_STORAGE_BALANCE = STORAGE_COST_PER_BYTE.mul(500);
export const EXTRA_STORAGE_BALANCE = STORAGE_COST_PER_BYTE.mul(500);
export const ESTIMATED_KEY_VALUE_SIZE = 40 * 3 + 8 + 12;
export const ESTIMATED_NODE_SIZE = 40 * 2 + 8 + 10;
