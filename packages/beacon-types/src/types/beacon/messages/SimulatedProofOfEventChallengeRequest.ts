import { BeaconBaseMessage, BeaconMessageType } from '@airgap/beacon-types'

export interface SimulatedProofOfEventChallengeRequest extends BeaconBaseMessage {
  type: BeaconMessageType.SimulatedProofOfEventChallengeRequest
  payload: string // The payload that will be emitted.
  contractAddress: string // The contract address of the abstracted account
}
