export enum TezosOperationType {
  ENDORSEMENT = 'endorsement',
  SEED_NONCE_REVELATION = 'seed_nonce_revelation',
  DOUBLE_ENDORSEMENT_EVIDENCE = 'double_endorsement_evidence',
  DOUBLE_BAKING_EVIDENCE = 'double_baking_evidence',
  ACTIVATE_ACCOUNT = 'activate_account',
  PROPOSALS = 'proposals',
  BALLOT = 'ballot',
  REVEAL = 'reveal',
  TRANSACTION = 'transaction',
  ORIGINATION = 'origination',
  DELEGATION = 'delegation'
}

export interface TezosOperation {
  kind: TezosOperationType
}

export interface TezosBlockHeader {
  level: number
  proto: number
  predecessor: string
  timestamp: string
  validation_pass: number
  operations_hash: string
  fitness: string[]
  context: string
  priority: number
  proof_of_work_nonce: string
  signature: string
}
