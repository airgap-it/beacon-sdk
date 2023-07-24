import { BeaconErrorType, BeaconMessageType, Serializer, WalletClient } from '@airgap/beacon-sdk';
import { Secp256k1KeyIdentity } from '@dfinity/identity-secp256k1'
import { encodeIcrcAccount } from '@dfinity/ledger';
import { useState } from 'react';

import './App.css';

const client = new WalletClient({
  name: 'Example Wallet'
})

function App() {
  const [account, setAccount] = useState(undefined)
  const [mnemonic, setMnemonic] = useState('')
  const [status, setStatus] = useState('')
  
  const onPermissionRequest = async (request) => {
    if (request.message.blockchainIdentifier !== 'ic') {
      throw new Error('Only IC supported')
    }
    // Show a UI to the user where he can confirm sharing an account with the DApp

    const response = {
      id: request.id,
      message: {
        blockchainIdentifier: 'ic',
        type: BeaconMessageType.PermissionResponse,
        blockchainData: {
          type: 'permission_response',
          networks: request.message.blockchainData.networks,
          scopes: request.message.blockchainData.scopes,
          account: {
            owner: account.owner,
            subaccount: account.subaccount
          }
        }
      }
    }

    // Let's wait a little to make it more natural (to test the UI on the dApp side)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Send response back to DApp
    client.respond(response)
  } 

  client.init().then(() => {
    console.log('init')
    client
      .connect(async (message) => {
        setStatus('Handling request...')

        console.log('message', message)
        // Example: Handle PermissionRequest. A wallet should handle all request types
        if (message.message.type === BeaconMessageType.PermissionRequest) {
          await onPermissionRequest(message)
        } else {
          console.error('Message type not supported, received: ', message)
      
          const response = {
            type: BeaconMessageType.Error,
            id: message.id,
            errorType: BeaconErrorType.ABORTED_ERROR
          }
          client.respond(response)
        }

        setStatus('')
      })
      .catch((error) => console.error('connect error', error))
  }) // Establish P2P connection


  const onMnemonicInput = (event) => {
    setMnemonic(event.target.value)
  }

  const importAccount = async () => {
    const identity = Secp256k1KeyIdentity.fromSeedPhrase(mnemonic)
    const principal = identity.getPrincipal()

    setAccount({
      address: encodeIcrcAccount({ owner: principal }),
      owner: principal.toText(),
      subaccount: undefined
    })
  }

  const pasteSyncCode = async () => {
    const syncCode = await navigator.clipboard.readText()
    try {
      const serializer = new Serializer()
      const peer = await serializer.deserialize(syncCode)
      console.log('Adding peer', peer)
      setStatus('Connecting...')
      await client.addPeer(peer)
      setStatus('Connected')
      console.log('Peer added')
    } catch (error) {
      console.error('pasteSyncCode error', error)
      setStatus('not a valid sync code: ' + syncCode)
    }
  }

  const removePeer = () => {
    client.getPeers().then((peers) => {
      if (peers.length > 0) {
        client.removePeer(peers[0], true).then(() => {
          console.log('peer removed', peers[0])
        })
      } else {
        console.log('no peers to be removed')
      }
    })
  }

  const reset = () => {
    client.destroy().then(() => {
      window.location.reload()
    })
  }

  return (
    <div className="App">
      Beacon Example Wallet
      <br /><br />
      {account
        ? (
            <>
              <div>Account: {account.address}</div>
              {status ? <div>Status: {status}</div> : <></>}
              <br /><br />
              <button onClick={pasteSyncCode}>Paste Sync Code</button>
            </>
          )
        : (
          <>
            <textarea onChange={onMnemonicInput}></textarea>
            <button onClick={importAccount}>Import Account</button>
          </>
        )
      }
      <br /><br />
      ---
      <br /><br />
      <button onClick={removePeer}>Remove Peer</button>
      <br /><br />
      ---
      <br /><br />
      <button onClick={reset}>Reset and Refresh</button>
      <br /><br />
    </div>
  );
}

export default App;
