import { WalletCommunicationClient } from '../src/index'

import { getStorage } from '../src/client/storage/StorageProvider'

console.log(getStorage().then(storage => {
  console.log(storage)
}))

let QR:
  | {
    pubKey: string
    relayServer: string
  }
  | undefined

function log(...args) {
  console.log('--- [EXAMPLE_APP]: ', ...args)
}

// 1. Independent apps that know nothing about each other
; (async function () {
  const dapp = new WalletCommunicationClient('DAPP', '1', 1, true)
  await dapp.start()
  log('DAPP PubKey', dapp.getPublicKey())
  log('DAPP PubKeyHash', dapp.getPublicKeyHash())
  log('DAPP Relay', dapp.getRelayServer())

  // 2. DApp prepares pubkey as QR
  QR = dapp.getHandshakeInfo()

  // 3. Listen to messages addressed to our PubKey
  dapp.listenForChannelOpening(pubKey => {
    log('GOT PUB KEY FROM NEW WALLET', pubKey)
    // 6. Open regular channel with DApp
    dapp.listenForEncryptedMessage(pubKey, message => {
      log('DAPP gotEncryptedMessage:', message)
    })
    dapp.sendMessage(pubKey, 'CHANNEL SUCCESSFULLY OPENED!')
  })
})()
  ; (async function () {
    const wallet = new WalletCommunicationClient('WALLET', '2', 1, true)
    await wallet.start()

    log('WALLET PubKey', wallet.getPublicKey())
    log('WALLET PubKeyHash', wallet.getPublicKeyHash())
    log('WALLET Relay', wallet.getRelayServer())

    // 4. Scan QR code from DApp
    setTimeout(() => {
      if (!QR) {
        throw new Error('QR not defined')
      }
      log('SCANNING QR: ', QR)

      // 5. Open channel with DApp by sending own PubKey to their PubKey
      wallet.openChannel(QR.pubKey, QR.relayServer) // TODO: Should we have a confirmation here?

      // 6. Open regular channel with DApp
      wallet.listenForEncryptedMessage(QR.pubKey, message => {
        log('WALLET gotEncryptedMessage:', message)
      })

      setTimeout(() => {
        wallet.sendMessage(QR!.pubKey, 'TEST')
      }, 5000)
    }, 5000)
  })()
