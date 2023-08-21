import { BeaconErrorType, BeaconMessageType, Serializer, WalletClient } from '@airgap/beacon-sdk';
import { Secp256k1KeyIdentity } from '@dfinity/identity-secp256k1'
import { encodeIcrcAccount } from '@dfinity/ledger';
import { useState } from 'react';

import './App.css';
import { ConsentMessageRequest, ConsentMessageResponse, idlDecode, idlEncode } from './idl';
import { call, createAgent, readState } from './agent';

const client = new WalletClient({
  name: 'Example Wallet'
})

function App() {
  const [account, setAccount] = useState(undefined)
  const [mnemonic, setMnemonic] = useState('')
  const [status, setStatus] = useState('')
  const [pendingCanisterCallRequest, setPendingCanisterCallRequest] = useState(undefined)
  const [consentMessage, setConsentMessage] = useState(undefined)

  const onPermissionRequest = async (request) => {
    const identity = Secp256k1KeyIdentity.fromSeedPhrase(mnemonic)
    const signature = await identity.sign(Buffer.concat([Buffer.from(new TextEncoder().encode('\x0Aic-wallet-challenge')), Buffer.from(request.params.challenge, 'base64')]))

    const response = {
      networks: request.params.networks,
      scopes: request.params.scopes,
      identity: {
        algorithm: 'secp256k1',
        publicKey: Buffer.from(account.publicKey).toString('base64'),
        ledger: {
          subaccount: account.subaccount
        },
      },
      challenge: request.params.challenge,
      signature: Buffer.from(signature).toString('base64'),
    }

    // Let's wait a little to make it more natural (to test the UI on the dApp side)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Send response back to DApp
    client.ic.respondWithResult(request, response)
  }

  const onCanisterCallRequest = async (request) => {
    const canisterId = request.params.canisterId
    const method = request.params.method
    const arg = request.params.arg

    setPendingCanisterCallRequest(request)

    const agent = await createAgent(mnemonic)
    
    const queryResponse = await agent.query(canisterId, {
      methodName: 'consent_message',
      arg: idlEncode([ConsentMessageRequest], [{
        method,
        arg: Buffer.from(arg, 'base64'),
        consent_preferences: {
          language: 'en'
        }
      }])
    })

    if (queryResponse.status !== 'replied') {
      console.error(queryResponse)
      throw new Error('Canister returned error')
    }

    const consentMessage = idlDecode([ConsentMessageResponse], queryResponse.reply.arg)[0]
    if (!consentMessage.Valid) {
      const error = consentMessage.Forbidden || consentMessage.Malformed
      throw new Error(`(${error.error_code}) ${error.description}`)
    }

    setConsentMessage(consentMessage.Valid.consent_message)
  }

  client.init().then(() => {
    console.log('init')
    client.ic
      .connect(async (message) => {
        setStatus('Handling request...')

        console.log('message', message)
        try {
          if (message.method === 'permission') {
            await onPermissionRequest(message)
          } else if (message.method === 'canister_call') {
            await onCanisterCallRequest(message)
          } else {
            console.error('Message type not supported, received: ', message)
            throw new Error()
          }
        } catch (error) {
          if (error.message) {
            console.error(error)
          }

          client.ic.respondWithError(message, { 
            version: '1',
            errorType: 'ABORTED'
          })
        }

        setStatus('')
      })
  }) // Establish P2P connection


  const onMnemonicInput = (event) => {
    setMnemonic(event.target.value)
  }

  const importAccount = async () => {
    const identity = Secp256k1KeyIdentity.fromSeedPhrase(mnemonic)
    const principal = identity.getPrincipal()

    setAccount({
      address: encodeIcrcAccount({ owner: principal }),
      publicKey: identity.getPublicKey().toDer(),
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

  const acceptCanisterCall = async () => {
    const agent = await createAgent(mnemonic)
    
    const callResponse = await call(agent, pendingCanisterCallRequest.params.canisterId, pendingCanisterCallRequest.params.method, Buffer.from(pendingCanisterCallRequest.params.arg, 'base64'))

    if (!callResponse.response.ok) {
      await client.respondWithError(pendingCanisterCallRequest, { 
        version: '1',
        errorType: 'UNKNOWN'
      })
    } else {
      try {
        const readStateResponse = await readState(agent, pendingCanisterCallRequest.params.canisterId, callResponse.requestId)
        await client.ic.respondWithResult(pendingCanisterCallRequest, {
          version: '1',
          network: pendingCanisterCallRequest.network,
          contentMap: {
            request_type: callResponse.contentMap.request_type,
            sender: Buffer.from(callResponse.contentMap.sender.toUint8Array()).toString('base64'),
            nonce: callResponse.contentMap.nonce ? Buffer.from(callResponse.contentMap.nonce).toString('base64') : undefined,
            ingress_expiry: callResponse.contentMap.ingress_expiry._value.toString(),
            canister_id: Buffer.from(callResponse.contentMap.canister_id.toUint8Array()).toString('base64'),
            method_name: callResponse.contentMap.method_name,
            arg: Buffer.from(callResponse.contentMap.arg).toString('base64'),
          },
          certificate: Buffer.from(readStateResponse.certificate).toString('base64')
        })
      } catch (e) {
        console.error(e)
        await client.ic.respondWithError(pendingCanisterCallRequest, { 
          version: '1',
          errorType: 'UNKNOWN'
        })
      }
    }

    setPendingCanisterCallRequest(undefined)
    setConsentMessage(undefined)
  }

  const rejectCanisterCall = async () => {
    const response = {
      type: BeaconMessageType.Error,
      id: pendingCanisterCallRequest.id,
      errorType: BeaconErrorType.ABORTED_ERROR
    }
    client.respond(response)

    setPendingCanisterCallRequest(undefined)
    setConsentMessage(undefined)
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
      {
        consentMessage && (
          <>
            <div>{consentMessage}</div>
            <br /><br />
            <div>
              <button onClick={acceptCanisterCall}>Ok</button>
              <button onClick={rejectCanisterCall}>Reject</button>
            </div>
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
