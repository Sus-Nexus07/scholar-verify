import React, { useState } from 'react';
import WalletCard from './WalletCard';
import CircuitCall from './CircuitCall';
import '@midnight-ntwrk/dapp-connector-api';
import { selectWallet } from './selectWallet';

const CONTRACT_ADDRESS = 'PASTE_PREPROD_ADDRESS_HERE';

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
        {isConnected && walletAPI && (
          <CircuitCall walletAPI={walletAPI} contractAddress={CONTRACT_ADDRESS} />
        )}
      </main>
    </div>
  );
};

export default App;