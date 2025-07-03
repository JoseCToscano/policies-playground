#![no_std]

use soroban_sdk::{
    auth::{Context, ContractContext},
    contract, contracterror, contractimpl, panic_with_error, symbol_short, Address, Env, Map,
    String, Symbol, TryFromVal, Vec,
};
use smart_wallet_interface::{types::SignerKey, PolicyInterface};

#[contracterror]
#[derive(Copy, Clone, Debug, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotAllowed = 1,
    AlreadySponsored = 2,
    InvalidArguments = 3,
    WalletTooNew = 4,
    DailySponsorshipLimitReached = 5,
    ContactNotFound = 6,
}

const SPONSORED_PAIRS: Symbol = symbol_short!("spon_pai");
const DAILY_SPONSORSHIPS: Symbol = symbol_short!("daily_sp");
const WALLET_AGES: Symbol = symbol_short!("wal_ages");
const MIN_WALLET_AGE_LEDGERS: u32 = 17280; // ~24 hours
const MAX_DAILY_SPONSORSHIPS: u32 = 50;

#[contract]
pub struct Contract;

#[contractimpl]
impl PolicyInterface for Contract {
    fn policy__(env: Env, _source: Address, signer: SignerKey, contexts: Vec<Context>) {
        for context in contexts.iter() {
            if let Context::Contract(ContractContext {
                contract: _contract, fn_name, args, ..
            }) = context
            {
                // Only allow specific functions
                if fn_name == symbol_short!("add_cont") {
                    // add_contact is always allowed (shortened to add_cont)
                    continue;
                } else if fn_name == symbol_short!("spon_coff") {
                    // sponsor_coffee needs additional validation (shortened to spon_coff)
                    validate_sponsor_coffee(&env, &signer, &args);
                    continue;
                } else {
                    // Any other function is not allowed
                    panic_with_error!(&env, Error::NotAllowed);
                }
            } else {
                // Only contract calls are allowed
                panic_with_error!(&env, Error::NotAllowed);
            }
        }
    }
}

fn validate_sponsor_coffee(env: &Env, signer: &SignerKey, args: &Vec<soroban_sdk::Val>) {
    // Extract arguments: sponsor_account, contact_alias, contact_address
    let _sponsor_account = match args.get(0) {
        Some(account_val) => match Address::try_from_val(env, &account_val) {
            Ok(account) => account,
            Err(_) => panic_with_error!(env, Error::InvalidArguments),
        },
        None => panic_with_error!(env, Error::InvalidArguments),
    };

    let _contact_alias = match args.get(1) {
        Some(alias_val) => match String::try_from_val(env, &alias_val) {
            Ok(alias) => alias,
            Err(_) => panic_with_error!(env, Error::InvalidArguments),
        },
        None => panic_with_error!(env, Error::InvalidArguments),
    };

    // The contact address should be passed as the third argument by the sponsor_coffee function
    // after it looks up the contact in the contacts contract
    let contact_address = match args.get(2) {
        Some(address_val) => match Address::try_from_val(env, &address_val) {
            Ok(address) => address,
            Err(_) => panic_with_error!(env, Error::InvalidArguments),
        },
        None => panic_with_error!(env, Error::InvalidArguments),
    };

    // 1. Validate wallet age
    validate_wallet_age(env, signer);

    // 2. Validate daily sponsorship limit
    validate_daily_sponsorship_limit(env, signer);

    // 3. Check if this specific contact has already been sponsored by this signer
    validate_unique_sponsorship(env, signer, &contact_address);

    // 4. Record this sponsorship
    record_sponsorship(env, signer, &contact_address);
}

fn validate_wallet_age(env: &Env, signer: &SignerKey) {
    let current_ledger = env.ledger().sequence();
    
    // Get or initialize wallet age tracking
    let mut wallet_ages: Map<SignerKey, u32> = env
        .storage()
        .persistent()
        .get(&WALLET_AGES)
        .unwrap_or_else(|| Map::new(env));

    // If this is the first time we see this wallet, record current ledger
    if !wallet_ages.contains_key(signer.clone()) {
        wallet_ages.set(signer.clone(), current_ledger);
        env.storage().persistent().set(&WALLET_AGES, &wallet_ages);
        // New wallet, fail the age check
        panic_with_error!(env, Error::WalletTooNew);
    }

    let wallet_first_seen = wallet_ages.get(signer.clone()).unwrap();
    if current_ledger - wallet_first_seen < MIN_WALLET_AGE_LEDGERS {
        panic_with_error!(env, Error::WalletTooNew);
    }
}

fn validate_daily_sponsorship_limit(env: &Env, signer: &SignerKey) {
    let current_ledger = env.ledger().sequence();
    let current_day = current_ledger / 8640; // ~8640 ledgers per day

    let mut daily_sponsorships: Map<(SignerKey, u32), u32> = env
        .storage()
        .persistent()
        .get(&DAILY_SPONSORSHIPS)
        .unwrap_or_else(|| Map::new(env));

    let daily_key = (signer.clone(), current_day);
    let current_count = daily_sponsorships.get(daily_key.clone()).unwrap_or(0);

    if current_count >= MAX_DAILY_SPONSORSHIPS {
        panic_with_error!(env, Error::DailySponsorshipLimitReached);
    }

    // Increment daily count
    daily_sponsorships.set(daily_key, current_count + 1);
    env.storage().persistent().set(&DAILY_SPONSORSHIPS, &daily_sponsorships);
}


fn validate_unique_sponsorship(env: &Env, signer: &SignerKey, contact_address: &Address) {
    let storage_key = (signer.clone(), contact_address.clone());

    let sponsored_pairs: Map<(SignerKey, Address), bool> = env
        .storage()
        .persistent()
        .get(&SPONSORED_PAIRS)
        .unwrap_or_else(|| Map::new(env));

    if sponsored_pairs.contains_key(storage_key.clone()) {
        panic_with_error!(env, Error::AlreadySponsored);
    }
}

fn record_sponsorship(env: &Env, signer: &SignerKey, contact_address: &Address) {
    let storage_key = (signer.clone(), contact_address.clone());

    let mut sponsored_pairs: Map<(SignerKey, Address), bool> = env
        .storage()
        .persistent()
        .get(&SPONSORED_PAIRS)
        .unwrap_or_else(|| Map::new(env));

    sponsored_pairs.set(storage_key, true);
    env.storage().persistent().set(&SPONSORED_PAIRS, &sponsored_pairs);
}