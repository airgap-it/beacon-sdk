use candid::CandidType;
use serde::Deserialize;

use crate::state::{CONFIGURATION};

pub async fn call_ledger<T: CandidType, R: CandidType + for<'a> Deserialize<'a>>(method: &str, args: T) -> Result<R, String> {
    let ledger_canister_id = CONFIGURATION.with(|conf| conf.borrow().ledger_canister_id);
    let (result,) = ic_cdk::call(ledger_canister_id, method, (args,)).await
        .map_err(|e| format!("call_ledger error: {:?}", e))?;

    let result: R = result;

    Ok(result)
}