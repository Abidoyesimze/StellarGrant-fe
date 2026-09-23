# Fix milestone approval, DAO admin auth, fork inheritance, and category analytics bugs

## Summary

Four correctness/security fixes in `contracts/contracts/stellar-grants`:

- **License attachment now requires an approved milestone.** `attach_license` checked
  only that the milestone existed, not its state, so a `LicenseRecord` (including
  `IpRights` like `commercial_use`/`sublicense`) could be attached to a milestone that
  was Pending, Submitted, or explicitly Rejected. It now rejects with
  `ContractError::InvalidState` unless `milestone.state == MilestoneState::Approved`.

- **DAO config setters now require genuine admin authorization.** `require_global_admin`
  compared the caller against the stored global admin but never called
  `require_auth()`, so anyone could pass the (publicly visible) admin address as the
  `admin` parameter and pass the check without the admin ever signing. Combined with
  `create_proposal` having no eligibility gate, this allowed an attacker to drive
  quorum/voting period to trivial values and single-handedly pass and execute a
  `ChangeAdmin` or `TreasuryWithdrawal` proposal. `require_global_admin` now calls
  `caller.require_auth()` before the equality check.

- **`inherit_milestones` now actually copies milestone data on fork.** The flag
  previously had no effect beyond pushing `"milestones"` onto
  `ForkRecord.inherited_fields` — no `Milestone` record was ever copied, so the
  on-chain fork record falsely claimed milestone content was inherited. `fork_grant`
  now copies each existing milestone's description and amount onto the new grant
  (with approval state reset — no votes/approvals/proof carry over), and only records
  `"milestones"` as inherited when data was genuinely copied.

- **`category_stats` now reads the correct index.** It was reading
  `Storage::get_tag_index(category_id)` — keyed by a 32-bit hash of freeform tag
  strings — instead of `Storage::get_category_index(category_id)`, so a small
  sequential `category_id` never matched and every category's stats (and
  `build_snapshot`'s top-category-by-funding selection) silently reported zero. Fixed
  to use `get_category_index`, the same index `grant_tags::tag_grant` populates.

Also includes a small unrelated fix: `grant_index.rs`'s test used `format!` without
`alloc`/`std` in scope, which fails to compile in this `#![no_std]` crate and blocked
the whole test binary from building. Scoped `extern crate std; use std::format;` to
that test module to unblock compilation — no behavioral change.

## Test plan

- [x] `test_attach_license_rejects_pending_milestone` / `test_attach_license_rejects_rejected_milestone`
      confirm `attach_license` fails on non-Approved milestones; existing Approved-path
      tests confirm the happy path still works.
- [x] `test_set_dao_mode_rejects_admin_address_without_real_auth` confirms a stranger
      supplying the real admin's address without that admin's auth is rejected on all
      three setters; existing `test_set_dao_mode_requires_admin` confirms the
      legitimate admin flow still works.
- [x] `test_fork_grant_copies_milestone_data_when_inherited` confirms milestone
      descriptions are copied and `inherited_fields` includes `"milestones"`;
      `test_fork_grant_no_milestones_copied_does_not_claim_inherited` confirms the
      claim is omitted when nothing was actually copied.
- [x] `test_category_stats_reads_tagged_grants` tags grants into a category and
      asserts `category_stats` reports non-zero totals matching expectations.
- [x] `cargo fmt --check` and `cargo build -p stellar-grants` pass; `cargo clippy`
      reports zero issues in every file this PR touches (remaining clippy/test
      failures elsewhere in the crate are pre-existing environment/toolchain drift,
      reproduced identically on unmodified `main`, and are out of scope here).

closes #1104
closes #1105
closes #1106
closes #1107
