#![cfg(test)]

use std::println;
extern crate std;

use smart_wallet::Contract as SmartWalletContract;
use smart_wallet_interface::types::SignerKey;
use soroban_sdk::{
    auth::{Context, ContractContext},
    symbol_short,
    testutils::{Address as _, EnvTestConfig, Ledger as _},
    vec,
    xdr::ToXdr,
    Address, BytesN, Env, Error as SorobanError, TryIntoVal,
};

use crate::{Contract, ContractClient, Error};

#[test]
fn test_add_and_use() {
    let mut env = Env::default();

    env.set_config(EnvTestConfig {
        capture_snapshot_at_drop: false,
    });

    env.ledger().set_sequence_number(10);

    env.mock_all_auths();

    let zafegard_address = env.register_contract(None, Contract);
    let zafegard_client = ContractClient::new(&env, &zafegard_address);

    let wallet = env.register_contract(None, SmartWalletContract);
    let sac = Address::generate(&env);
    let user = Address::generate(&env);
    let user_bytes = address_to_bytes(&env, &user);
    let interval = 10;
    let amount = 100;

    zafegard_client.init(&wallet);

    zafegard_client.add_wallet(&user_bytes, &sac, &interval, &amount);

    let contexts = vec![
        &env,
        Context::Contract(ContractContext {
            contract: sac, // SAC
            fn_name: symbol_short!("transfer"),
            args: vec![
                &env,
                user.to_val(),
                wallet.to_val(),
                100i128.try_into_val(&env).unwrap(),
            ],
        }),
    ];

    zafegard_client.policy__(&wallet, &SignerKey::Ed25519(user_bytes.clone()), &contexts);

    assert_eq!(
        zafegard_client.try_policy__(&wallet, &SignerKey::Ed25519(user_bytes.clone()), &contexts),
        Err(Ok(SorobanError::from(Error::TooSoon)))
    );

    env.ledger().set_sequence_number(20);

    zafegard_client.policy__(&wallet, &SignerKey::Ed25519(user_bytes.clone()), &contexts);
}

#[test]
fn test_add_and_remove() {
    let mut env = Env::default();

    env.set_config(EnvTestConfig {
        capture_snapshot_at_drop: false,
    });

    env.ledger().set_sequence_number(10);

    env.mock_all_auths();

    let zafegard_address = env.register_contract(None, Contract);
    let zafegard_client = ContractClient::new(&env, &zafegard_address);

    let wallet = env.register_contract(None, SmartWalletContract);
    let sac = Address::generate(&env);
    let user = Address::generate(&env);
    let user_bytes = address_to_bytes(&env, &user);
    let interval = 10;
    let amount = 100;

    zafegard_client.init(&wallet);

    zafegard_client.add_wallet(&user_bytes, &sac, &interval, &amount);

    let contexts = vec![
        &env,
        Context::Contract(ContractContext {
            contract: sac, // SAC
            fn_name: symbol_short!("transfer"),
            args: vec![
                &env,
                user.to_val(),
                wallet.to_val(),
                100i128.try_into_val(&env).unwrap(),
            ],
        }),
    ];

    zafegard_client.policy__(&wallet, &SignerKey::Ed25519(user_bytes.clone()), &contexts);

    env.ledger().set_sequence_number(20);

    zafegard_client.remove_wallet(&user_bytes);

    assert_eq!(
        zafegard_client.try_policy__(&wallet, &SignerKey::Ed25519(user_bytes.clone()), &contexts),
        Err(Ok(SorobanError::from(Error::NotFound)))
    );
}

fn address_to_bytes(env: &Env, address: &Address) -> BytesN<32> {
    let mut address_array = [0; 32];
    let address_bytes = address.to_xdr(env);

    address_bytes
        .slice(address_bytes.len() - 32..)
        .copy_into_slice(&mut address_array);

    BytesN::from_array(env, &address_array)
}
