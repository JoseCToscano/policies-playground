#![no_std]

use soroban_sdk::{
    auth::{Context, ContractContext},
    contract, contracterror, contractimpl, panic_with_error, symbol_short, Address, Env, Vec,
};
use smart_wallet_interface::{types::SignerKey, PolicyInterface};

#[contracterror]
#[derive(Copy, Clone, Debug, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotAllowed = 1,
}

#[contract]
pub struct Contract;

#[contractimpl]
impl PolicyInterface for Contract {
    fn policy__(env: Env, _source: Address, _signer: SignerKey, contexts: Vec<Context>) {
        for context in contexts.iter() {
            if let Context::Contract(ContractContext { fn_name, .. }) = context {
                if fn_name == symbol_short!("do_math") {
                    return;
                }
            }
        }

        panic_with_error!(&env, Error::NotAllowed)
    }
}