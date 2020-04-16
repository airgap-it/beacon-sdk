import { LocalTransport } from '../transports/LocalTransport'
import { Serializer } from '../Serializer'
import { DAppClient, PermissionResponse, BeaconMessageType } from '..'

const transport = new LocalTransport('test')

// THIS IS AN OLD FILE FOR DEVELOPMENT PURPOSES. DOES NOT WORK CURRENTLY.

// We emulate the wallet side and send a dummy response back
transport.transformer = async (message: string): Promise<string> => {
  const serializer = new Serializer()
  const deserialized: any = await serializer.deserialize(message)

  if (deserialized.type === BeaconMessageType.PermissionRequest) {
    const response: PermissionResponse = {
      type: BeaconMessageType.PermissionResponse,
      id: deserialized.id,
      beaconId: 'dummyPubkey',
      accountIdentifier: 'hash',
      pubkey: 'dummy',
      network: deserialized.network,
      scopes: deserialized.scope
    }

    return serializer.serialize(response)
  }

  return message
}

const client = new DAppClient('DApp')
client
  .init(true, transport)
  .then(() => {
    client
      .requestPermissions()
      .then((permissions) => {
        console.log('got permissions', permissions)
      })
      .catch((error) => console.log(error))
  })
  .catch((error) => console.error(error))
