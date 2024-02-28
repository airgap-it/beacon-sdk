import { TezosOperationType } from '../OperationTypes'

export interface PreAttestationOperation {
  kind: TezosOperationType.PREATTESTATION
  slot: number
  level: number
  round: number
  block_payload_hash: string
}
