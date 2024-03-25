import { BeaconBaseMessage, BeaconMessageType } from '@airgap/beacon-types'

export interface SimulatedProofOfEventChallengeResponse extends BeaconBaseMessage {
  type: BeaconMessageType.SimulatedProofOfEventChallengeResponse
  operationsList: string // Base64 encoded json
  errorMessage: string
}
