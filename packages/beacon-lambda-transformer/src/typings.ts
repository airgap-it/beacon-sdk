declare type MichelsonJSON_Prim = {
  prim: string
  args?: MichelsonJSON[]
  annots?: string[]
}

declare type MichelsonJSON_Int = {
  int: string
  annots?: string[]
}

declare type MichelsonJSON_String = {
  string: string
  annots?: string[]
}

declare type MichelsonJSON_Bytes = {
  bytes: string
  annots?: string[]
}

export declare type MichelsonJSON =
  | MichelsonJSON_Prim
  | MichelsonJSON_Int
  | MichelsonJSON_String
  | MichelsonJSON_Bytes
  | MichelsonJSON[]

export enum InternalOperationKind {
  Delegation = 'delegation',
  Origination = 'origination',
  Transaction = 'transaction'
}

export interface OptionalFields {
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
}

export interface Delegation extends Partial<OptionalFields> {
  kind: `${InternalOperationKind.Delegation}`
  delegate: string
}

export interface Origination extends Partial<OptionalFields> {
  kind: `${InternalOperationKind.Origination}`
  balance: string
  delegate?: string
  script: {
    code: MichelsonJSON[]
    storage: MichelsonJSON
  }
}

export interface Transaction extends Partial<OptionalFields> {
  kind: `${InternalOperationKind.Transaction}`
  destination: string
  amount: string
  parameters?: {
    entrypoint: string
    value: MichelsonJSON
  }
}

export type Operation = Delegation | Origination | Transaction
