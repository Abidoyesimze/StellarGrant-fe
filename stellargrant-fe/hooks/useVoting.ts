"use client";

import { useState } from "react";
import { contractClient } from "@/lib/stellar/contract";
import { useWalletStore } from "@/lib/store/walletStore";

interface UseVotingResult {
  vote: (approve: boolean) => Promise<void>;
  isVoting: boolean;
  error: string | null;
}

export function useVoting(grantId: string, milestoneIdx: number): UseVotingResult {
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const address = useWalletStore((s) => s.address);

  const vote = async (approve: boolean) => {
    if (!address) {
      setError("Wallet not connected");
      return;
    }

    setIsVoting(true);
    setError(null);

    try {
      await contractClient.milestoneApprove({
        grant_id: grantId,
        milestone_idx: milestoneIdx,
        reviewer: address,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Vote failed");
    } finally {
      setIsVoting(false);
    }
  };

  return { vote, isVoting, error };
}
