import { WalletClient, BeaconMessageType, PermissionScope, PermissionResponseInput } from '..' // Replace '..' with '@airgap/beacon-sdk'

const connectApp = async (): Promise<void> => {
  const client = new WalletClient({ name: 'My Wallet' })
  await client.init() // Establish P2P connection

  client
    .connect(async (message) => {
      console.log('beacon message', message)

      // Let's assume it's a permission request, but we obviously need to handle all request types
      if (message.type === BeaconMessageType.PermissionRequest) {
        // Here we would show a UI to the user where he can confirm everything that has been requested in the beacon message

        // We hardcode a response
        const response: PermissionResponseInput = {
          type: BeaconMessageType.PermissionResponse,
          network: message.network, // Use the same network that the user requested
          scopes: [PermissionScope.OPERATION_REQUEST], // Ignore the scopes that have been requested and instead give only operation permissions
          id: message.id,
          publicKey: 'tezos public key'
        }

        await client.respond(response)
      }
    })
    .catch((error) => console.error('connect error', error))
}

connectApp().catch((error) => console.error('connect error', error))
