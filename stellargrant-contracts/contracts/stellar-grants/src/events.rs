use soroban_sdk::{Address, Env, Symbol};

/// Event definitions for the Stellar Grants contract
pub struct Events;

impl Events {
    /// Emit a grant created event
    pub fn grant_created(env: &Env, grant_id: u64, owner: &Address) {
        env.events().publish(
            (Symbol::new(env, "GrantCreated"), grant_id),
            owner.clone(),
        );
    }

    /// Emit a milestone approved event
    pub fn milestone_approved(env: &Env, grant_id: u64, milestone_idx: u32, reviewer: &Address) {
        env.events().publish(
            (Symbol::new(env, "MilestoneApproved"), grant_id),
            (milestone_idx, reviewer.clone()),
        );
    }

    /// Emit a milestone submitted event
    pub fn milestone_submitted(env: &Env, grant_id: u64, milestone_idx: u32) {
        env.events().publish(
            (Symbol::new(env, "MilestoneSubmitted"), grant_id),
            milestone_idx,
        );
    }
}
