import { IDL } from '@dfinity/candid'

const BlockIndex = IDL.Nat
export const Tokens = IDL.Nat

// Balance

export const BalanceArgs = IDL.Record({
  account: IDL.Principal
})

export const BalanceResult = IDL.Variant({
  Ok: IDL.Record({
    owner: Tokens,
    deposit: Tokens
  })
})

// Transfer

export const MintArgs = IDL.Record({
  amount: Tokens
})

export const MintResult = IDL.Variant({
  Ok: BlockIndex,
  Err: IDL.Text
})

// Consent

export const ConsentPreferences = IDL.Record({
  language: IDL.Text
})

export const ConsentMessageRequest = IDL.Record({
  method: IDL.Text,
  arg: IDL.Vec(IDL.Nat8),
  consent_preferences: ConsentPreferences
})

export const ConsentInfo = IDL.Record({
  consent_message: IDL.Text,
  language: IDL.Text
})

export const ErrorInfo = IDL.Record({
  error_code: IDL.Nat,
  description: IDL.Text
})

export const ConsentMessageResponse = IDL.Variant({
  Valid: ConsentInfo,
  Forbidden: ErrorInfo,
  Malformed_call: ErrorInfo,
})

// ICRC1

export const Subaccount = IDL.Vec(IDL.Nat8)
export const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(Subaccount)
})

const Memo = IDL.Vec(IDL.Nat8)
const Timestamp = IDL.Nat64

export const ICRC1TransferArgs = IDL.Record({
  to: Account,
  fee: IDL.Opt(Tokens),
  memo: IDL.Opt(Memo),
  from_subaccount: IDL.Opt(Subaccount),
  created_at_time: IDL.Opt(Timestamp),
  amount: Tokens
})

const TransferError = IDL.Variant({
  GenericError: IDL.Record({
    message: IDL.Text,
    error_code: IDL.Nat
  }),
  TemporarilyUnavailable: IDL.Null,
  BadBurn: IDL.Record({ min_burn_amount: Tokens }),
  Duplicate: IDL.Record({ duplicate_of: BlockIndex }),
  BadFee: IDL.Record({ expected_fee: Tokens }),
  CreatedInFuture: IDL.Record({ ledger_time: IDL.Nat64 }),
  TooOld: IDL.Null,
  InsufficientFunds: IDL.Record({ balance: Tokens })
})
export const ICRC1TransferResult = IDL.Variant({
  Ok: BlockIndex,
  Err: TransferError
})

// Encoding

export function idlEncode(types, args) {
    return IDL.encode(types, args)
}

export function idlDecode(types, args) {
  return IDL.decode(types, args)
}