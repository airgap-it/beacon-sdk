import { DAppClient } from '../src/client/clients/DappClient'

import { LocalTransport } from '../src/client/transports/LocalTransport'
import { Serializer } from '../src/client/Serializer'
import { MessageTypes, PermissionResponse } from '../src/client/Messages'

const transport = new LocalTransport()

// We emulate the wallet side and send a dummy response back
transport.transformer = (message: string) => {
  const serializer = new Serializer()
  const deserialized: any = serializer.deserialize(message)
  
  if (deserialized.type === MessageTypes.PermissionRequest) {
    const response: PermissionResponse = {
      id: deserialized.id,
      type: MessageTypes.PermissionResponse,
      permissions: {
        pubkey: 'dummy',
        networks: ['mainnet'],
        scopes: deserialized.scope,
      }
    }
    return serializer.serialize(response)
  }

  return message
}

const client = new DAppClient('DApp')
client
  .init(transport)
  .then(() => {
    client
      .requestPermissions()
      .then(permissions => {
        console.log('got permissions', permissions)
      })
      .catch(error => console.log(error))
  })
  .catch(error => console.error(error))
