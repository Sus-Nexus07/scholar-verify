import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import type { WalletConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';

const zkConfigBaseUrl = new URL('/contract/collection', window.location.origin).toString();

export const zkConfigProvider = new FetchZkConfigProvider(zkConfigBaseUrl, window.fetch.bind(window));

export async function buildProofProvider(walletAPI: WalletConnectedAPI) {
  // Lace does not yet implement getProvingProvider() (delegated proving) as of mid-2026,
  // so we fall back to httpClientProofProvider using Lace's own configured proof server URL.
  if (typeof (walletAPI as any).getProvingProvider === 'function') {
    return await (walletAPI as any).getProvingProvider(zkConfigProvider);
  }
  const config = await walletAPI.getConfiguration();
  const proverServerUri = (config as any).proverServerUri || 'http://localhost:6300';
  return httpClientProofProvider(proverServerUri, zkConfigProvider);
}

export function createPrivateStateProvider() {
  let contractAddressScope = '';
  const stateStore = new Map<string, unknown>();

  return {
    setContractAddress(address: string) {
      contractAddressScope = address;
    },
    async set(privateStateId: string, state: unknown) {
      stateStore.set(`${contractAddressScope}:${privateStateId}`, state);
    },
    async get(privateStateId: string) {
      return stateStore.get(`${contractAddressScope}:${privateStateId}`) ?? null;
    },
    async remove(privateStateId: string) {
      stateStore.delete(`${contractAddressScope}:${privateStateId}`);
    },
    async clear() {
      stateStore.clear();
    },
  };
}

import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { PREPROD_CONFIG } from './config';

export function buildBrowserProviders(walletAPI: WalletConnectedAPI) {
  const privateStateProvider = createPrivateStateProvider();

  return {
    privateStateProvider,
    publicDataProvider: indexerPublicDataProvider(
      PREPROD_CONFIG.indexer,
      PREPROD_CONFIG.indexerWS,
    ),
    zkConfigProvider,
    walletProvider: walletAPI,
    midnightProvider: walletAPI,
  };
}