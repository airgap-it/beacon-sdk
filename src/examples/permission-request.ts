import { ErrorResponse, DAppClient, PermissionResponseOutput } from '..' // Replace '..' with '@airgap/beacon-sdk'

const client = new DAppClient({ name: 'My Sample DApp' })

client
  .requestPermissions()
  .then((response: PermissionResponseOutput) => {
    console.log('permissions', response)
  })
  .catch((permissionError: ErrorResponse) => console.error(permissionError))
