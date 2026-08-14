import React, { useState } from 'react';
import { createUnprovenDeployTx } from '@midnight-ntwrk/midnight-js-contracts';
import { sampleSigningKey } from '@midnight-ntwrk/ledger-v8';
import type { WalletConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import { CompiledScholarshipContractBrowser } from './browserContract';
import { buildProofProvider, zkConfigProvider } from './browserProviders';
import { buildWalletProviderAdapter } from './walletProviderAdapter';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

interface DeployContractProps {
  walletAPI: WalletConnectedAPI;
}

const DeployContract: React.FC<DeployContractProps> = ({ walletAPI }) => {
  const [loading, setLoading] = useState(false);
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDeploy = async () => {
    setLoading(true);
    setError(null);
    setDeployedAddress(null);

    try {
      setNetworkId('preprod');
      const { walletProvider } = await buildWalletProviderAdapter(walletAPI);
      const proofProvider = await buildProofProvider(walletAPI);

      const unsubmitted = await createUnprovenDeployTx(
        { zkConfigProvider, walletProvider } as any,
        {
          compiledContract: CompiledScholarshipContractBrowser,
          signingKey: sampleSigningKey(),
          initialPrivateState: { income: 0n },
          args: [],
        } as any,
      );

      const unprovenTx = unsubmitted.private.unprovenTx;
      const provenTx = await proofProvider.proveTx(unprovenTx);

      const hexTx = toHex(provenTx.serialize());
      const balanced = await walletAPI.balanceUnsealedTransaction(hexTx, { payFees: true });
      await walletAPI.submitTransaction(balanced.tx);

      const address = (unsubmitted as any).public?.contractAddress ?? '(check Lace Activity for tx details)';
      setDeployedAddress(address);
    } catch (err) {
  console.error('=== DEPLOY ERROR DUMP ===');
  let current: any = err;
  let depth = 0;
  while (current && depth < 6) {
    const props: Record<string, string> = {};
    if (current && typeof current === 'object') {
      for (const key of Object.getOwnPropertyNames(current)) {
        try {
          const val = current[key];
          props[key] = typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val);
        } catch {
          props[key] = '<unreadable>';
        }
      }
    }
    console.error(`LEVEL ${depth}: ${String(current)}\nPROPS: ${JSON.stringify(props, null, 2)}`);
    current = current?.cause;
    depth++;
  }
  setError(err instanceof Error ? err.message : 'Failed to deploy contract');
} finally {
  setLoading(false);
}
};

  return (
    <div style={{ border: '1px solid #444', padding: '1rem', marginTop: '1rem' }}>
      <h2>Deploy to Preprod</h2>
      <button onClick={handleDeploy} disabled={loading}>
        {loading ? 'Deploying...' : 'Deploy Contract'}
      </button>
      {deployedAddress && (
        <p>Deployed at: <code>{deployedAddress}</code></p>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default DeployContract;