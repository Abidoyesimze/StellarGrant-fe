use soroban_sdk::{Env, IntoVal, Symbol, Val};

/// Storage key helpers for the Stellar Grants contract
pub struct Storage;

impl Storage {
    /// Get the storage key for a grant
    pub fn grant_key(env: &Env, _grant_id: u64) -> Val {
        Symbol::new(env, "grant").into_val(env)
    }

    /// Get the storage key for a milestone
    pub fn milestone_key(env: &Env, _grant_id: u64, _milestone_idx: u32) -> Val {
        Symbol::new(env, "milestone").into_val(env)
    }

    /// Get the storage key for grant counter
    pub fn grant_counter_key(env: &Env) -> Val {
        Symbol::new(env, "grant_counter").into_val(env)
    }
}
