import { BeaconBaseMessage, BeaconMessageType } from '@airgap/beacon-types'

export interface ProofOfEventChallengeRequest extends BeaconBaseMessage {
  type: BeaconMessageType.ProofOfEventChallengeRequest
  payload: string // The payload that will be emitted.
  contractAddress: string // The contract address of the abstracted account
}
