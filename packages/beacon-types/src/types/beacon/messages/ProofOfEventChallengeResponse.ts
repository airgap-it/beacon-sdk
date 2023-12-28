import { BeaconBaseMessage, BeaconMessageType } from '@airgap/beacon-types'

export interface ProofOfEventChallengeResponse extends BeaconBaseMessage {
  type: BeaconMessageType.ProofOfEventChallengeResponse
  dAppChallengeId: string // dApp decided challenge identifier
  isAccepted: boolean // Indicating whether the challenge is accepted
}
