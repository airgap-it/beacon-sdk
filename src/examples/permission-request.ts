import { BeaconErrorMessage, DAppClient, PermissionResponse } from '..'

const client = new DAppClient('My Sample DApp')

client
  .requestPermissions()
  .then((response: PermissionResponse) => {
    console.log('permissions', response)
  })
  .catch((permissionError: BeaconErrorMessage) => console.error(permissionError))
