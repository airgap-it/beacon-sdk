import { IDL } from '@dfinity/candid'

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

export const canister = IDL.Service({
    consent_message: IDL.Func([ConsentMessageRequest], [IDL.Opt(ConsentMessageResponse)], ['query']),
})

export function idlEncode(types, args) {
    return IDL.encode(types, args)
}

export function idlDecode(types, args) {
  return IDL.decode(types, args)
}