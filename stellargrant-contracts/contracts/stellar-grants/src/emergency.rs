use soroban_sdk::{Address, Env, String, Vec};

use crate::errors::ContractError;
use crate::events::Events;
use crate::storage::Storage;
use crate::types::PauseRecord;

fn require_global_admin(env: &Env, admin: &Address) -> Result<(), ContractError> {
    let global_admin = Storage::get_global_admin(env).ok_or(ContractError::Unauthorized)?;
    if global_admin != *admin {
        return Err(ContractError::Unauthorized);
    }
    Ok(())
}

/// Returns true if the contract is currently paused.
pub fn is_paused(env: &Env) -> bool {
    Storage::get_is_paused(env)
}

/// Pause the contract. Admin only. Stores a PauseRecord.
pub fn pause(env: &Env, admin: &Address, reason: String) -> Result<(), ContractError> {
    admin.require_auth();
    require_global_admin(env, admin)?;

    if is_paused(env) {
        return Err(ContractError::InvalidState);
    }

    Storage::set_is_paused(env, true);

    let record = PauseRecord {
        paused_by: admin.clone(),
        paused_at: env.ledger().timestamp(),
        unpaused_at: None,
        reason: reason.clone(),
    };
    Storage::append_pause_record(env, &record);
    Events::emit_contract_paused(env, admin.clone(), reason);

    Ok(())
}

/// Unpause the contract. Admin only. Updates the latest PauseRecord with unpaused_at.
pub fn unpause(env: &Env, admin: &Address) -> Result<(), ContractError> {
    admin.require_auth();
    require_global_admin(env, admin)?;

    if !is_paused(env) {
        return Err(ContractError::InvalidState);
    }

    Storage::set_is_paused(env, false);
    Storage::set_latest_pause_unpaused_at(env, env.ledger().timestamp());
    Events::emit_contract_unpaused(env, admin.clone());

    Ok(())
}

/// Guard function: returns Err(ContractPaused) if paused. Call at the top of entry points.
pub fn require_not_paused(env: &Env) -> Result<(), ContractError> {
    if is_paused(env) {
        return Err(ContractError::ContractPaused);
    }
    Ok(())
}

/// Return the full history of pause/unpause events.
pub fn pause_history(env: &Env) -> Vec<PauseRecord> {
    Storage::get_pause_history(env)
}
