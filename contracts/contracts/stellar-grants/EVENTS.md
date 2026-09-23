# Stellar Grants Event Schema

This contract emits Soroban events for off-chain indexers and subgraphs. Most
business events are **typed** `#[contractevent]` structs; a small number are raw
(untyped) symbol-topic events.
This contract emits typed Soroban `#[contractevent]` events (plus a small set of
legacy `env.events().publish(...)` events). This document is generated from the
actual event structs and publish call sites in `src/` so an indexer can follow
on-chain activity without guessing names.

## Event structure

Typed `#[contractevent]` events in this crate do **not** use `#[topic]` field
attributes. The event identifier is the **struct name**. All listed fields are
in the event body (payload). There is no `event_version` field on these structs.

Legacy `env.events().publish(topics, data)` events are documented separately at
the end; their topic tuples are the first argument to `publish`.

The following names from an earlier draft of this file **are not emitted** and
must not be indexed:

**Typed `#[contractevent]` events**

- Every field of the struct is published as a topic, in declaration order,
  prefixed by `contract_id`.
- For grant/milestone-scoped events the leading business key (`grant_id`,
  `campaign_id`, `proposal_id`, …) is the first field.
- Events are identified by their **struct name (PascalCase)**, e.g. `GrantFunded`
  — not by a snake_case alias.

**Untyped events**

- Published with `(Symbol, …)` topic tuples and a single-payload data value. Their
  topic names are snake_case and they are listed in the "Untyped events" section
  below.

## Indexing Guidance

- Filter by the PascalCase struct name of the typed event (plus `grant_id` /
  business key in the topics) when querying Soroban RPC.
- Parse payload fields from the struct definitions below.
- `ContractWasmUpgraded`, `ContractUpgraded`, `ContractInitialized`,
  `GrantMetadataUpdated`, and `QuorumReached` are **not** emitted by this
  contract and must not be indexed — see `UPGRADE_GUIDE.md` for the real contract
  lifecycle (`ContractMigrated`) and the actual admin entrypoints.

## Typed Events (per module)

### Core grant & milestone lifecycle (`events.rs`)

- **GrantCreated** — a grant was created (`grant_create`).
  - Topics: `contract_id`, `GrantCreated`, `grant_id`
  - Fields: `grant_id`, `owner`, `title`, `total_amount`, `timestamp`
- **GrantFunded** — a funder funded a grant (`grant_fund`).
  - Topics: `contract_id`, `GrantFunded`, `grant_id`
  - Fields: `grant_id`, `funder`, `amount`, `new_balance`, `timestamp`
- **GrantCancelled** — a grant was cancelled and refunded (`grant_cancel`).
  - Topics: `contract_id`, `GrantCancelled`, `grant_id`
  - Fields: `grant_id`, `owner`, `reason`, `refund_amount`, `timestamp`
- **GrantCompleted** — a grant completed (`grant_complete`).
  - Topics: `contract_id`, `GrantCompleted`, `grant_id`
  - Fields: `grant_id`, `total_paid`, `remaining_balance`, `timestamp`
- **MilestoneSubmitted** — a milestone was submitted (`milestone_submit`).
  - Topics: `contract_id`, `MilestoneSubmitted`, `grant_id`
  - Fields: `grant_id`, `milestone_idx`, `description`, `timestamp`
- **MilestoneVoted** — a reviewer voted on a milestone (`milestone_vote`).
  - Topics: `contract_id`, `MilestoneVoted`, `grant_id`
  - Fields: `grant_id`, `milestone_idx`, `reviewer`, `approve`, `feedback`, `timestamp`
- **MilestoneRejected** — a milestone was rejected with a reason (`milestone_reject`).
  - Topics: `contract_id`, `MilestoneRejected`, `grant_id`
  - Fields: `grant_id`, `milestone_idx`, `reviewer`, `reason`, `timestamp`
- **MilestoneStatusChanged** — a milestone changed state.
  - Topics: `contract_id`, `MilestoneStatusChanged`, `grant_id`
  - Fields: `grant_id`, `milestone_idx`, `new_state`, `timestamp`
- **MilestonePaid** — milestone payout marker (defined for milestone payouts; check current emission call sites).
  - Topics: `contract_id`, `MilestonePaid`, `grant_id`
  - Fields: `grant_id`, `milestone_idx`, `amount`, `timestamp`
- **RefundExecuted** — a refund transfer was executed.
  - Topics: `contract_id`, `RefundExecuted`, `grant_id`
  - Fields: `grant_id`, `funder`, `amount`
- **RefundIssued** — a refund was issued to a funder.
  - Topics: `contract_id`, `RefundIssued`, `grant_id`
  - Fields: `grant_id`, `funder`, `amount`
- **FinalRefund** — final refund issued at grant close-out.
  - Topics: `contract_id`, `FinalRefund`, `grant_id`
  - Fields: `grant_id`, `funder`, `amount`
- **ContributorRegistered** — a contributor registered a profile (`contributor_register`).
  - Topics: `contract_id`, `ContributorRegistered`
  - Fields: `contributor`, `name`, `timestamp`

### Contract lifecycle & admin (`events.rs`, `migration.rs`)

- **ContractMigrated** — `run_migration` bumped the schema version and ran migration steps.
  - Topics: `contract_id`, `ContractMigrated`
  - Fields: `from_version`, `to_version`, `run_by`, `timestamp`
- **ReviewerApproved** — a reviewer was added to the allowlist (`approve_reviewer`).
  - Topics: `contract_id`, `ReviewerApproved`
  - Fields: `reviewer`, `approved_by`, `timestamp`
- **ReviewerRevoked** — a reviewer was removed from the allowlist (`revoke_reviewer`).
  - Topics: `contract_id`, `ReviewerRevoked`
  - Fields: `reviewer`, `revoked_by`, `timestamp`
- **ContractPaused** — the contract was paused (`pause`).
  - Topics: `contract_id`, `ContractPaused`
  - Fields: `admin`, `reason`, `timestamp`
- **ContractUnpaused** — the contract was unpaused (`unpause`).
  - Topics: `contract_id`, `ContractUnpaused`
  - Fields: `admin`, `timestamp`

### Disputes & arbitration (`events.rs`, `arbitration_pool.rs`)

- **DisputeRaised** — a dispute was raised on a milestone (`dispute_raise`).
  - Topics: `contract_id`, `DisputeRaised`, `grant_id`
  - Fields: `grant_id`, `milestone_idx`, `raised_by`, `timestamp`
- **ArbiterAssigned** — an arbiter was assigned to a dispute.
  - Topics: `contract_id`, `ArbiterAssigned`, `grant_id`
  - Fields: `grant_id`, `milestone_idx`, `arbiter`, `timestamp`
