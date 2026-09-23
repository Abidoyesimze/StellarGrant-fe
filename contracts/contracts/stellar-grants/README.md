# Stellar Grants Contract Events

## Accounting-Relevant Events

Off-chain tools that export grant funding and payout data to CSVs or accounting
pipelines should index the typed Soroban `#[contractevent]` events listed here.

Earlier revisions of this document described dedicated `PayerReceipt` and
`PayeeReceipt` events (Issue #135) with a `recipient` / `milestone_index` payload.
Those events were never implemented in this contract, so this guide now points at
the real events that carry the equivalent accounting data:

- **Payer side (funding)** — `GrantFunded`, emitted from `grant_fund`:
  - fields: `grant_id`, `funder`, `amount`, `new_balance`, `timestamp`
- **Payee side (completion)** — `GrantCompleted`, emitted from `grant_complete`:
  - fields: `grant_id`, `total_paid`, `remaining_balance`, `timestamp`

## Querying Receipts

You can query contract events from Soroban RPC and filter by event type:

1. Fetch contract events for the deployed contract address.
2. Filter by the **struct name (PascalCase)** of the typed event, e.g.
   `GrantFunded` or `GrantCompleted`. Typed `#[contractevent]` events are
   identified by their struct name — not by snake_case aliases such as
   `grant_funded` (see `EVENTS.md`).
3. Parse the payload fields from the struct definition (listed above) for export.

Because these are structured contract events, indexers can store them directly in
tabular format for CSV or accounting pipeline exports.