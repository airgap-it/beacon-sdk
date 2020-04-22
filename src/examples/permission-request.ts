import { BeaconErrorMessage, DAppClient, PermissionResponseOutput } from '..'

const client = new DAppClient('My Sample DApp')

client
  .requestPermissions()
  .then((response: PermissionResponseOutput) => {
    console.log('permissions', response)
  })
  .catch((permissionError: BeaconErrorMessage) => console.error(permissionError))
