import { Transaction } from '@midnight-ntwrk/ledger-v8';
import { toHex, fromHex } from '@midnight-ntwrk/midnight-js-utils';
import type { WalletConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';

export async function buildWalletProviderAdapter(walletAPI: WalletConnectedAPI) {
  // Coin/encryption public keys must be available synchronously per the
  // WalletProvider interface, but Lace's API is async — so we fetch once
  // here and cache the result.
  const { shieldedCoinPublicKey, shieldedEncryptionPublicKey } =
    await walletAPI.getShieldedAddresses();

  const walletProvider = {
    getCoinPublicKey(): string {
      return shieldedCoinPublicKey;
    },
    getEncryptionPublicKey(): string {
      return shieldedEncryptionPublicKey;
    },
    async balanceTx(tx: any, _ttl?: Date): Promise<any> {
      const hexTx = toHex(tx.serialize());
      const result = await walletAPI.balanceUnsealedTransaction(hexTx, { payFees: true });
      const rawBytes = fromHex(result.tx);
      return Transaction.deserialize('signature', 'proof', 'binding', new Uint8Array(rawBytes));
    },
  };

  const midnightProvider = {
    async submitTx(tx: any): Promise<string> {
      const hexTx = toHex(tx.serialize());
      await walletAPI.submitTransaction(hexTx);
      // submitTransaction returns void; derive a display-only identifier
      // from the serialized transaction rather than a true tx hash.
      return hexTx.slice(0, 64);
    },
  };

  return { walletProvider, midnightProvider };
}