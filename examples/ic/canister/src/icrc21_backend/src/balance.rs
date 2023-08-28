use candid::{candid_method, CandidType, Nat, Principal};
use futures::join;
use icrc_ledger_types::icrc1;
use ic_cdk_macros::*;
use serde::{Deserialize, Serialize};

use crate::ledger::call_ledger;
use crate::utils::principal_to_subaccount;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Hash)]
pub struct BalanceArgs {
    pub account: Principal,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Hash)]
pub struct BalanceResult {
    pub owner: Nat,
    pub deposit: Nat,
}

#[update]
#[candid_method(update)]
pub async fn balance_of(args: BalanceArgs) -> Result<BalanceResult, String> {
    ic_cdk::println!("Balance of account {}", &args.account);
    let balance_of_owner_args = icrc1::account::Account{
        owner: args.account,
        subaccount: None,
    };
    let balance_of_deposit_args = icrc1::account::Account {
        owner: ic_cdk::id(),
        subaccount: Some(principal_to_subaccount(&args.account)),
    };

    let (balance_of_owner, balance_of_deposit) = join!(icrc1_balance_of(balance_of_owner_args), icrc1_balance_of(balance_of_deposit_args));
    let balance_of_owner = balance_of_owner.map_err(|e| format!("ICRC-1 balance_of (owner) error: {:?}", e))?;
    let balance_of_deposit = balance_of_deposit.map_err(|e| format!("ICRC-1 balance_of (deposit) error: {:?}", e))?;

    Ok(BalanceResult { owner: balance_of_owner, deposit: balance_of_deposit })
}

async fn icrc1_balance_of(args: icrc1::account::Account) -> Result<Nat, String> {
    call_ledger("icrc1_balance_of", args).await
}
