#![cfg(test)]

use super::*;
use soroban_sdk::Env;

#[test]
fn test_initialize() {
    let env = Env::default();
    let contract_id = env.register_contract(None, StellarGrantsContract);
    let client = StellarGrantsContractClient::new(&env, &contract_id);

    let result = client.initialize();
    assert!(result.is_ok());
}
