import { Client } from './src/client/Client'
import { MessageTypes } from './src/client/Messages'

const dapp = new Client('DAPP')
const wallet = new Client('WALLET')
wallet.addListener(MessageTypes.PermissionRequest, (data, callback) => {
  console.log('REQUEST!', data)
  setTimeout(() => {
    callback({
      id: '1',
      type: MessageTypes.PermissionResponse,
      address: 'tz1',
      networks: 'mainnet',
      permissions: ['read_address']
    })
  }, 2000)
})
dapp
  .requestPermissions({
    id: '1',
    type: MessageTypes.PermissionRequest,
    scope: ['read_address']
  })
  .then(result => {
    console.log('GOT RESULT', result)
  })
