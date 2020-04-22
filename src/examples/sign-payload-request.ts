import { BeaconErrorMessage, DAppClient, SignPayloadResponseOutput } from '..'
import {} from '../types/BeaconErrorMessage'

const client = new DAppClient('My Sample DApp')

client
  .requestSignPayload({
    payload: 'any string that will be signed'
  })
  .then((response: SignPayloadResponseOutput) => {
    console.log('signature', response.signature)
  })
  .catch((signPayloadError: BeaconErrorMessage) => console.error(signPayloadError))
