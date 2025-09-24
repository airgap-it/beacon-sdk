import { InlinedAttestation } from '../InlinedAttestation';
import { TezosOperationType } from '../OperationTypes'

export interface TezosDalPublishCommitmentOperation {
  kind: TezosOperationType.DAL_ENTRAPMENT_EVIDENCE;
  attestation: InlinedAttestation;
  consensus_slot: number;
  slot_index: number;
  shard_with_proof: { shard: (number | string[])[]; proof: string };
}
