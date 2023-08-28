use candid::Principal;
use icrc_ledger_types::icrc1;

pub fn principal_to_subaccount(principal_id: &Principal) -> icrc1::account::Subaccount {
    let mut subaccount = [0; std::mem::size_of::<icrc1::account::Subaccount>()];
    let principal_id = principal_id.as_slice();
    subaccount[0] = principal_id.len().try_into().unwrap();
    subaccount[1..1 + principal_id.len()].copy_from_slice(principal_id);

    subaccount
}