import React, { useState } from 'react';
import WalletCard from './WalletCard';
import '@midnight-ntwrk/dapp-connector-api';
import { selectWallet } from './selectWallet';

const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);
    let connected = false;
    let address = null;

    try {
      const wallet = selectWallet();

      // Connect to Preprod, matching Level 2's network requirement
      const connectedApi = await wallet.connect('preprod');

      const { unshieldedAddress } = await connectedApi.getUnshieldedAddress();
      address = unshieldedAddress;

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
  };

  const handleDisconnect = () => {
    setWalletAddress(null);
    setIsConnected(false);
    setError(null);
  };

  return (
    <div>
      <header>
        <h1>ScholarVerify</h1>
      </header>
      <main>
        <WalletCard
          isConnected={isConnected}
          walletAddress={walletAddress}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </main>
    </div>
  );
};

export default App;