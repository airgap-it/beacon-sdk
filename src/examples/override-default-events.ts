import {
  BeaconEvent,
  BeaconErrorMessage,
  DAppClient,
  PermissionScope,
  PermissionResponseOutput,
  P2PPairInfo,
  defaultEventCallbacks
} from '..' // Replace '..' with '@airgap/beacon-sdk'

const client = new DAppClient({
  name: 'My Sample DApp',
  eventHandlers: {
    [BeaconEvent.P2P_LISTEN_FOR_CHANNEL_OPEN]: {
      // Every BeaconEvent can be overriden by passing a handler here.
      // The default will not be executed anymore. To keep the default,
      // you will have to call it again.
      handler: async (syncInfo: P2PPairInfo): Promise<void> => {
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
  .catch((permissionError: BeaconErrorMessage) => console.error(permissionError))
