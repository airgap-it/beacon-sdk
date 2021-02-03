import {
  BeaconEvent,
  ErrorResponse,
  DAppClient,
  PermissionScope,
  PermissionResponseOutput,
  defaultEventCallbacks
} from '..' // Replace '..' with '@airgap/beacon-sdk'

const client = new DAppClient({
  name: 'My Sample DApp',
  disableDefaultEvents: true, // Disable all events / UI. This also disables the pairing alert.
  eventHandlers: {
    // To keep the pairing alert, we have to add the following default event handlers back
    [BeaconEvent.PAIR_INIT]: {
      handler: defaultEventCallbacks.PAIR_INIT
    },
    [BeaconEvent.PAIR_SUCCESS]: {
      handler: defaultEventCallbacks.PAIR_SUCCESS
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
