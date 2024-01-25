import Big from 'big.js';

export const ONE_TGAS = Big(10).pow(12);
export const MAX_GAS_PER_TRANSACTION = ONE_TGAS.mul(250);
export const STORAGE_COST_PER_BYTE = Big(10).pow(19);

export const TESTNET_SOCIAL_CONTRACT_ID = '';
export const MAINNET_SOCIAL_CONTRACT_ID = 'social.near';

export const TESTNET_RPC_URL = 'https://rpc.testnet.near.org';
export const MAINNET_RPC_URL = 'https://rpc.mainnet.near.org';
