import { BeaconBaseMessage, BeaconMessageType } from '@airgap/beacon-types'

export interface ProofOfEventChallengeRecordedRequest extends BeaconBaseMessage {
  type: BeaconMessageType.ProofOfEventChallengeRecorded
  dAppChallengeId: string // dApp decided challenge identifier
  success: boolean // Indicating whether the challenge is recorded successfully
  errorMessage: string // Optional, error message incase of failure
}
