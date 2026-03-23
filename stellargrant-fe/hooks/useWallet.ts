/**
 * useWallet Hook
 * 
 * Core hook for wallet state. Returns connected address, network,
 * signing functions, and connection status.
 */

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  network: "testnet" | "mainnet" | "futurenet";
  walletType: "freighter" | "xbull" | "passkey" | null;
  connect: (type: "freighter" | "xbull" | "passkey") => Promise<void>;
  disconnect: () => void;
  signTransaction: (xdr: string) => Promise<string>;
}

export function useWallet(): WalletState {
  // TODO: Implement wallet hook
  return {
    address: null,
    isConnected: false,
    isConnecting: false,
    network: "testnet",
    walletType: null,
    connect: async () => {},
    disconnect: () => {},
    signTransaction: async () => "",
  };
}
