import { BeaconErrorMessage, DAppClient, PermissionResponseOutput } from '..' // Replace '..' with '@airgap/beacon-sdk'

const client = new DAppClient({ name: 'My Sample DApp' })

client
  .requestPermissions()
  .then((response: PermissionResponseOutput) => {
    console.log('permissions', response)
  })
  .catch((permissionError: BeaconErrorMessage) => console.error(permissionError))