- **ArbiterVoted** — an arbiter voted on a dispute.
  - Topics: `contract_id`, `ArbiterVoted`, `grant_id`
  - Fields: `grant_id`, `milestone_idx`, `arbiter`, `favor_contributor`, `timestamp`
- **DisputeResolved** — a dispute was resolved.
  - Topics: `contract_id`, `DisputeResolved`, `grant_id`
  - Fields: `grant_id`, `milestone_idx`, `resolved_for_contributor`, `timestamp`
- **DisputeCancelled** — a dispute was cancelled.
  - Topics: `contract_id`, `DisputeCancelled`, `grant_id`
  - Fields: `grant_id`, `milestone_idx`, `cancelled_by`, `timestamp`
- **ArbiterJoined** — an arbiter joined the arbitration pool.
  - Topics: `contract_id`, `ArbiterJoined`
  - Fields: `arbiter`, `stake`
- **ArbiterLeft** — an arbiter left the arbitration pool.
  - Topics: `contract_id`, `ArbiterLeft`
  - Fields: `arbiter`, `returned`
- **PanelAssigned** — a panel was assigned to an arbitration case.
  - Topics: `contract_id`, `PanelAssigned`
  - Fields: `case_id`, `dispute_id`, `panel_size`
- **ArbiterVoteCast** — an arbiter cast a vote on a case.
  - Topics: `contract_id`, `ArbiterVoteCast`
  - Fields: `case_id`, `arbiter`, `favor_contributor`
- **CaseFinalized** — an arbitration case was finalized.
  - Topics: `contract_id`, `CaseFinalized`
  - Fields: `case_id`, `outcome`
- **RewardsSettled** — arbiter rewards were settled for a case.
  - Topics: `contract_id`, `RewardsSettled`
  - Fields: `case_id`, `total_slashed`

### Clawback (`events.rs`)

- **ClawbackInitiated** — a milestone clawback was initiated.
  - Topics: `contract_id`, `ClawbackInitiated`, `grant_id`
  - Fields: `grant_id`, `milestone_idx`, `target`, `amount`, `token`, `initiated_by`, `dispute_window_ends`, `timestamp`
- **ClawbackApproved** — a clawback was approved.
  - Topics: `contract_id`, `ClawbackApproved`, `grant_id`
  - Fields: `grant_id`, `milestone_idx`, `approver`, `timestamp`
- **ClawbackDisputed** — a clawback was disputed.
  - Topics: `contract_id`, `ClawbackDisputed`, `grant_id`
  - Fields: `grant_id`, `milestone_idx`, `disputed_by`, `timestamp`
- **ClawbackExecuted** — a clawback transfer executed.
  - Topics: `contract_id`, `ClawbackExecuted`, `grant_id`
  - Fields: `grant_id`, `milestone_idx`, `amount_recovered`, `token`, `treasury`, `timestamp`
- **ClawbackCancelled** — a clawback was cancelled.
  - Topics: `contract_id`, `ClawbackCancelled`, `grant_id`
  - Fields: `grant_id`, `milestone_idx`, `cancelled_by`, `timestamp`

### Reputation, fees & treasury (`events.rs`)

- **ReputationUpdated** — contributor reputation changed after milestone approval.
  - Topics: `contract_id`, `ReputationUpdated`, `grant_id`
  - Fields: `grant_id`, `milestone_idx`, `contributor`, `new_reputation_score`, `total_earned`, `timestamp`
- **FeeCollected** — protocol fee collected.
  - Topics: `contract_id`, `FeeCollected`, `grant_id`
  - Fields: `grant_id`, `milestone_idx`, `fee_amount`, `token`, `treasury`, `timestamp`
- **TreasuryDeposited** — funds were deposited into the treasury.
  - Topics: `contract_id`, `TreasuryDeposited`
  - Fields: `token`, `from`, `amount`, `new_balance`, `timestamp`
- **TreasuryWithdrawn** — funds were withdrawn from the treasury.
  - Topics: `contract_id`, `TreasuryWithdrawn`
  - Fields: `token`, `to`, `amount`, `new_balance`, `admin`, `timestamp`
- **TreasuryReallocated** — funds were reallocated between treasury tokens.
  - Topics: `contract_id`, `TreasuryReallocated`
  - Fields: `from_token`, `to_token`, `amount`, `admin`, `timestamp`

### DAO governance (`events.rs`)

- **DaoProposalCreated** — a DAO proposal was created.
  - Topics: `contract_id`, `DaoProposalCreated`
  - Fields: `proposal_id`, `proposer`, `title`, `voting_deadline`, `timestamp`
- **DaoVoteCast** — a vote was cast on a DAO proposal.
  - Topics: `contract_id`, `DaoVoteCast`
  - Fields: `proposal_id`, `voter`, `support`, `weight`, `timestamp`
- **DaoProposalFinalized** — a DAO proposal reached a final tally.
  - Topics: `contract_id`, `DaoProposalFinalized`
  - Fields: `proposal_id`, `passed`, `votes_for`, `votes_against`, `timestamp`
- **DaoProposalExecuted** — a passed DAO proposal was executed.
  - Topics: `contract_id`, `DaoProposalExecuted`
  - Fields: `proposal_id`, `executed_by`, `timestamp`
- **DaoProposalCancelled** — a DAO proposal was cancelled.
  - Topics: `contract_id`, `DaoProposalCancelled`
  - Fields: `proposal_id`, `cancelled_by`, `timestamp`

### Bounties (`events.rs`)

- **BountyCreated** — a bounty was created.
  - Topics: `contract_id`, `BountyCreated`
  - Fields: `bounty_id`, `owner`, `title`, `prize_amount`, `submission_deadline`, `timestamp`
- **BountySubmissionReceived** — a submission was received for a bounty.
  - Topics: `contract_id`, `BountySubmissionReceived`
  - Fields: `bounty_id`, `submitter`, `timestamp`
- **BountyAwarded** — a bounty was awarded to a winner.
  - Topics: `contract_id`, `BountyAwarded`
  - Fields: `bounty_id`, `winner`, `prize_amount`, `timestamp`
- **BountyCancelled** — a bounty was cancelled and prize refunded.
  - Topics: `contract_id`, `BountyCancelled`
  - Fields: `bounty_id`, `cancelled_by`, `refund_amount`, `timestamp`

### RBAC roles (`events.rs`)

- **RoleGranted** — a role was granted to a holder.
  - Topics: `contract_id`, `RoleGranted`
  - Fields: `holder`, `role`, `granted_by`, `timestamp`
