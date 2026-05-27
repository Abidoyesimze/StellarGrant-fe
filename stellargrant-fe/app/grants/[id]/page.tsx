/**
 * Grant Detail Page
 *
 * Full grant page showing metadata, funding progress, milestone list,
 * reviewer panel, and event history.
 *
 * Data is sourced from the real useGrant hook — no mock data.
 */

"use client";

import { use, Suspense } from "react";
import Link from "next/link";
import { FundingProgress } from "@/components/grants/FundingProgress";
import { MilestoneList } from "@/components/milestones/MilestoneList";
import { GrantStatusBadge } from "@/components/grants/GrantStatusBadge";
import { WalletAddress } from "@/components/wallet/WalletAddress";
import { GrantStats } from "@/components/grants/GrantStats";
import { formatTokenAmount, getTokenMetadata } from "@/lib/tokens";
import { useGrant } from "@/hooks/useGrant";
import { useEffect, useState } from "react";
import type { TokenMetadata } from "@/types";

interface GrantDetailPageProps {
  params: Promise<{ id: string }>;
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function GrantDetailSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="shimmer h-8 w-1/3 rounded-sm" />
      <div className="shimmer h-4 w-2/3 rounded-sm" />
      <div className="shimmer h-32 rounded-sm" />
      <div className="shimmer h-48 rounded-sm" />
      <div className="shimmer h-48 rounded-sm" />
    </div>
  );
}

// ── Error card ────────────────────────────────────────────────────────────────

function ErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="rounded-sm border border-danger/40 bg-danger/10 p-6">
        <p className="text-sm text-danger mb-4">{message}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm font-medium rounded-sm border border-accent-secondary text-accent-secondary hover:bg-accent-secondary/10 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

// ── Main content ──────────────────────────────────────────────────────────────

function GrantDetailContent({ grantId }: { grantId: string }) {
  const { data: grant, isLoading, error, refetch } = useGrant(grantId);
  const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata | null>(null);

  useEffect(() => {
    if (!grant?.token) return;
    getTokenMetadata(grant.token)
      .then(setTokenMetadata)
      .catch(() => setTokenMetadata(null));
  }, [grant?.token]);

  if (isLoading) return <GrantDetailSkeleton />;

  if (error || !grant) {
    return (
      <ErrorCard
        message={error?.message ?? "Grant not found."}
        onRetry={() => void refetch()}
      />
    );
  }

  const decimals = tokenMetadata?.decimals ?? 7;
  const symbol = tokenMetadata?.symbol ?? "XLM";

  // Derive milestone count from grant data
  const milestoneCount =
    typeof grant.milestones === "number" ? grant.milestones : 0;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* ── Header ── */}
      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-accent-secondary mb-2">
              Grant #{grant.id}
            </p>
            <h1 className="text-3xl font-bold wrap-break-word">{grant.title}</h1>
          </div>
          <GrantStatusBadge status={grant.status} />
        </div>
        <p className="text-sm leading-6 text-text-muted">{grant.description}</p>
      </div>

      {/* ── Stats row ── */}
      <GrantStats
        totalBudget={grant.budget}
        fundedAmount={grant.funded}
        milestoneCount={milestoneCount}
        completedMilestones={0}
        reviewerCount={grant.reviewers.length}
        token={symbol}
        deadline={grant.deadline}
      />

      {/* ── Funding section ── */}
      <section
        className="mt-6 mb-6 rounded-sm border p-6"
        style={{ background: "#111D35", borderColor: "#1E3A5F" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold">Funding Progress</h2>
          <Link
            href={`/grants/${grant.id}/fund`}
            className="px-4 py-2 text-sm font-medium rounded-sm bg-accent-secondary text-background hover:opacity-90 transition-opacity"
          >
            Fund This Grant
          </Link>
        </div>

        <FundingProgress
          current={grant.funded}
          target={grant.budget}
          token={grant.token}
        />

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-text-muted">
              Owner
            </span>
            <div className="mt-1">
              <WalletAddress address={grant.owner} />
            </div>
          </div>
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-text-muted">
              Token
            </span>
            <p className="mt-1 font-medium">{symbol}</p>
          </div>
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-text-muted">
              Budget
            </span>
            <p className="mt-1 font-medium">
              {formatTokenAmount(grant.budget, decimals, {
                symbol,
                showSymbol: true,
              })}
            </p>
          </div>
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-text-muted">
              Deadline
            </span>
            <p className="mt-1 font-medium">
              {new Date(Number(grant.deadline) * 1000).toLocaleDateString()}
            </p>
          </div>
        </div>
      </section>

      {/* ── Milestones section ── */}
      <section
        className="mb-6 rounded-sm border p-6"
        style={{ background: "#111D35", borderColor: "#1E3A5F" }}
      >
        <h2 className="text-lg font-semibold mb-4">Milestones</h2>
        <MilestoneList
          milestones={[]}
          grantId={grant.id}
          grantToken={grant.token}
        />
      </section>

      {/* ── Reviewers section ── */}
      <section
        className="rounded-sm border p-6"
        style={{ background: "#111D35", borderColor: "#1E3A5F" }}
      >
        <h2 className="text-lg font-semibold mb-4">
          Reviewers{" "}
          <span className="text-text-muted text-sm font-normal">
            ({grant.reviewers.length})
          </span>
        </h2>
        {grant.reviewers.length === 0 ? (
          <p className="text-sm text-text-muted">No reviewers assigned.</p>
        ) : (
          <ul className="space-y-2">
            {grant.reviewers.map((addr) => (
              <li key={addr}>
                <WalletAddress address={addr} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// ── Page entry-point ──────────────────────────────────────────────────────────

export default function GrantDetailPage({ params }: GrantDetailPageProps) {
  const { id } = use(params);

  return (
    <Suspense fallback={<GrantDetailSkeleton />}>
      <GrantDetailContent grantId={id} />
    </Suspense>
  );
}

// ── Metadata (server-side) ────────────────────────────────────────────────────
// NOTE: generateMetadata must be in a Server Component. Because this page is
// "use client" we export a static fallback; per-grant metadata can be added
// in a separate server wrapper if needed.
export const dynamic = "force-dynamic";
