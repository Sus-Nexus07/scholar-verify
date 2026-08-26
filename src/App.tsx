import React, { useState } from 'react';
import WalletCard from './WalletCard';
import CircuitCall from './CircuitCall';
import DeployContract from './DeployContract';
import '@midnight-ntwrk/dapp-connector-api';
import { selectWallet } from './selectWallet';


const CONTRACT_ADDRESS = '3182851944c8320e06fda1551cf5d9de0e4f2dd3e462bdf215207d5f216dd486';
const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletAPI, setWalletAPI] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);
    let connected = false;
    let address = null;
    let api = null;

    try {
      const wallet = selectWallet();
      const connectedApi = await wallet.connect('preprod');

      const { unshieldedAddress } = await connectedApi.getUnshieldedAddress();
      address = unshieldedAddress;
      api = connectedApi;

      const connectionStatus = await connectedApi.getConnectionStatus();
      if (connectionStatus.status === 'connected') {
        connected = true;
      }
    } catch (err) {
      console.error('Wallet connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    }

    setIsConnected(connected);
    setWalletAddress(address);
    setWalletAPI(api);
  };

  const handleDisconnect = () => {
    setWalletAddress(null);
    setIsConnected(false);
    setWalletAPI(null);
    setError(null);
  };

      return (
    <div className="page">
      <div className="orb-field">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <section className="hero">
        <div className="app-badge">🔒 Zero-Knowledge · Midnight Network</div>
        <h1>ScholarVerify</h1>
        <p className="hero-subtitle">
          Prove you qualify for a scholarship without ever revealing your income.
          Built on Midnight's zero-knowledge infrastructure — your data stays yours,
          only the answer goes on-chain.
        </p>
      </section>

      <div className="app-container">
        <p className="section-label">How It Works</p>
        <div className="how-it-works">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Connect</h3>
            <p>Link your Midnight wallet — no personal data required to start.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Prove</h3>
            <p>Enter your income locally. A zero-knowledge proof is generated in your browser.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Verify</h3>
            <p>Only a true/false eligibility result is published on-chain — never your income.</p>
          </div>
        </div>

        <WalletCard
          isConnected={isConnected}
          walletAddress={walletAddress}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />
        {error && <p className="error-text">{error}</p>}
        {isConnected && walletAPI && <DeployContract walletAPI={walletAPI} />}
        {isConnected && walletAPI && (
          <CircuitCall walletAPI={walletAPI} contractAddress={CONTRACT_ADDRESS} />
        )}

        <footer className="app-footer">
          Built on Midnight · Preprod Network
        </footer>
      </div>
    </div>
  );
};

export default App;