- **RoleRevoked** — a role was revoked from a holder.
  - Topics: `contract_id`, `RoleRevoked`
  - Fields: `holder`, `role`, `revoked_by`, `timestamp`
- **RoleRenounced** — a holder renounced a role.
  - Topics: `contract_id`, `RoleRenounced`
  - Fields: `holder`, `role`, `timestamp`

### Invoices (`events.rs`)

- **InvoiceSubmitted** — an invoice was submitted for a milestone.
  - Topics: `contract_id`, `InvoiceSubmitted`
  - Fields: `grant_id`, `milestone_idx`, `invoice_number`, `total`, `timestamp`
- **InvoiceApproved** — an invoice was approved.
  - Topics: `contract_id`, `InvoiceApproved`
  - Fields: `grant_id`, `milestone_idx`, `approved_by`, `timestamp`
- **InvoiceRejected** — an invoice was rejected.
  - Topics: `contract_id`, `InvoiceRejected`
  - Fields: `grant_id`, `milestone_idx`, `rejected_by`, `reason`, `timestamp`
- **InvoiceResubmitted** — an invoice was resubmitted.
  - Topics: `contract_id`, `InvoiceResubmitted`
  - Fields: `grant_id`, `milestone_idx`, `total`, `timestamp`

### Multisig (`events.rs`)

- **MultisigProposalCreated** — a high-security escrow release proposal was created.
  - Topics: `contract_id`, `MultisigProposalCreated`
  - Fields: `proposal_id`, `grant_id`, `created_by`, `threshold`, `timestamp`
- **MultisigSigned** — a signer approved/rejected a multisig proposal.
  - Topics: `contract_id`, `MultisigSigned`
  - Fields: `proposal_id`, `signer`, `approved`, `total_weight_signed`, `timestamp`
- **MultisigExecuted** — a multisig proposal reached threshold and executed.
  - Topics: `contract_id`, `MultisigExecuted`
  - Fields: `proposal_id`, `grant_id`, `executed_by`, `timestamp`

### Compliance (`events.rs`)

- **ComplianceAttested** — a subject passed compliance attestation.
  - Topics: `contract_id`, `ComplianceAttested`
  - Fields: `subject`, `attested_by`, `level`, `expires_at`, `timestamp`
- **ComplianceRevoked** — a subject's compliance attestation was revoked.
  - Topics: `contract_id`, `ComplianceRevoked`
  - Fields: `subject`, `revoked_by`, `timestamp`

### Crowdfund (`events.rs`)

- **CrowdfundCreated** — a crowdfund campaign was created.
  - Topics: `contract_id`, `CrowdfundCreated`
  - Fields: `campaign_id`, `owner`, `title`, `target_amount`, `deadline`, `timestamp`
- **CrowdfundPledged** — a backer pledged to a campaign.
  - Topics: `contract_id`, `CrowdfundPledged`
  - Fields: `campaign_id`, `backer`, `amount`, `total_pledged`, `timestamp`
- **CrowdfundSucceeded** — a campaign hit its target.
  - Topics: `contract_id`, `CrowdfundSucceeded`
  - Fields: `campaign_id`, `total_pledged`, `timestamp`
- **CrowdfundFailed** — a campaign failed to hit its target.
  - Topics: `contract_id`, `CrowdfundFailed`
  - Fields: `campaign_id`, `total_pledged`, `timestamp`
- **CrowdfundRefunded** — a failed campaign refunded a backer.
  - Topics: `contract_id`, `CrowdfundRefunded`
  - Fields: `campaign_id`, `backer`, `amount`, `timestamp`
- **CrowdfundCancelled** — a campaign was cancelled.
  - Topics: `contract_id`, `CrowdfundCancelled`
  - Fields: `campaign_id`, `cancelled_by`, `total_pledged`, `timestamp`

### Public reviews (`events.rs`)

- **PublicReviewSubmitted** — a public review was submitted (`open_review_submit`).
  - Topics: `contract_id`, `PublicReviewSubmitted`
  - Fields: `grant_id`, `milestone_idx`, `reviewer`, `timestamp`
- **ReviewMarkedHelpful** — a review was marked helpful.
  - Topics: `contract_id`, `ReviewMarkedHelpful`
  - Fields: `grant_id`, `milestone_idx`, `reviewer`, `voter`, `timestamp`

### Milestone NFTs (`events.rs`, `milestone_nft.rs`)

- **NftMinted** — a milestone completion NFT was minted.
  - Topics: `contract_id`, `NftMinted`
  - Fields: `token_id`, `grant_id`, `milestone_idx`, `owner`, `timestamp`
- **NftTransferred** — an NFT was transferred.
  - Topics: `contract_id`, `NftTransferred`
  - Fields: `token_id`, `from`, `to`, `timestamp`

### Collateral (`events.rs`)

- **CollateralDeposited** — collateral was deposited.
  - Topics: `contract_id`, `CollateralDeposited`
  - Fields: `grant_id`, `contributor`, `amount`, `timestamp`
- **CollateralReleased** — collateral was released.
  - Topics: `contract_id`, `CollateralReleased`
  - Fields: `grant_id`, `contributor`, `amount`, `timestamp`
- **CollateralForfeited** — collateral was forfeited.
  - Topics: `contract_id`, `CollateralForfeited`
  - Fields: `grant_id`, `contributor`, `amount`, `reason`, `timestamp`

### Whitelist (`events.rs`)

- **WhitelistAddressAdded** — an address was whitelisted.
  - Topics: `contract_id`, `WhitelistAddressAdded`
  - Fields: `address`, `scope`, `timestamp`
- **WhitelistAddressRemoved** — an address was removed from the whitelist.
  - Topics: `contract_id`, `WhitelistAddressRemoved`
  - Fields: `address`, `scope`, `timestamp`

### Forks & waitlist (`events.rs`)

- **GrantForked** — a grant was forked (`fork_grant`).
  - Topics: `contract_id`, `GrantForked`
  - Fields: `original_grant_id`, `forked_grant_id`, `timestamp`
- **WaitlistJoined** — an applicant joined a grant waitlist.
  - Topics: `contract_id`, `WaitlistJoined`
  - Fields: `grant_id`, `applicant`, `position`, `timestamp`
- **WaitlistPromoted** — a waitlist member was promoted.
  - Topics: `contract_id`, `WaitlistPromoted`
  - Fields: `grant_id`, `applicant`, `position`, `timestamp`
- **WaitlistLeft** — a member left the waitlist voluntarily.
  - Topics: `contract_id`, `WaitlistLeft`
  - Fields: `grant_id`, `applicant`, `timestamp`

### Badges & checklists (`badge.rs`, `checklist.rs`)

