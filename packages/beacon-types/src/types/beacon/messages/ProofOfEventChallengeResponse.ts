import { BeaconBaseMessage, BeaconMessageType } from '@airgap/beacon-types'

export interface ProofOfEventChallengeResponse extends BeaconBaseMessage {
  type: BeaconMessageType.ProofOfEventChallengeResponse
  signature: string
  isAccepted: boolean // Indicating whether the challenge is accepted
}
