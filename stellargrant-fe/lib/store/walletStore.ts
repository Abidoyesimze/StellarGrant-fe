/**
 * Wallet Store (Zustand)
 * 
 * Global state management for wallet connection and network settings.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

type WalletType = "freighter" | "xbull" | "passkey" | null;
type Network = "testnet" | "mainnet" | "futurenet";

interface WalletStore {
  address: string | null;
  walletType: WalletType;
  network: Network;
  setAddress: (address: string | null) => void;
  setWalletType: (type: WalletType) => void;
  setNetwork: (network: Network) => void;
  reset: () => void;
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      address: null,
      walletType: null,
      network: "testnet",
      setAddress: (address) => set({ address }),
      setWalletType: (walletType) => set({ walletType }),
      setNetwork: (network) => set({ network }),
      reset: () => set({ address: null, walletType: null, network: "testnet" }),
    }),
    { name: "stellar-grants-wallet" }
  )
);