- **BadgeAwarded** — a contributor earned a badge.
  - Topics: `contract_id`, `BadgeAwarded`
  - Fields: `contributor`, `badge_type`, `grant_id`, `awarded_at`
- **ChecklistSubmitted** — a milestone acceptance-criteria checklist was submitted.
  - Topics: `contract_id`, `ChecklistSubmitted`
  - Fields: `grant_id`, `milestone_idx`, `submitted_at`
- **CriterionReviewed** — a checklist criterion was reviewed.
  - Topics: `contract_id`, `CriterionReviewed`
  - Fields: `grant_id`, `milestone_idx`, `criterion_idx`, `approved`

### Circuit breakers (`circuit_breaker.rs`)

- **BreakerTripped** — a protocol circuit breaker tripped.
  - Topics: `contract_id`, `BreakerTripped`
  - Fields: `module`, `tripped_by`, `reason`
- **BreakerReset** — a circuit breaker was reset.
  - Topics: `contract_id`, `BreakerReset`
  - Fields: `module`, `reset_by`
- **BreakerAutoReset** — a circuit breaker auto-reset.
  - Topics: `contract_id`, `BreakerAutoReset`
  - Fields: `module`

### Contributor verification (`contributor_verification.rs`)

- **ContributorVerified** — a contributor reached a verification level.
  - Topics: `contract_id`, `ContributorVerified`
  - Fields: `subject`, `verifier`, `level`, `expires_at`
- **VerificationRevoked** — a contributor's verification was revoked.
  - Topics: `contract_id`, `VerificationRevoked`
  - Fields: `subject`, `revoked_by`

### Delegation (`delegate.rs`)

- **DelegationCreated** — a contributor delegated voting power.
  - Topics: `contract_id`, `DelegationCreated`
  - Fields: `delegator`, `delegate`, `created_at`
- **DelegationRevoked** — a delegation was revoked.
  - Topics: `contract_id`, `DelegationRevoked`
  - Fields: `delegator`, `revoked_at`

### Hooks (`hooks.rs`)

- **HookTriggered** — a registered hook fired for an event.
  - Topics: `contract_id`, `HookTriggered`
  - Fields: `event`, `hook_index`, `success`
- **HookRegisteredEvent** — a hook was registered for an event.
  - Topics: `contract_id`, `HookRegisteredEvent`
  - Fields: `event`, `hook_index`, `target_contract`

### Insurance (`insurance.rs`)

- **PolicyPurchased** — an insurance policy was purchased.
  - Topics: `contract_id`, `PolicyPurchased`, `grant_id`
  - Fields: `grant_id`, `policyholder`, `coverage_amount`, `premium_paid`
- **ClaimFiled** — an insurance claim was filed.
  - Topics: `contract_id`, `ClaimFiled`
  - Fields: `claim_id`, `grant_id`, `claimant`, `claimed_amount`
- **ClaimApproved** — an insurance claim was approved and paid.
  - Topics: `contract_id`, `ClaimApproved`
  - Fields: `claim_id`, `payout_amount`
- **ClaimRejected** — an insurance claim was rejected.
  - Topics: `contract_id`, `ClaimRejected`
  - Fields: `claim_id`

### Milestone extensions (`milestone_extension.rs`)

- **ExtensionRequested** — a milestone deadline extension was requested.
  - Topics: `contract_id`, `ExtensionRequested`
  - Fields: `grant_id`, `milestone_idx`, `requested_by`, `new_deadline`
- **ExtensionApproved** — a milestone extension was approved.
  - Topics: `contract_id`, `ExtensionApproved`
  - Fields: `grant_id`, `milestone_idx`, `new_deadline`
- **ExtensionDenied** — a milestone extension was denied.
  - Topics: `contract_id`, `ExtensionDenied`
  - Fields: `grant_id`, `milestone_idx`
- **ExtensionWithdrawn** — a milestone extension request was withdrawn.
  - Topics: `contract_id`, `ExtensionWithdrawn`
  - Fields: `grant_id`, `milestone_idx`

### Performance bonds (`performance_bond.rs`)

- **BondRequired** — a performance bond was required.
  - Topics: `contract_id`, `BondRequired`
  - Fields: `bond_id`, `grant_id`, `bond_amount`
- **BondPosted** — a performance bond was posted by a guarantor.
  - Topics: `contract_id`, `BondPosted`
  - Fields: `bond_id`, `grant_id`, `guarantor`
- **BondReleased** — a performance bond was released.
  - Topics: `contract_id`, `BondReleased`
  - Fields: `bond_id`, `grant_id`
- **BondClaimed** — a performance bond was claimed (forfeited).
  - Topics: `contract_id`, `BondClaimed`
  - Fields: `bond_id`, `grant_id`, `payout_amount`

### Referral (`referral.rs`)

- **ReferralCodeCreated** — a referral code was created.
  - Topics: `contract_id`, `ReferralCodeCreated`
  - Fields: `referrer`, `code_hash`
- **ReferralApplied** — a referral code was applied.
  - Topics: `contract_id`, `ReferralApplied`
  - Fields: `referred`, `referrer`, `code_hash`
- **ReferralRewardEarned** — a referral reward was accrued.
  - Topics: `contract_id`, `ReferralRewardEarned`
  - Fields: `referrer`, `referred`, `token`, `amount`
- **ReferralRewardsClaimed** — accrued referral rewards were claimed.
  - Topics: `contract_id`, `ReferralRewardsClaimed`
  - Fields: `referrer`, `token`, `amount`
- **ReferralCodeDeactivated** — a referral code was deactivated.
  - Topics: `contract_id`, `ReferralCodeDeactivated`
  - Fields: `referrer`, `code_hash`

### Revenue share (`revenue_share.rs`)

- **EpochFinalized** — a revenue-share epoch was finalized.
  - Topics: `contract_id`, `EpochFinalized`
  - Fields: `epoch_id`, `total_revenue`, `total_stake_weight`
- **RevenueClaimed** — a staker claimed revenue-share rewards.
  - Topics: `contract_id`, `RevenueClaimed`
  - Fields: `staker`, `epoch_id`, `amount`

### Streaming payments (`streaming.rs`)

- **StreamCreated** — a payment stream was created.
  - Topics: `contract_id`, `StreamCreated`
  - Fields: `stream_id`, `grant_id`, `sender`, `recipient`, `rate_per_ledger`, `deposited`, `end_ledger`
- **StreamWithdrawn** — funds were withdrawn from a stream.
  - Topics: `contract_id`, `StreamWithdrawn`
  - Fields: `stream_id`, `recipient`, `amount`
- **StreamCancelled** — a stream was cancelled.
  - Topics: `contract_id`, `StreamCancelled`
  - Fields: `stream_id`, `sender_refund`, `recipient_payout`
