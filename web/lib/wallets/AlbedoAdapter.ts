/**
 * AlbedoAdapter for use within the Next.js frontend.
 *
 * Albedo injects `window.albedo` when loaded. Signing happens via a popup
 * window — ensure popups are not blocked for your site.
 */

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

type AlbedoNetwork = "testnet" | "public";

/** Minimal shape of the window.albedo global injected by Albedo. */
interface AlbedoGlobal {
  publicKey(params: Record<string, never>): Promise<{ pubkey?: string }>;
  tx(params: { xdr: string; network: AlbedoNetwork }): Promise<{ signed_envelope_xdr?: string }>;
}

export class AlbedoAdapter implements WalletAdapter {
  readonly name = "Albedo";
  readonly icon = "https://albedo.link/img/albedo-logo.svg";

  private publicKeyCache: string | null = null;
  private readonly network: AlbedoNetwork;

  constructor(networkPassphrase?: string) {
    this.network = this.resolveNetwork(networkPassphrase ?? "");
  }

  isAvailable(): boolean {
    return (
      typeof window !== "undefined" &&
      Boolean((window as Window & { albedo?: unknown }).albedo)
    );
  }

  async getPublicKey(): Promise<string> {
    if (this.publicKeyCache) return this.publicKeyCache;

    const albedo = (window as Window & { albedo?: AlbedoGlobal }).albedo;
    if (!albedo) throw new Error("Albedo is not installed or available");

    const response = await this.withPopupGuard<{ pubkey?: string }>(() =>
      albedo.publicKey({}),
    );
    if (!response?.pubkey) {
      throw new Error("Albedo did not return a public key.");
    }

    this.publicKeyCache = response.pubkey;
    return response.pubkey;
  }

  async signTransaction(txXdr: string, networkPassphrase: string): Promise<string> {
    const albedo = (window as Window & { albedo?: AlbedoGlobal }).albedo;
    if (!albedo) throw new Error("Albedo is not installed or available");

    const network = this.resolveNetwork(networkPassphrase || this.network);
    const response = await this.withPopupGuard<{ signed_envelope_xdr?: string }>(() =>
      albedo.tx({ xdr: txXdr, network }),
    );

    if (!response?.signed_envelope_xdr) {
      throw new Error("Albedo did not return a signed transaction envelope.");
    }

    verifySignedTransactionMatchesOriginal(
      txXdr,
      response.signed_envelope_xdr,
      networkPassphrase,
    );

    return response.signed_envelope_xdr;
  }

  private resolveNetwork(networkPassphrase: string): AlbedoNetwork {
    return networkPassphrase.includes("Public") ? "public" : "testnet";
  }

  private async withPopupGuard<T>(cb: () => Promise<T>): Promise<T> {
    try {
      return await cb();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/popup|blocked|denied|closed|cancel/i.test(message)) {
        throw new Error(
          "Albedo popup was blocked or closed. Enable popups for this site and try again.",
        );
      }
      throw error;
    }
  }
}
