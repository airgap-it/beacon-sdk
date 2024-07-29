import { TezosOperationType } from '../TezosOperationType'

export interface TezosDalPublishCommitmentOperation {
  kind: TezosOperationType.DAL_PUBLISH_COMMITMENT
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  slot_header: {
    slot_index: number
    commitment: string
    commitment_proof: string
  }
}
