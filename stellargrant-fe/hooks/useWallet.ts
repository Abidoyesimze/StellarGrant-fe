/**
 * useWallet Hook
 * 
 * Core hook for wallet state. Returns connected address, network,
 * signing functions, and connection status.
 */

"use client";

import { useState, useEffect } from "react";
import * as freighterApi from "@stellar/freighter-api";
import { useWalletStore } from "@/lib/store/walletStore";
import { networkPassphraseConfig } from "@/lib/stellar/client";

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  network: "testnet" | "mainnet" | "futurenet";
  walletType: "freighter" | "xbull" | "passkey" | null;
  connect: (type: "freighter" | "xbull" | "passkey") => Promise<void>;
  disconnect: () => void;
  signTransaction: (xdr: string) => Promise<string>;
  error: string | null;
}

export function useWallet(): WalletState {
  const { address, network, walletType, setAddress, setNetwork, setWalletType, reset } = useWalletStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On mount: re-validate persisted session
  useEffect(() => {
    if (typeof window === "undefined") return;

    async function restoreSession() {
      try {
        const connected = await freighterApi.isConnected();
        if (connected) {
          const key = await freighterApi.getPublicKey();
          const net = await freighterApi.getNetwork();
          setAddress(key);
          setNetwork(net as "testnet" | "mainnet" | "futurenet");
          setWalletType("freighter");
        }
      } catch (err) {
        // Freighter not installed or unavailable — silently fail
        console.debug("Freighter not available:", err);
      }
    }
    restoreSession();
  }, [setAddress, setNetwork, setWalletType]);

  const connect = async (type: "freighter" | "xbull" | "passkey") => {
    setIsConnecting(true);
    setError(null);

    try {
      if (type === "freighter") {
        if (typeof window === "undefined") {
          throw new Error("Freighter is only available in the browser");
        }

        const key = await freighterApi.getPublicKey();
        const net = await freighterApi.getNetwork();
        setAddress(key);
        setNetwork(net as "testnet" | "mainnet" | "futurenet");
        setWalletType("freighter");
      } else {
        throw new Error(`${type} wallet is not supported yet`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect wallet";
      setError(message);
      console.error("Wallet connection error:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    reset();
    setError(null);
  };

  const sign = async (xdr: string): Promise<string> => {
    if (typeof window === "undefined") {
      throw new Error("Signing is only available in the browser");
    }

    try {
      const signedXdr = await freighterApi.signTransaction(xdr, {
        networkPassphrase: networkPassphraseConfig,
      });
      return signedXdr;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sign transaction";
      setError(message);
      throw new Error(message);
    }
  };

  return {
    address,
    isConnected: !!address,
    isConnecting,
    network,
    walletType,
    connect,
    disconnect,
    signTransaction: sign,
    error,
  };
}
