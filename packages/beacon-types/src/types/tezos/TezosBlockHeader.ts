/**
 * @internalapi
 * @category Tezos
 */
export interface TezosBlockHeader {
  level: number
  proto: number
  predecessor: string
  timestamp: Date | string
  validation_pass: number
  operations_hash: string
  fitness: string[]
  context: string
  payload_hash?: string
  payload_round?: number
  priority?: number
  proof_of_work_nonce: string
  seed_nonce_hash?: string
  liquidity_baking_toggle_vote?: 'on' | 'off' | 'pass'
  adaptive_issuance_vote?: 'on' | 'off' | 'pass'
  liquidity_baking_escape_vote?: boolean | 'on' | 'off' | 'pass'
  signature: string
}
