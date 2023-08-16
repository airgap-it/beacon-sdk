use std::cell::RefCell;
use std::hash::Hash;
use candid::{CandidType, Principal};

use ic_ledger_types::{MAINNET_LEDGER_CANISTER_ID};

use serde::{Deserialize, Serialize};

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Hash, PartialEq)]
pub struct Configuration {
    pub ledger_canister_id: Principal
}

impl Default for Configuration {
    fn default() -> Self {
        Configuration {
            ledger_canister_id: MAINNET_LEDGER_CANISTER_ID
        }
    }
}

thread_local! {
    pub static CONFIGURATION: RefCell<Configuration> = RefCell::new(Configuration::default());
}