- **StreamPaused** — a stream was paused.
  - Topics: `contract_id`, `StreamPaused`
  - Fields: `stream_id`, `paused_at_ledger`
- **StreamResumed** — a stream was resumed.
  - Topics: `contract_id`, `StreamResumed`
  - Fields: `stream_id`, `new_end_ledger`

### Token swaps (`token_swap.rs`)

- **SwapExecuted** — a token swap executed.
  - Topics: `contract_id`, `SwapExecuted`
  - Fields: `from_token`, `to_token`, `amount_in`, `amount_out`, `slippage_bps`
- **SwapAndFundExecuted** — a swap-and-fund flow funded a grant.
  - Topics: `contract_id`, `SwapAndFundExecuted`
  - Fields: `grant_id`, `funder`, `input_token`, `input_amount`, `swapped_amount`
- **SwapAndPayExecuted** — a swap-and-pay flow paid a recipient.
  - Topics: `contract_id`, `SwapAndPayExecuted`
  - Fields: `grant_id`, `recipient`, `grant_token`, `preferred_token`, `amount_out`

## Untyped events

These are raw `env.events().publish` events with snake_case symbol topics. They
are not `#[contractevent]` structs, so index them only if you explicitly need the
module in question.

- **`grant_paused`** / **`grant_unpaused`** (`grant_pause.rs`) — per-grant pause state changed. Topics: `[contract_id, grant_paused, grant_id]`.
- **`amendment_proposed`** / **`amendment_approved`** / **`amendment_applied`** (`versioning.rs`) — grant versioning/amendment lifecycle.
- **`notification`** (`notification.rs`) — generic notification payload.
- **`syndicate_formed`** / **`member_joined`** / **`syndicate_closed`** (`syndication.rs`) — grant syndication lifecycle.
- **`sla`/`reg`** and **`sla`/`breach`** short symbols (`reviewer_sla.rs`) — reviewer SLA registration and breach detection.
- `ContractInitialized` — initialization does not emit a dedicated event
- `ContractUpgraded` / `ContractWasmUpgraded` — WASM/config upgrades are
  represented by **ContractMigrated** (see `events.rs`)
- `GrantMetadataUpdated` — there is no metadata-update function or event
- `QuorumReached` — milestone voting does not emit a quorum event; watch
  **MilestoneVoted** / **MilestoneStatusChanged** / **MilestonePaid** instead

## Typed `#[contractevent]` events

### Contract lifecycle

- **ContractMigrated**: Storage/contract migration ran (`events.rs`). Replaces the obsolete ContractUpgraded / ContractWasmUpgraded names.
  - Payload: `from_version: u32`, `to_version: u32`, `run_by: Address`, `timestamp: u64`
- **ContractPaused**: Protocol paused by admin.
  - Payload: `admin: Address`, `reason: String`, `timestamp: u64`
- **ContractUnpaused**: Protocol unpaused by admin.
  - Payload: `admin: Address`, `timestamp: u64`
- **ParamChanged**: A protocol parameter was changed.
  - Payload: `key: Symbol`, `set_by: Address`, `timestamp: u64`
- **IndexCapReached**: A grant index list hit `MAX_INDEX_ENTRIES` and the new id was dropped.
  - Payload: `grant_id: u64`, `timestamp: u64`

### Grants

- **GrantCreated**: Grant created.
  - Payload: `grant_id: u64`, `owner: Address`, `title: String`, `total_amount: i128`, `timestamp: u64`
- **GrantFunded**: Grant funded.
  - Payload: `grant_id: u64`, `funder: Address`, `amount: i128`, `new_balance: i128`, `timestamp: u64`
- **GrantCancelled**: Grant cancelled.
  - Payload: `grant_id: u64`, `owner: Address`, `reason: String`, `refund_amount: i128`, `timestamp: u64`
- **GrantCompleted**: Grant completed.
  - Payload: `grant_id: u64`, `total_paid: i128`, `remaining_balance: i128`, `timestamp: u64`
- **GrantForked**: Grant forked into a new grant.
  - Payload: `original_grant_id: u64`, `forked_grant_id: u64`, `timestamp: u64`
- **PayerReceipt**: Machine-readable receipt for a funder contribution.
  - Payload: `grant_id: u64`, `funder: Address`, `token: Address`, `amount: i128`, `memo: Option<String>`, `timestamp: u64`
- **PayeeReceipt**: Machine-readable receipt for a payout.
  - Payload: `grant_id: u64`, `recipient: Address`, `token: Address`, `amount: i128`, `milestone_idx: Option<u32>`, `timestamp: u64`
- **RefundIssued**: Refund issued to a funder.
  - Payload: `grant_id: u64`, `funder: Address`, `amount: i128`
- **RefundExecuted**: Refund policy execution completed.
  - Payload: `grant_id: u64`, `funder: Address`, `amount: i128`
- **FeeCollected**: Protocol fee collected on a payout.
  - Payload: `grant_id: u64`, `milestone_idx: u32`, `fee_amount: i128`, `token: Address`, `treasury: Address`, `timestamp: u64`

### Milestones

- **MilestoneSubmitted**: Milestone submitted.
  - Payload: `grant_id: u64`, `milestone_idx: u32`, `description: String`, `timestamp: u64`
- **MilestoneVoted**: Reviewer voted on a milestone.
  - Payload: `grant_id: u64`, `milestone_idx: u32`, `reviewer: Address`, `approve: bool`, `feedback: Option<String>`, `timestamp: u64`
- **MilestoneRejected**: Milestone rejected.
  - Payload: `grant_id: u64`, `milestone_idx: u32`, `reviewer: Address`, `reason: String`, `timestamp: u64`
- **MilestoneStatusChanged**: Milestone state changed (also emitted when a grant timer fires).
  - Payload: `grant_id: u64`, `milestone_idx: u32`, `new_state: MilestoneState`, `timestamp: u64`
- **MilestonePaid**: Milestone payout executed.
  - Payload: `grant_id: u64`, `milestone_idx: u32`, `amount: i128`, `timestamp: u64`
- **ExtensionRequested**: `milestone_extension.rs` — deadline extension requested.
  - Payload: `grant_id: u64`, `milestone_idx: u32`, `requested_by: Address`, `new_deadline: u64`
- **ExtensionApproved**: Deadline extension approved.
  - Payload: `grant_id: u64`, `milestone_idx: u32`, `new_deadline: u64`
- **ExtensionDenied**: Deadline extension denied.
  - Payload: `grant_id: u64`, `milestone_idx: u32`
- **ExtensionWithdrawn**: Deadline extension withdrawn.
  - Payload: `grant_id: u64`, `milestone_idx: u32`
