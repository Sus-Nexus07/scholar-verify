import React, { useState } from 'react';
import { createUnprovenCallTx } from '@midnight-ntwrk/midnight-js-contracts';
import type { WalletConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import { CompiledScholarshipContractBrowser } from './browserContract';
import { buildBrowserProviders, buildProofProvider } from './browserProviders';
import { buildWalletProviderAdapter } from './walletProviderAdapter';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

interface CircuitCallProps {
  walletAPI: WalletConnectedAPI;
  contractAddress: string;
}

const PRIVATE_STATE_ID = 'ScholarVerifyFrontendState';

const CircuitCall: React.FC<CircuitCallProps> = ({ walletAPI, contractAddress }) => {
  const [income, setIncome] = useState('');
  const [threshold] = useState(1_000_000);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProve = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      setNetworkId('preview'); // TEMP: swap to 'preprod' before submission
      const incomeValue = BigInt(income);
      const programId = new Uint8Array(32).fill(1);

      const { walletProvider } = await buildWalletProviderAdapter(walletAPI);
      const baseProviders = buildBrowserProviders(walletAPI);
      const proofProvider = await buildProofProvider(walletAPI);

      baseProviders.privateStateProvider.setContractAddress(contractAddress);
      await baseProviders.privateStateProvider.set(PRIVATE_STATE_ID, { income: incomeValue });

      const providers = { ...baseProviders, walletProvider };

      // Step 1: build the unproven call transaction (does not touch the wallet's
      // balancing/signing machinery at all).
      const unsubmitted = await createUnprovenCallTx(providers as any, {
        compiledContract: CompiledScholarshipContractBrowser,
        circuitId: 'checkEligibility',
        contractAddress,
        args: [BigInt(threshold), programId],
        privateStateId: PRIVATE_STATE_ID,
      } as any);

      // Step 2: prove it ourselves via the proof server.
      const unprovenTx = unsubmitted.private.unprovenTx;
      const provenTx = await proofProvider.proveTx(unprovenTx);

      // Step 3: hand the proven-but-unbalanced transaction to Lace as hex —
      // Lace balances, signs, and binds it. We never deserialize the result
      // ourselves, avoiding any guessed low-level type markers.
      const hexTx = toHex(provenTx.serialize());
      const balanced = await walletAPI.balanceUnsealedTransaction(hexTx, { payFees: true });

      // Step 4: submit the balanced hex directly.
      await walletAPI.submitTransaction(balanced.tx);

      // Step 5: re-query ledger state for the result.
      const state = await baseProviders.publicDataProvider.queryContractState(contractAddress);
      const ledgerState = state as any;
      setResult(ledgerState?.data?.eligible ?? null);

      setIncome('');
    } catch (err) {
      console.error('=== FULL ERROR DUMP ===');
      let current: any = err;
      let depth = 0;
      while (current && depth < 6) {
        console.error(`--- Level ${depth} ---`, String(current));
        console.error('own properties:', Object.getOwnPropertyNames(current));
        current = current.cause;
        depth++;
      }
      setError(err instanceof Error ? err.message : 'Failed to call circuit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Check Scholarship Eligibility</h2>
      <p>Threshold for this program: {threshold.toLocaleString()}</p>
      <label>
        Your income (private — never sent or stored on-chain):
        <input
          type="number"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          disabled={loading}
        />
      </label>
      <button onClick={handleProve} disabled={loading || !income}>
        {loading ? 'Generating proof...' : 'Prove Eligibility'}
      </button>
      <p><em>Proved without revealing your input</em></p>
      {result !== null && (
        <p>Result: {result ? 'Eligible ✅' : 'Not Eligible ❌'}</p>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default CircuitCall;