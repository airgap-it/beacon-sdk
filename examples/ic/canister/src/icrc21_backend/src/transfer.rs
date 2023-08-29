use candid::{candid_method, CandidType, decode_args};
use icrc_ledger_types::icrc1;
use ic_cdk_macros::*;
use serde::{Deserialize, Serialize};
use crate::ledger::call_ledger;

use crate::utils::principal_to_subaccount;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Hash)]
pub struct MintArgs {
    pub amount: icrc1::transfer::NumTokens,
}

#[update]
#[candid_method(update)]
pub async fn mint(args: MintArgs) -> Result<icrc1::transfer::BlockIndex, String> {
    ic_cdk::println!("Minting {} DEV for principal {}", &args.amount, &ic_cdk::caller());
    let transfer_args = icrc1::transfer::TransferArg {
        from_subaccount: None,
        to: icrc1::account::Account {
            owner: ic_cdk::caller(),
            subaccount: None
        },
        fee: None,
        created_at_time: None,
        memo: None,
        amount: args.amount,
    };

    icrc1_transfer(transfer_args).await?
        .map_err(|e| format!("ICRC-1 transfer error: {:?}", e))
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Hash)]
pub struct TransferArgs {
    pub to: icrc1::account::Account,
    pub amount: icrc1::transfer::NumTokens,
}

#[update]
#[candid_method(update)]
pub async fn transfer(args: TransferArgs) -> Result<icrc1::transfer::BlockIndex, String> {
    ic_cdk::println!("Transferring {} DEV to principal {} subaccount {:?}", &args.amount, &args.to.owner, &args.to.subaccount);
    let transfer_args = icrc1::transfer::TransferArg {
        from_subaccount: Some(principal_to_subaccount(&ic_cdk::caller())),
        to: args.to,
        fee: None,
        created_at_time: None,
        memo: None,
        amount: args.amount,
    };

    icrc1_transfer(transfer_args).await?
        .map_err(|e| format!("ICRC-1 transfer error: {:?}", e))
}

async fn icrc1_transfer(args: icrc1::transfer::TransferArg) -> Result<Result<icrc1::transfer::BlockIndex, icrc1::transfer::TransferError>, String> {
    call_ledger("icrc1_transfer", args).await
}

pub fn decode_arg(arg: &[u8]) -> Result<TransferArgs, String> {
    let (result,) = decode_args(arg).map_err(|e| format!("Candid decode error: {:?}", e))?;

    Ok(result)
}