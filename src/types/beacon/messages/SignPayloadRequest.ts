import { BeaconBaseMessage, BeaconMessageType } from '../../..'

export interface SignPayloadRequest extends BeaconBaseMessage {
  type: BeaconMessageType.SignPayloadRequest
  payload: string // The payload that will be signed. Can be any string and does not have to be a valid tezos operation
  sourceAddress?: string // The user can specify an address that should be pre-selected in the wallet
}
