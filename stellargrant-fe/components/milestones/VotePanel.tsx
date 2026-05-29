"use client";

import { useState } from "react";
import { WalletAddress } from "@/components/wallet/WalletAddress";
import { useVoting } from "@/hooks/useVoting";
import { useWalletStore } from "@/lib/store/walletStore";

interface VotePanelProps {
  grantId: string;
  milestoneIdx: number;
  votes: MilestoneVote[];
  quorum: number;
  reviewerCount: number;
}

interface MilestoneVote {
  reviewer: string;
  vote: "approve" | "reject" | null;
  voted_at: bigint | null;
}

function relativeTime(timestamp: bigint | null): string {
  if (!timestamp) return "";
  const now = BigInt(Math.floor(Date.now() / 1000));
  const diff = Number(now - timestamp);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
  return `${Math.floor(diff / 2592000)} months ago`;
}

export function VotePanel({
  grantId,
  milestoneIdx,
  votes,
  quorum,
  reviewerCount,
}: VotePanelProps) {
  const connectedAddress = useWalletStore((s) => s.address);
  const [confirming, setConfirming] = useState<"approve" | "reject" | null>(null);
  const { vote, isVoting, error } = useVoting(grantId, milestoneIdx);

  const approvalCount = votes.filter((v) => v.vote === "approve").length;
  const rejectionCount = votes.filter((v) => v.vote === "reject").length;
  const pendingCount = votes.filter((v) => v.vote === null).length;

  const progressWidth = quorum > 0 ? Math.min((approvalCount / quorum) * 100, 100) : 0;
  const quorumMet = approvalCount >= quorum;
  const isReviewer = connectedAddress
    ? votes.some((v) => v.reviewer === connectedAddress)
    : false;
  const currentVote = votes.find((v) => v.reviewer === connectedAddress);
  const hasVoted = currentVote?.vote !== null;

  const handleVote = async (approve: boolean) => {
    if (approve && quorumMet) return;
    await vote(approve);
    setConfirming(null);
  };

  return (
    <div className="bg-surface border border-border-color rounded-[4px] p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-orbitron text-sm font-bold uppercase tracking-wider text-text-primary">
          Reviewer Vote
        </h3>
        <span className="font-mono text-xs text-text-muted">
          {approvalCount} / {quorum} needed
        </span>
      </div>

      <div className="space-y-2">
        <div className="w-full bg-bg-secondary rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              quorumMet ? "bg-success" : "bg-warning"
            }`}
            style={{ width: `${progressWidth}%` }}
          />
        </div>
        <p className={`font-mono text-xs ${quorumMet ? "text-success" : "text-text-muted"}`}>
          {progressWidth.toFixed(0)}% &middot; {approvalCount} approved &middot;{" "}
          {rejectionCount} rejected &middot; {pendingCount} pending
        </p>
      </div>

      {quorumMet && (
        <div className="bg-success/10 border border-success/30 rounded-[4px] px-4 py-2">
          <p className="font-mono text-xs text-success">
            Quorum reached &mdash; milestone approved
          </p>
        </div>
      )}

      <div className="space-y-2">
        {votes.map((v) => (
          <div
            key={v.reviewer}
            className="flex items-center justify-between py-2 border-b border-border-color last:border-b-0"
          >
            <WalletAddress address={v.reviewer} truncate={4} />
            <div className="flex items-center gap-2">
              {v.vote === "approve" && (
                <span className="font-mono text-xs text-success">
                  &#10003; Approved
                </span>
              )}
              {v.vote === "reject" && (
                <span className="font-mono text-xs text-danger">
                  &#10007; Rejected
                </span>
              )}
              {v.vote === null && (
                <span className="font-mono text-xs text-text-muted">
                  &mdash; Pending
                </span>
              )}
              {v.voted_at && (
                <span className="font-mono text-[10px] text-text-muted">
                  {relativeTime(v.voted_at)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {hasVoted && (
        <div className="bg-bg-secondary rounded-[4px] px-4 py-2 inline-block">
          <span className="font-mono text-xs text-text-muted">
            You voted:{" "}
            {currentVote?.vote === "approve" ? (
              <span className="text-success">Approved &#10003;</span>
            ) : (
              <span className="text-danger">Rejected &#10007;</span>
            )}
          </span>
        </div>
      )}

      {isReviewer && !hasVoted && !confirming && (
        <div className="flex gap-3">
          <button
            onClick={() => setConfirming("approve")}
            disabled={isVoting}
            className="flex-1 px-4 py-2 bg-success text-bg-primary font-orbitron text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:opacity-90 disabled:opacity-50"
          >
            {isVoting ? (
              <span className="inline-block w-4 h-4 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              "Approve Milestone"
            )}
          </button>
          <button
            onClick={() => setConfirming("reject")}
            disabled={isVoting}
            className="flex-1 px-4 py-2 bg-danger text-bg-primary font-orbitron text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:opacity-90 disabled:opacity-50"
          >
            {isVoting ? (
              <span className="inline-block w-4 h-4 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              "Reject"
            )}
          </button>
        </div>
      )}

      {confirming && (
        <div className="bg-bg-secondary border border-border-color rounded-[4px] p-4 space-y-3">
          <p className="font-mono text-sm text-text-primary">
            Are you sure you want to{" "}
            <span
              className={`font-bold uppercase ${
                confirming === "approve" ? "text-success" : "text-danger"
              }`}
            >
              {confirming === "approve" ? "APPROVE" : "REJECT"}
            </span>{" "}
            this milestone?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => handleVote(confirming === "approve")}
              disabled={isVoting}
              className="px-4 py-2 bg-accent-primary text-bg-primary font-orbitron text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:opacity-90 disabled:opacity-50"
            >
              {isVoting ? (
                <span className="inline-block w-4 h-4 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                "Confirm"
              )}
            </button>
            <button
              onClick={() => setConfirming(null)}
              disabled={isVoting}
              className="px-4 py-2 border border-border-color text-text-primary font-orbitron text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:bg-surface disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="font-mono text-xs text-danger">{error}</p>
      )}
    </div>
  );
}
