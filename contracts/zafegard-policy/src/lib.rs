#![no_std]

use smart_wallet_interface::{
    types::{Signer, SignerKey, SignerLimits, SignerStorage, SignerExpiration},
    PolicyInterface, SmartWalletClient,
};
use soroban_sdk::{
    auth::{Context, ContractContext},
    contract, contracterror, contractimpl, contracttype, map, panic_with_error, symbol_short, vec,
    Address, BytesN, Env, TryFromVal, Vec,
};

mod types;

mod test;

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum StorageKey {
    Admin,
    Previous(BytesN<32>),
}

#[contracterror]
#[derive(Copy, Clone, Debug, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotFound = 3,
    NotAllowed = 4,
    TooSoon = 5,
    TooMuch = 6,
}

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&StorageKey::Admin) {
            panic_with_error!(&env, Error::AlreadyInitialized)
        }

        env.storage().instance().set(&StorageKey::Admin, &admin);
    }
    pub fn add_wallet(env: Env, user: BytesN<32>, sac: Address, interval: u32, amount: i128) {
        let admin = self::get_admin_address(&env);

        admin.require_auth();

        SmartWalletClient::new(&env, &admin).add_signer(&Signer::Ed25519(
            user.clone(),
            SignerExpiration(Some(u32::MAX)),
            SignerLimits(Some(map![
                &env,
                (
                    sac,
                    Some(vec![
                        &env,
                        SignerKey::Policy(env.current_contract_address())
                    ])
                )
            ])),
            SignerStorage::Persistent,
        ));

        env.storage().persistent().set(&user, &(interval, amount));
    }
    pub fn remove_wallet(env: Env, user: BytesN<32>) {
        let admin = self::get_admin_address(&env);

        admin.require_auth();

        SmartWalletClient::new(&env, &admin).remove_signer(&SignerKey::Ed25519(user.clone()));

        env.storage().persistent().remove(&user);
    }
    pub fn update_wallet(env: Env, user: BytesN<32>, interval: Option<u32>, amount: Option<i128>) {
        self::get_admin_address(&env).require_auth();

        let (old_interval, old_amount) = env
            .storage()
            .persistent()
            .get::<BytesN<32>, (u32, i128)>(&user)
            .unwrap_or_else(|| panic_with_error!(&env, Error::NotFound));

        let interval = interval.unwrap_or(old_interval);
        let amount = amount.unwrap_or(old_amount);

        env.storage().persistent().set(&user, &(interval, amount));
    }
}

fn get_admin_address(env: &Env) -> Address {
    env.storage()
        .instance()
        .get::<StorageKey, Address>(&StorageKey::Admin)
        .unwrap_or_else(|| panic_with_error!(&env, Error::NotInitialized))
}

#[contractimpl]
impl PolicyInterface for Contract {
    fn policy__(env: Env, _source: Address, signer: SignerKey, contexts: Vec<Context>) {
        if contexts.len() == 1 {
            if let SignerKey::Ed25519(user) = signer {
                if let Context::Contract(ContractContext { fn_name, args, .. }) = contexts.get_unchecked(0) {
                    if fn_name == symbol_short!("transfer") {
                        if let Some(amount_val) = args.get(2) {
                            if let Ok(arg_amount) = i128::try_from_val(&env, &amount_val) {
                                let (interval, amount) = env
                                    .storage()
                                    .persistent()
                                    .get::<BytesN<32>, (u32, i128)>(&user.clone())
                                    .unwrap_or_else(|| {
                                        panic_with_error!(&env, Error::NotFound)
                                    });

                                let current = env.ledger().sequence();
                                let previous = env
                                    .storage()
                                    .persistent()
                                    .get::<StorageKey, u32>(&StorageKey::Previous(user.clone()))
                                    .unwrap_or(env.ledger().sequence() - interval);

                                let x = (current - previous) / interval;

                                if x <= 0 {
                                    panic_with_error!(&env, Error::TooSoon)
                                }

                                if arg_amount > (amount * i128::from(x)) {
                                    panic_with_error!(&env, Error::TooMuch)
                                }

                                env.storage()
                                    .persistent()
                                    .set(&StorageKey::Previous(user.clone()), &current);

                                return;
                            }
                        }
                    }
                }
            }
        }

        panic_with_error!(&env, Error::NotAllowed)
    }
}