- **ChecklistSubmitted**: `checklist.rs` — acceptance checklist submitted.
  - Payload: `grant_id: u64`, `milestone_idx: u32`, `submitted_at: u64`
- **CriterionReviewed**: A checklist criterion was reviewed.
  - Payload: `grant_id: u64`, `milestone_idx: u32`, `criterion_idx: u32`, `approved: bool`

### Contributors, reviewers, and reputation

- **ContributorRegistered**: Contributor registered.
  - Payload: `contributor: Address`, `name: String`, `timestamp: u64`
- **ReputationUpdated**: Contributor reputation updated.
  - Payload: `grant_id: u64`, `milestone_idx: u32`, `contributor: Address`, `new_reputation_score: u64`, `total_earned: i128`, `timestamp: u64`
- **ReviewerApproved**: Reviewer approved at protocol level.
  - Payload: `reviewer: Address`, `approved_by: Address`, `timestamp: u64`
- **ReviewerRevoked**: Reviewer revoked at protocol level.
  - Payload: `reviewer: Address`, `revoked_by: Address`, `timestamp: u64`
- **ReviewerAddedToGrant**: Reviewer added to a grant.
  - Payload: `grant_id: u64`, `reviewer: Address`, `timestamp: u64`
- **ReviewerRemovedFromGrant**: Reviewer removed from a grant.
  - Payload: `grant_id: u64`, `reviewer: Address`, `timestamp: u64`
- **PublicReviewSubmitted**: Open/public review submitted.
  - Payload: `grant_id: u64`, `milestone_idx: u32`, `reviewer: Address`, `timestamp: u64`
- **ReviewMarkedHelpful**: A public review was marked helpful.
  - Payload: `grant_id: u64`, `milestone_idx: u32`, `reviewer: Address`, `voter: Address`, `timestamp: u64`
- **ContributorVerified**: `contributor_verification.rs`.
  - Payload: `subject: Address`, `verifier: Address`, `level: VerificationLevel`, `expires_at: Option<u64>`
- **VerificationRevoked**: Contributor verification revoked.
  - Payload: `subject: Address`, `revoked_by: Address`
- **BadgeAwarded**: `badge.rs`.
  - Payload: `contributor: Address`, `badge_type: BadgeType`, `grant_id: Option<u64>`, `awarded_at: u64`

### Disputes and arbitration

- **DisputeRaised**: Dispute raised on a milestone.
  - Payload: `grant_id: u64`, `milestone_idx: u32`, `raised_by: Address`, `timestamp: u64`
- **ArbiterAssigned**: Arbiter assigned to a dispute.
  - Payload: `grant_id: u64`, `milestone_idx: u32`, `arbiter: Address`, `timestamp: u64`
- **ArbiterVoted**: Arbiter voted on a dispute.
  - Payload: `grant_id: u64`, `milestone_idx: u32`, `arbiter: Address`, `favor_contributor: bool`, `timestamp: u64`
- **DisputeResolved**: Dispute resolved.
  - Payload: `grant_id: u64`, `milestone_idx: u32`, `resolved_for_contributor: bool`, `timestamp: u64`
- **DisputeCancelled**: Dispute cancelled.
  - Payload: `grant_id: u64`, `milestone_idx: u32`, `cancelled_by: Address`, `timestamp: u64`
- **ArbiterJoined**: `arbitration_pool.rs` — arbiter joined the pool.
  - Payload: `arbiter: Address`, `stake: i128`
- **ArbiterLeft**: Arbiter left the pool.
  - Payload: `arbiter: Address`, `returned: i128`
- **PanelAssigned**: Arbitration panel assigned.
  - Payload: `case_id: u32`, `dispute_id: u32`, `panel_size: u32`
- **ArbiterVoteCast**: Pool arbiter voted on a case.
  - Payload: `case_id: u32`, `arbiter: Address`, `favor_contributor: bool`
- **CaseFinalized**: Arbitration case finalized.
  - Payload: `case_id: u32`, `outcome: bool`
- **RewardsSettled**: Arbitration rewards/slashes settled.
  - Payload: `case_id: u32`, `total_slashed: i128`

### Clawback

- **ClawbackInitiated**: Clawback initiated.
  - Payload: `grant_id: u64`, `milestone_idx: u32`, `target: Address`, `amount: i128`, `token: Address`, `initiated_by: Address`, `dispute_window_ends: u64`, `timestamp: u64`
- **ClawbackApproved**: Clawback approved.
  - Payload: `grant_id: u64`, `milestone_idx: u32`, `approver: Address`, `timestamp: u64`
- **ClawbackDisputed**: Clawback disputed.
  - Payload: `grant_id: u64`, `milestone_idx: u32`, `disputed_by: Address`, `timestamp: u64`
- **ClawbackExecuted**: Clawback executed.
  - Payload: `grant_id: u64`, `milestone_idx: u32`, `amount_recovered: i128`, `token: Address`, `treasury: Address`, `timestamp: u64`
- **ClawbackCancelled**: Clawback cancelled.
  - Payload: `grant_id: u64`, `milestone_idx: u32`, `cancelled_by: Address`, `timestamp: u64`
- **ClawbackAllowanceAuthorized**: Clawback token allowance authorized.
  - Payload: `grant_id: u64`, `contributor: Address`, `token: Address`, `amount: i128`, `live_until_ledger: u32`, `timestamp: u64`

### Treasury and DAO

- **TreasuryDeposited**: Treasury deposit.
  - Payload: `token: Address`, `from: Address`, `amount: i128`, `new_balance: i128`, `timestamp: u64`
- **TreasuryWithdrawn**: Treasury withdrawal.
  - Payload: `token: Address`, `to: Address`, `amount: i128`, `new_balance: i128`, `admin: Address`, `timestamp: u64`
- **TreasuryReallocated**: Treasury reallocation.
  - Payload: `from_token: Address`, `to_token: Address`, `amount: i128`, `admin: Address`, `timestamp: u64`
- **DaoProposalCreated**: DAO proposal created.
  - Payload: `proposal_id: u64`, `proposer: Address`, `title: String`, `voting_deadline: u64`, `timestamp: u64`
- **DaoVoteCast**: DAO vote cast.
  - Payload: `proposal_id: u64`, `voter: Address`, `support: bool`, `weight: u64`, `timestamp: u64`
- **DaoProposalFinalized**: DAO proposal finalized.
  - Payload: `proposal_id: u64`, `passed: bool`, `votes_for: u64`, `votes_against: u64`, `timestamp: u64`
- **DaoProposalExecuted**: DAO proposal executed.
  - Payload: `proposal_id: u64`, `executed_by: Address`, `timestamp: u64`
