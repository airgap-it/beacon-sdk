use candid::{candid_method, CandidType, decode_args, Nat};
use icrc_ledger_types::{icrc1, icrc2};
use ic_cdk::api::call::CallResult;
use ic_cdk_macros::*;
use serde::{Deserialize, Serialize};

use crate::state::{CONFIGURATION};

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Hash)]
pub struct TransferArgs {
    pub from_subaccount: Option<icrc1::account::Subaccount>,
    pub to: icrc1::account::Account,
    pub amount: icrc1::transfer::NumTokens,
}

#[update]
#[candid_method(update)]
pub async fn transfer(args: TransferArgs) -> Result<icrc1::transfer::BlockIndex, String> {
    ic_cdk::println!("Transferring {} DEV to principal {} subaccount {:?}", &args.amount, &args.to.owner, &args.to.subaccount);
    let approve_args = icrc2::approve::ApproveArgs {
        from_subaccount: args.from_subaccount,
        spender: icrc1::account::Account {
            owner: ic_cdk::id(),
            subaccount: None,
        },
        amount: args.amount.clone(),
        expected_allowance: None,
        expires_at: None,
        fee: None,
        memo: None,
        created_at_time: None,
    };

    let _ = icrc2_approve(approve_args).await?
        .map_err(|e| format!("ICRC-2 approve error: {:?}", e));

    let transfer_args = icrc2::transfer_from::TransferFromArgs {
        spender_subaccount: None,
        from: icrc1::account::Account {
            owner: ic_cdk::caller(),
            subaccount: args.from_subaccount,
        },
        to: args.to,
        fee: None,
        created_at_time: None,
        memo: None,
        amount: args.amount,
    };

    icrc2_transfer(transfer_args).await?
        .map_err(|e| format!("ICRC-2 transfer_from error: {:?}", e))
}

async fn icrc2_approve(args: icrc2::approve::ApproveArgs) -> Result<Result<Nat, icrc2::approve::ApproveError>, String> {
    call_ledger("icrc2_approve", args).await
}

async fn icrc2_transfer(args: icrc2::transfer_from::TransferFromArgs) -> Result<Result<Nat, icrc2::transfer_from::TransferFromError>, String> {
    call_ledger("icrc2_transfer_from", args).await
}

async fn call_ledger<T: CandidType, R: CandidType + for<'a> Deserialize<'a>>(method: &str, args: T) -> Result<R, String> {
    let ledger_canister_id = CONFIGURATION.with(|conf| conf.borrow().ledger_canister_id);
    let (result,) = ic_cdk::call(ledger_canister_id, method, (args,)).await
        .map_err(|e| format!("ICRC-2 Agent error: {:?}", e))?;

    let result: R = result;

    Ok(result)
}

pub fn decode_arg(arg: &[u8]) -> Result<TransferArgs, String> {
    let (result,) = decode_args(arg).map_err(|e| format!("Candid decode error: {:?}", e))?;

    Ok(result)
}