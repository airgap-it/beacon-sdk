import { IDL } from '@dfinity/candid'

export const BlockIndex = IDL.Nat
export const Tokens = IDL.Nat

export const Subaccount = IDL.Vec(IDL.Nat8)
export const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(Subaccount)
})

export const TransferArgs = IDL.Record({
  from_subaccount: IDL.Opt(Subaccount),
  to: Account,
  amount: Tokens
})

export const TransferResult = IDL.Variant({
  Ok: BlockIndex,
  Err: IDL.Text
})

export const canister = IDL.Service({
    transfer: IDL.Func([TransferArgs], [TransferResult], [])
})

export function idlEncode(types, args) {
    return IDL.encode(types, args)
}

export function idlDecode(types, args) {
  return IDL.decode(types, args)
}