- **DaoProposalCancelled**: DAO proposal cancelled.
  - Payload: `proposal_id: u64`, `cancelled_by: Address`, `timestamp: u64`

### Bounties

- **BountyCreated**: Bounty created.
  - Payload: `bounty_id: u64`, `owner: Address`, `title: String`, `prize_amount: i128`, `submission_deadline: u64`, `timestamp: u64`
- **BountySubmissionReceived**: Bounty submission received.
  - Payload: `bounty_id: u64`, `submitter: Address`, `timestamp: u64`
- **BountyAwarded**: Bounty awarded.
  - Payload: `bounty_id: u64`, `winner: Address`, `prize_amount: i128`, `timestamp: u64`
- **BountyCancelled**: Bounty cancelled.
  - Payload: `bounty_id: u64`, `cancelled_by: Address`, `refund_amount: i128`, `timestamp: u64`

### Multisig

- **MultisigProposalCreated**: Multisig proposal created.
  - Payload: `proposal_id: u32`, `grant_id: u64`, `created_by: Address`, `threshold: u32`, `timestamp: u64`
- **MultisigSigned**: Multisig signature recorded.
  - Payload: `proposal_id: u32`, `signer: Address`, `approved: bool`, `total_weight_signed: u32`, `timestamp: u64`
- **MultisigExecuted**: Multisig proposal executed.
  - Payload: `proposal_id: u32`, `grant_id: u64`, `executed_by: Address`, `timestamp: u64`
- **MultisigProposalExpired**: Multisig proposal expired.
  - Payload: `proposal_id: u32`, `timestamp: u64`

### Compliance, invoices, and RBAC

- **ComplianceAttested**: Compliance attested.
  - Payload: `subject: Address`, `attested_by: Address`, `level: u32`, `expires_at: u64`, `timestamp: u64`
- **ComplianceRevoked**: Compliance attestation revoked.
  - Payload: `subject: Address`, `revoked_by: Address`, `timestamp: u64`
- **InvoiceSubmitted**: Invoice submitted.
  - Payload: `grant_id: u64`, `milestone_idx: u32`, `invoice_number: String`, `total: i128`, `timestamp: u64`
- **InvoiceApproved**: Invoice approved.
  - Payload: `grant_id: u64`, `milestone_idx: u32`, `approved_by: Address`, `timestamp: u64`
- **InvoiceRejected**: Invoice rejected.
  - Payload: `grant_id: u64`, `milestone_idx: u32`, `rejected_by: Address`, `reason: String`, `timestamp: u64`
- **InvoiceResubmitted**: Invoice resubmitted.
  - Payload: `grant_id: u64`, `milestone_idx: u32`, `total: i128`, `timestamp: u64`
- **RoleGranted**: RBAC role granted (`role` is the `Role` enum as `u32`).
  - Payload: `holder: Address`, `role: u32`, `granted_by: Address`, `timestamp: u64`
- **RoleRevoked**: RBAC role revoked.
  - Payload: `holder: Address`, `role: u32`, `revoked_by: Address`, `timestamp: u64`
- **RoleRenounced**: RBAC role renounced.
  - Payload: `holder: Address`, `role: u32`, `timestamp: u64`

### Crowdfund

- **CrowdfundCreated**: Crowdfund campaign created.
  - Payload: `campaign_id: u64`, `owner: Address`, `title: String`, `target_amount: i128`, `deadline: u64`, `timestamp: u64`
- **CrowdfundPledged**: Pledge received.
  - Payload: `campaign_id: u64`, `backer: Address`, `amount: i128`, `total_pledged: i128`, `timestamp: u64`
- **CrowdfundSucceeded**: Campaign succeeded.
  - Payload: `campaign_id: u64`, `total_pledged: i128`, `timestamp: u64`
- **CrowdfundFailed**: Campaign failed.
  - Payload: `campaign_id: u64`, `total_pledged: i128`, `timestamp: u64`
- **CrowdfundRefunded**: Backer refunded.
  - Payload: `campaign_id: u64`, `backer: Address`, `amount: i128`, `timestamp: u64`
- **CrowdfundCancelled**: Campaign cancelled.
  - Payload: `campaign_id: u64`, `cancelled_by: Address`, `total_pledged: i128`, `timestamp: u64`

### NFTs, collateral, and whitelist

- **NftMinted**: Milestone NFT minted.
  - Payload: `token_id: u32`, `grant_id: u64`, `milestone_idx: u32`, `owner: Address`, `timestamp: u64`
- **NftTransferred**: Milestone NFT transferred.
  - Payload: `token_id: u32`, `from: Address`, `to: Address`, `timestamp: u64`
- **CollateralDeposited**: Collateral deposited.
  - Payload: `grant_id: u64`, `contributor: Address`, `amount: i128`, `timestamp: u64`
- **CollateralReleased**: Collateral released.
  - Payload: `grant_id: u64`, `contributor: Address`, `amount: i128`, `timestamp: u64`
- **CollateralForfeited**: Collateral forfeited.
  - Payload: `grant_id: u64`, `contributor: Address`, `amount: i128`, `reason: String`, `timestamp: u64`
- **WhitelistAddressAdded**: Address added to a whitelist.
  - Payload: `address: Address`, `scope: WhitelistScope`, `timestamp: u64`
- **WhitelistAddressRemoved**: Address removed from a whitelist.
  - Payload: `address: Address`, `scope: WhitelistScope`, `timestamp: u64`

### Waitlist and templates

- **WaitlistJoined**: Applicant joined a grant waitlist.
  - Payload: `grant_id: u64`, `applicant: Address`, `position: u32`, `timestamp: u64`
- **WaitlistPromoted**: Applicant promoted from the waitlist.
  - Payload: `grant_id: u64`, `applicant: Address`, `position: u32`, `timestamp: u64`
- **WaitlistLeft**: Applicant left the waitlist.
  - Payload: `grant_id: u64`, `applicant: Address`, `timestamp: u64`
- **TemplateSaved**: Grant/milestone template saved.
  - Payload: `template_id: u64`, `owner: Address`, `name: String`, `timestamp: u64`
- **TemplateDeleted**: Template deleted.
  - Payload: `template_id: u64`, `owner: Address`, `timestamp: u64`
- **TemplateUsed**: Template used.
  - Payload: `template_id: u64`, `timestamp: u64`

### Streaming payments (`streaming.rs`)

- **StreamCreated**: Payment stream created.
  - Payload: `stream_id: u32`, `grant_id: u64`, `sender: Address`, `recipient: Address`, `rate_per_ledger: i128`, `deposited: i128`, `end_ledger: u32`
- **StreamWithdrawn**: Stream withdrawal.
  - Payload: `stream_id: u32`, `recipient: Address`, `amount: i128`
