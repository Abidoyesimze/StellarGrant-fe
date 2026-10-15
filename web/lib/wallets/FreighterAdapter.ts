/**
 * Re-export FreighterAdapter for use within the Next.js frontend.
 *
 * The adapter uses @stellar/freighter-api (already a dependency of this package)
 * and satisfies the WalletAdapter interface defined in @/lib/wallets/types.
 */

import {
  isAllowed,
  setAllowed,
  getAddress,
  getNetworkDetails,
  signTransaction as freighterSignTransaction,
} from "@stellar/freighter-api";
import { FeeBumpTransaction, TransactionBuilder, xdr } from "@stellar/stellar-sdk";
import type { WalletAdapter } from "./types";

export function verifySignedTransactionMatchesOriginal(
  originalTxXdr: string,
  signedTxXdr: string,
  networkPassphrase: string,
): void {
  const parseTx = (name: string, txXdr: string) => {
    try {
      const envelope = xdr.TransactionEnvelope.fromXDR(txXdr, "base64");
      const tx = TransactionBuilder.fromXDR(envelope, networkPassphrase);
      if (tx instanceof FeeBumpTransaction) {
        throw new Error("FeeBumpTransaction is not supported for wallet signing validation");
      }
      return tx;
    } catch (error) {
      throw new Error(`Invalid ${name} transaction XDR: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const original = parseTx("original", originalTxXdr);
  const signed = parseTx("signed", signedTxXdr);

  if (!original.hash().equals(signed.hash())) {
    throw new Error("Signed transaction does not match the original transaction hash.");
  }

  if (original.source !== signed.source) {
    throw new Error("Signed transaction source account does not match the original transaction.");
  }

  if (original.sequence !== signed.sequence) {
    throw new Error("Signed transaction sequence number does not match the original transaction.");
  }
}

export class FreighterAdapter implements WalletAdapter {
  readonly name = "Freighter";
  readonly icon = "https://freighter.app/favicon.ico";

  isAvailable(): boolean {
    return (
      typeof window !== "undefined" &&
      Boolean((window as Window & { freighter?: unknown }).freighter)
    );
  }

  async getPublicKey(): Promise<string> {
    const access = await isAllowed();
    if (!access.isAllowed) {
      const permission = await setAllowed();
      if (!permission.isAllowed) {
        throw new Error("Freighter permission denied");
      }
    }

    const result = await getAddress();
    if (result.error) {
      throw new Error(result.error);
    }
    if (!result.address) {
      throw new Error("No public key returned by Freighter");
    }
    return result.address;
  }

  async signTransaction(txXdr: string, networkPassphrase: string): Promise<string> {
    const networkResult = await getNetworkDetails();
    if (networkResult.networkPassphrase !== networkPassphrase) {
      throw new Error(
        `Freighter is on wrong network. Expected: ${networkPassphrase}`,
      );
    }

    const result = await freighterSignTransaction(txXdr, { networkPassphrase });
    if (result.error) {
      throw new Error(result.error);
    }
    if (!result.signedTxXdr) {
      throw new Error("Failed to sign transaction with Freighter");
    }

    verifySignedTransactionMatchesOriginal(
      txXdr,
      result.signedTxXdr,
      networkPassphrase,
    );

    return result.signedTxXdr;
  }
}
