import {
  BeaconEvent,
  ErrorResponse,
  DAppClient,
  PermissionScope,
  PermissionResponseOutput,
  defaultEventCallbacks,
  P2PPairingRequest,
  PostMessagePairingRequest,
  NetworkType
} from '..' // Replace '..' with '@airgap/beacon-sdk'
import { AlertButton } from '../ui/alert/Alert'

const client = new DAppClient({
  name: 'My Sample DApp',
  eventHandlers: {
    [BeaconEvent.PAIR_INIT]: {
      // Every BeaconEvent can be overriden by passing a handler here.
      // The default will not be executed anymore. To keep the default,
      // you will have to call it again.
      handler: async (
        data: {
          p2pPeerInfo: P2PPairingRequest
          postmessagePeerInfo: PostMessagePairingRequest
          preferredNetwork: NetworkType
          abortedHandler?(): void
        },
        eventCallback?: AlertButton[] | undefined
      ): Promise<void> => {
        await defaultEventCallbacks.PAIR_INIT(data) // Add this if you want to keep the default behaviour.
        console.log('syncInfo', data, eventCallback)
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