- **StreamCancelled**: Stream cancelled.
  - Payload: `stream_id: u32`, `sender_refund: i128`, `recipient_payout: i128`
- **StreamPaused**: Stream paused.
  - Payload: `stream_id: u32`, `paused_at_ledger: u32`
- **StreamResumed**: Stream resumed.
  - Payload: `stream_id: u32`, `new_end_ledger: u32`

### Circuit breaker (`circuit_breaker.rs`)

- **BreakerTripped**: Module circuit breaker tripped.
  - Payload: `module: ProtocolModule`, `tripped_by: Address`, `reason: String`
- **BreakerReset**: Circuit breaker reset by admin.
  - Payload: `module: ProtocolModule`, `reset_by: Address`
- **BreakerAutoReset**: Circuit breaker auto-reset.
  - Payload: `module: ProtocolModule`

### Hooks (`hooks.rs`)

- **HookTriggered**: Registered hook invoked (`event` is `HookEvent` as `u32`).
  - Payload: `event: u32`, `hook_index: u32`, `success: bool`
- **HookRegisteredEvent**: Hook registered.
  - Payload: `event: u32`, `hook_index: u32`, `target_contract: Address`

### Insurance (`insurance.rs`)

- **PolicyPurchased**: Insurance policy purchased.
  - Payload: `grant_id: u64`, `policyholder: Address`, `coverage_amount: i128`, `premium_paid: i128`
- **ClaimFiled**: Insurance claim filed.
  - Payload: `claim_id: u32`, `grant_id: u64`, `claimant: Address`, `claimed_amount: i128`
- **ClaimApproved**: Insurance claim approved.
  - Payload: `claim_id: u32`, `payout_amount: i128`
- **ClaimRejected**: Insurance claim rejected.
  - Payload: `claim_id: u32`

### Performance bonds (`performance_bond.rs`)

- **BondRequired**: Bond required on a grant.
  - Payload: `bond_id: u32`, `grant_id: u64`, `bond_amount: i128`
- **BondPosted**: Bond posted.
  - Payload: `bond_id: u32`, `grant_id: u64`, `guarantor: Address`
- **BondReleased**: Bond released.
  - Payload: `bond_id: u32`, `grant_id: u64`
- **BondClaimed**: Bond claimed.
  - Payload: `bond_id: u32`, `grant_id: u64`, `payout_amount: i128`

### Referrals (`referral.rs`)

- **ReferralCodeCreated**: Referral code created.
  - Payload: `referrer: Address`, `code_hash: Bytes`
- **ReferralApplied**: Referral code applied.
  - Payload: `referred: Address`, `referrer: Address`, `code_hash: Bytes`
- **ReferralRewardEarned**: Referral reward earned.
  - Payload: `referrer: Address`, `referred: Address`, `token: Address`, `amount: i128`
- **ReferralRewardsClaimed**: Referral rewards claimed.
  - Payload: `referrer: Address`, `token: Address`, `amount: i128`
- **ReferralCodeDeactivated**: Referral code deactivated.
  - Payload: `referrer: Address`, `code_hash: Bytes`

### Revenue share (`revenue_share.rs`)

- **EpochFinalized**: Revenue epoch finalized.
  - Payload: `epoch_id: u32`, `total_revenue: i128`, `total_stake_weight: i128`
- **RevenueClaimed**: Staker claimed epoch revenue.
  - Payload: `staker: Address`, `epoch_id: u32`, `amount: i128`

### Delegation (`delegate.rs`)

- **DelegationCreated**: Voting/review delegation created.
  - Payload: `delegator: Address`, `delegate: Address`, `created_at: u64`
- **DelegationRevoked**: Delegation revoked.
  - Payload: `delegator: Address`, `revoked_at: u64`

### Token swap (`token_swap.rs`)

- **SwapExecuted**: DEX swap executed.
  - Payload: `from_token: Address`, `to_token: Address`, `amount_in: i128`, `amount_out: i128`, `slippage_bps: u32`
- **SwapAndFundExecuted**: Swap-and-fund a grant.
  - Payload: `grant_id: u64`, `funder: Address`, `input_token: Address`, `input_amount: i128`, `swapped_amount: i128`
- **SwapAndPayExecuted**: Swap-and-pay a recipient.
  - Payload: `grant_id: u64`, `recipient: Address`, `grant_token: Address`, `preferred_token: Address`, `amount_out: i128`

## Legacy `env.events().publish` events

These are not `#[contractevent]` structs. Indexers should match the **topic
symbols** below.

### Grant pause (`grant_pause.rs`)

- **grant_paused**: Topics: `("grant_paused", grant_id)`; payload: `caller: Address`
- **grant_unpaused**: Topics: `("grant_unpaused", grant_id)`; payload: `caller: Address`

### Versioning / amendments (`versioning.rs`)

- **amendment_proposed**: Topics: `("amendment_proposed", grant_id)`; payload: `(owner: Address, amendment_version: u32)`
- **amendment_approved**: Topics: `("amendment_approved", grant_id)`; payload: `amendment_version: u32`
- **amendment_applied**: Topics: `("amendment_applied", grant_id)`; payload: `amendment_version: u32`

### Syndication (`syndication.rs`)

- **syndicate_formed**: Topics: `("syndicate_formed", grant_id)`; payload: `(lead: Address, target_total: i128)`
- **member_joined**: Topics: `("member_joined", grant_id)`; payload: `(member: Address, amount: i128, share_bps: u32)`
- **syndicate_closed**: Topics: `("syndicate_closed", grant_id)`; payload: `(lead: Address, deposited: i128)`
- **member_withdrew**: Topics: `("member_withdrew", grant_id)`; payload: `(member: Address, amount: i128)`

### Notifications (`notification.rs`)

- **notification**: Topics: `("notification", event: u32, scope_type, scope_data)`; payload: `payload: u128`

### Reviewer SLA (`reviewer_sla.rs`)

- **sla/reg**: Topics: `("sla", "reg", milestone_id)`; payload: `(reviewer: Address, deadline: u64)`
- **sla/breach**: Topics: `("sla", "breach", milestone_id)`; payload: `reviewer: Address`

## Indexing guidance

- Prefer matching typed events by **struct name** (e.g. `GrantCreated`), not by
  undocumented aliases.
- Use `grant_id` / `bounty_id` / `campaign_id` / `proposal_id` in the payload to
  shard streams. These IDs are not always topics.
- Re-check this file against `#[contractevent]` and `.publish(` in `src/` when
  adding new events.
- Source of truth for field types: the `pub struct` next to `#[contractevent]`
  (mostly `events.rs`, plus the module files named in each section).
