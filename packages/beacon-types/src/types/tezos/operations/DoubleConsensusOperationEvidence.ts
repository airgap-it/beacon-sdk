import { InlinedAttestation } from '../InlinedAttestation';
import { TezosOperationType } from '../OperationTypes'
import { TezosBaseOperation } from '../TezosBaseOperation'

export interface TezosUpdateConsensusKeyOperation extends TezosBaseOperation {
  kind: TezosOperationType.DOUBLE_CONSENSUS_OPERATION_EVIDENCE
  slot: number;
  op1: InlinedAttestation;
  op2: InlinedAttestation;
}
