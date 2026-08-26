import React from 'react';

interface WalletCardProps {
  isConnected: boolean;
  walletAddress: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

const WalletCard: React.FC<WalletCardProps> = ({
  isConnected,
  walletAddress,
  onConnect,
  onDisconnect,
}) => {
    return (
    <div className="card">
      <div className="card-title">
        <span className="card-icon">👛</span>
        Wallet Connection
      </div>
      <div className="status-row">
        <span className={`status-badge ${isConnected ? 'status-connected' : 'status-disconnected'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      {isConnected && walletAddress ? (
        <div className="wallet-address" title={walletAddress}>{walletAddress}</div>
      ) : (
        <p className="privacy-note">Connect your Midnight wallet to get started.</p>
      )}
      {isConnected ? (
        <button className="secondary" onClick={onDisconnect}>Disconnect Wallet</button>
      ) : (
        <button onClick={onConnect}>Connect Wallet</button>
      )}
    </div>
  );
};

export default WalletCard;