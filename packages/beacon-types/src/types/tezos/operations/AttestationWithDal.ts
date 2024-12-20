import { TezosOperationType } from '../OperationTypes'
import { TezosBaseOperation } from '../TezosBaseOperation'

export interface TezosAttestationWithDalOperation extends TezosBaseOperation {
  kind: TezosOperationType.ATTESTATION_WITH_DAL;
  slot: number;
  level: number;
  round: number;
  block_payload_hash: string;
  dal_attestation: string;
}