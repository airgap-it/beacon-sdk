pub mod balance;
pub mod transfer;
pub mod consent;

mod state;
mod ledger;
mod utils;

use state::{Configuration, CONFIGURATION};
use candid::{candid_method};
use ic_cdk_macros::*;

#[init]
#[candid_method(init)]
fn init(configuration: Option<Configuration>) {
    CONFIGURATION.with(|c| c.replace(configuration.unwrap_or_default()));
}
