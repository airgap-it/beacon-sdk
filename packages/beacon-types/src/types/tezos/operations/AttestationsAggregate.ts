import { TezosOperationType } from '../OperationTypes'
import { TezosBaseOperation } from '../TezosBaseOperation'

export interface TezosPreAttestationsAggregateOperation extends TezosBaseOperation {
  kind: TezosOperationType.ATTESTATIONS_AGGREGATE;
  consensus_content: {
    level: number;
    round: number;
    block_payload_hash: string;
  };
  committee: {
    slot: number;
    dal_attestation?: string;
  }[];
}