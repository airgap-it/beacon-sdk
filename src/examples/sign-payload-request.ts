import { BeaconErrorMessage, DAppClient, SignPayloadResponse } from '..'
import {} from '../types/BeaconErrorMessage'

const client = new DAppClient('My Sample DApp')

client
  .requestSignPayload({
    payload: 'any string that will be signed'
  })
  .then((response: SignPayloadResponse) => {
    console.log('signature', response.signature)
  })
  .catch((signPayloadError: BeaconErrorMessage) => console.error(signPayloadError))
