# Soroban WASM Optimization Benchmarks

## Contract: stellar-grants

Measured on this branch with **Stellar CLI 27.0.0** and **Rust 1.97.1**, using the
workspace release profile in `contracts/Cargo.toml`.

> **Note on `stellar contract build`:** Stellar CLI 27 rejects
> `overflow-checks = false` in `[profile.release]`. The figures below were
> produced with a temporary `overflow-checks = true` so the documented
> `stellar contract build` command could run; the checked-in workspace profile
> still uses `overflow-checks = false` for size. For a command that succeeds
> against the checked-in profile, use `cargo build --target wasm32v1-none
> --release --package stellar-grants` (see [README.md](./README.md) “Build the
> Contract”). Plain `cargo build` without the CLI’s spec-shaking env produces a
> larger artifact (~700 KB) and is not the size tracked here.

### Build commands

```bash
cd contracts
stellar contract build --package stellar-grants --locked --optimize=false
stellar contract build --package stellar-grants --locked --optimize
```

`stellar contract build` sets `SOROBAN_SDK_BUILD_SYSTEM_SUPPORTS_SPEC_SHAKING_V2=1`,
which is required for the sizes below (plain `cargo build` alone will not match).

### Tests

The test-status figures in earlier revisions of this file are stale. Verified against
the current tree at the time of this fix:

- **Compile status**: `cargo test --package stellar-grants --no-run` run from
  `contracts/` currently does **not** compile — the library fails to build with
  5 `E0425` errors. `src/lib.rs` calls `milestone_deps::attach_dag`,
  `milestone_deps::unblocked_milestones`, `milestone_deps::dependents_of`,
  `milestone_deps::get_dag`, and `milestone_deps::topological_order`, but
  `src/milestone_deps.rs` only implements `can_submit`.
- The previously-cited failure mode (tests calling missing client methods such as
  `reviewer_get_sla` / `check_reviewer_sla`) is no longer accurate; no such errors
  are produced today. The `milestone_deps` gap above is the current blocker.
- **Defined test count**: 361 `#[test]` functions across `src/` and `tests/`
  (previous "415 defined tests" figure is stale).
- The suite is not green, so no test/coverage percentage should be interpreted as
  a measure of passing tests.

### Results
- Noticeable reduction in contract size.
- Reduced resource footprint through instruction pruning.
- Because the test suite does not currently compile, the earlier
  "test coverage (12/12) fully maintained" claim cannot be substantiated — see the
  Tests section above for the actual compile/test status.

| Build | Size |
|------|------|
| Release (`--optimize=false`, with spec shaking) | `511,030` bytes (~499.1 KB) |
| Optimized (`--optimize`) | `447,150` bytes (~436.7 KB) |
| Optimizer delta | `63,880` bytes smaller (`12.5%`) |

### Release profile

From `contracts/Cargo.toml`:

```toml
[profile.release]
opt-level = "s"
overflow-checks = false
debug = 0
strip = true
debug-assertions = false
panic = "abort"
codegen-units = 1
lto = "fat"
incremental = false
```

### Optimization techniques applied

1. **Release profile** — `opt-level = "s"`, fat LTO, symbol stripping, single codegen unit, abort-on-panic.
2. **Spec shaking** — `stellar contract build` enables Soroban SDK spec shaking so unused contract-spec / rustdoc payload is dropped from the WASM.
3. **WASM optimizer** — `stellar contract build --optimize` (wasm-opt style pass) removes an additional ~12.5% from the release artifact.

### Tests

`cargo test --package stellar-grants` **does not currently compile** (23 errors as of
this measurement — e.g. tests calling missing client methods such as
`reviewer_get_sla` / `check_reviewer_sla`). A pass/fail coverage claim is therefore
not reported.

In-tree `#[test]` attributes under `contracts/stellar-grants`: **415** defined tests
(awaiting a green suite before a runnable count can be published).
