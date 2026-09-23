# Soroban WASM Optimization Benchmarks

## Contract: stellar-grants

### Before Optimizations
- **WASM Size**: 18,067 bytes (~17.6 KB)
- **Profile**: default `opt-level = "z"`, `lto = true`

### After Optimizations
- **WASM Size**: 16,436 bytes (~16.1 KB)
- **Drop**: 1,631 bytes (~9.03%)

### Optimization Techniques Applied
1. **Release Profile Enhancements**:
   - `opt-level = "s"`: Found to be more effective than "z" for this specific instruction mix.
   - `lto = "fat"`: Enabled full Link Time Optimization.
   - `strip = true`: Removed all debug symbols and names.
   - `incremental = false`: Ensured clean release builds.
   - `overflow-checks = false`: Aggressive instruction pruning for well-typed operations.

2. **Dependency Profiling**:
   - `default-features = false` for `soroban-sdk`: Removed standard library components and logging features from the guest environment.
   - Removed unused crates and internal modules.

3. **Code Level Pruning**:
   - Removed unused `DataKey` variants and `storage` helpers.
   - Removed unused `#[contracttype]` structs from `events.rs` that were adding expansion overhead.
   - Replaced internal `Result` propagation with `env.panic_with_error()` callers in critical paths to reduce error-handling branch overhead.
   - Ensured zero `std` formatting usage (no `format!`, `println!`).

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
