import React, { useState } from 'react';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { WalletConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { CompiledScholarshipContract } from '../contracts/index';
import { buildBrowserProviders, buildProofProvider } from './browserProviders';

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
      const incomeValue = BigInt(income);
      const programId = new Uint8Array(32).fill(1);

      const browserProviders = buildBrowserProviders(walletAPI);
      const proofProvider = await buildProofProvider(walletAPI);

      browserProviders.privateStateProvider.setContractAddress(contractAddress);
      await browserProviders.privateStateProvider.set(PRIVATE_STATE_ID, { income: incomeValue });

      const providers = { ...browserProviders, proofProvider };

      const foundContract = await findDeployedContract(providers as any, {
        compiledContract: CompiledScholarshipContract,
        contractAddress,
        privateStateId: PRIVATE_STATE_ID,
      });

      await foundContract.callTx.checkEligibility(BigInt(threshold), programId);

      // The circuit's result lives on-chain in ledger state, not in the call
      // return value directly — re-query the public ledger to read it.
      const state = await browserProviders.publicDataProvider.queryContractState(contractAddress);
      const ledgerState = state as any;
      setResult(ledgerState?.data?.eligible ?? null);

      // Clear the income input immediately after submission — it must never
      // remain visible or re-displayed once the proof has been generated.
      setIncome('');
    } catch (err) {
      console.error('Circuit call error:', err);
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