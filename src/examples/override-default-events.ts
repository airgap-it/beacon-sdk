import {
  ErrorResponse,
  DAppClient,
  PermissionScope,
  PermissionResponseOutput,
  P2PPairingRequest
} from '..'
import { BeaconEvent, defaultEventCallbacks } from '../events'

const client = new DAppClient({
  name: 'My Sample DApp',
  eventHandlers: {
    [BeaconEvent.P2P_LISTEN_FOR_CHANNEL_OPEN]: {
      // Every BeaconEvent can be overriden by passing a handler here.
      // The default will not be executed anymore. To keep the default,
      // you will have to call it again.
      handler: async (syncInfo: P2PPairingRequest): Promise<void> => {
        await defaultEventCallbacks.P2P_LISTEN_FOR_CHANNEL_OPEN(syncInfo) // Add this if you want to keep the default behaviour.
        console.log('syncInfo', syncInfo)
      }
    }
  }
})

const scopes: PermissionScope[] = [
  PermissionScope.OPERATION_REQUEST,
  PermissionScope.SIGN,
  PermissionScope.THRESHOLD
]

client
  .requestPermissions({
    scopes
  })
  .then((permissionResponse: PermissionResponseOutput) => {
    console.log('permissions', permissionResponse)
  })
  .catch((permissionError: ErrorResponse) => console.error(permissionError))
