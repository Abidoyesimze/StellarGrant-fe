"use client";

import { useCallback, useState } from "react";
import { Star } from "lucide-react";
import { API_URL } from "@/lib/constants";
import { useWalletStore } from "@/lib/store/walletStore";

interface WatchButtonProps {
  grantId: string;
  initialWatched?: boolean;
}

export function WatchButton({ grantId, initialWatched = false }: WatchButtonProps) {
  const { address } = useWalletStore();
  const [watched, setWatched] = useState(initialWatched);
  const [loading, setLoading] = useState(false);

  const toggle = useCallback(async () => {
    if (!address || loading) return;
    setLoading(true);
    try {
      const method = watched ? "DELETE" : "POST";
      const res = await fetch(`${API_URL}/grants/${grantId}/watch`, {
        method,
        headers: { "Content-Type": "application/json", "X-Wallet-Address": address },
        body: JSON.stringify({
          address,
          signature: "dev",
          nonce: `watch-${Date.now()}`,
          timestamp: Math.floor(Date.now() / 1000),
        }),
      });
      if (res.ok) setWatched(!watched);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [address, grantId, watched, loading]);

  if (!address) return null;

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={loading}
      title={watched ? "Stop watching" : "Watch this grant"}
      className={[
        "inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider px-2 py-1 border transition-colors",
        watched
          ? "border-accent-primary text-accent-primary bg-accent-primary/10"
          : "border-border-color text-text-muted hover:text-accent-primary hover:border-accent-primary/50",
      ].join(" ")}
    >
      <Star size={14} className={watched ? "fill-accent-primary" : ""} />
      {watched ? "Watching" : "Watch"}
    </button>
  );
}
