import { DAppClient } from '../src/client/clients/DappClient'

import { LocalTransport } from '../src/client/transports/LocalTransport'

const transport = new LocalTransport()
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
