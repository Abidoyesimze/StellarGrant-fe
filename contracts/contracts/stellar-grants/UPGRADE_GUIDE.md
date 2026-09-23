# Stellar Grants contract — upgrade process

The contract does **not** implement a WASM-swap `admin_upgrade` path. There is no
`admin_upgrade`, `set_council`, `admin_change`, or `get_contract_storage_version`
entrypoint, and there is no `update_current_contract_wasm`/WASM-hash upgrade path
anywhere in `src/`. Schema upgrades are handled through **data migration**: a new
version of the contract WASM is built and deployed off-chain, then the global admin
calls `run_migration` to record the new `ContractVersion` and run any
version-specific data-migration steps. The contract emits `ContractMigrated` for
this — `ContractWasmUpgraded` is **not** emitted and must not be indexed (see
`EVENTS.md`).

## Roles

- **Global admin** — the address stored under the persistent `GlobalAdmin` storage
  key. It is set / rotated via `set_global_admin` (the first call sets it;
  subsequent calls must be authorized by the current admin) and is the sole caller
  of the admin-role functions:
  - `set_global_admin` — configure or rotate the global admin address.
  - `set_staking_config` — set the minimum reviewer stake and the treasury address.
  - `set_identity_oracle` — set the identity/KYC oracle contract address.
  - `run_migration` — run a versioned schema migration (see below).

## Contract version

- The contract records a typed `ContractVersion { major, minor, patch, deployed_at,
  deployer }` under the persistent `ContractVersion` storage key (see
  `migration::get_version` / `Storage::get_contract_version`).
- `initialize` calls `migration::initialize_version`, which seeds version `1.0.0`
  (major = `1`) on first deploy.
- Read the stored version off-chain or from a client via the `get_contract_version`
  entrypoint, and inspect `migration_history` for the list of completed migrations.

## Upgrading

1. Build the new contract: `cargo build --wasm` (or the workspace's documented
   release profile, e.g. `--target wasm32v1-none --release`).
2. Deploy the new WASM using the same flow as an initial deploy (for example the
   Stellar/Core Soroban tooling `stellar contract deploy`). The contract itself
   does not currently swap WASM in place.
3. Call `run_migration` with the global admin account and the target
   `ContractVersion`:

```bash
stellar contract invoke \
  --id CONTRACT_ID \
  --network testnet \
  --source-account YOUR_ADMIN_SECRET \
  -- \
  run_migration \
  --admin ADMIN_ADDRESS \
  --target_version '{"major":2,"minor":0,"patch":0,"deployed_at":0,"deployer":"DEPLOYER_G_ADDRESS"}'
```

   (Match the `target_version` serialization to your CLI/tooling.)

## How `run_migration` works

- Admin-only and idempotent: if the stored `ContractVersion` already equals the
  target, it returns a no-op `MigrationRecord` without writing.
- Otherwise it dispatches on schema major:
  - `1 → 2` runs `migrate_v1_to_v2` → `migrate_storage_keys_v2`, which re-homes
    legacy flat-enum `DataKey` storage into the hierarchical `DataKey` encoding
    (guarded by the `DataKey::V2KeysMigrated` idempotence flag).
  - any other combination currently falls through to a generic step.
- On success it writes the target version, appends a `MigrationRecord
  { from_version, to_version, run_by, run_at, success, notes }` to the persistent
  migration log, and emits `ContractMigrated { from_version, to_version, run_by,
  timestamp }`.

Indexers should key on `ContractMigrated` (and `migration_history`), never on a
`ContractWasmUpgraded` event.

## Safety

- Never mix unrelated data writes with `run_migration` in the same transaction
  unless the full change is tested on Futurenet/Testnet first.
- Gate reads/writes that depend on a future schema (inside the new WASM) on the
  stored `ContractVersion` and/or the migration log.
- The migration log is append-only; document every new `vN → vN+1` step in this
  file and keep the `run_migration` dispatch table in `src/migration.rs` in sync.