# Stellar Grants Event Schema

This contract emits Soroban events for off-chain indexers and subgraphs. Most
business events are **typed** `#[contractevent]` structs; a small number are raw
(untyped) symbol-topic events.

## Event Structure

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