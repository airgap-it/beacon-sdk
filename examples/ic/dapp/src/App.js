/* global BigInt */
import { BeaconEvent, getDAppClientInstance, ICBlockchain, Regions } from '@airgap/beacon-sdk';
import { AnonymousIdentity, Certificate, requestIdOf } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { createAgent } from '@dfinity/utils';
import { randomBytes } from 'crypto-browserify';
import { useEffect, useMemo, useState } from 'react';

import { idlDecode, idlEncode, TransferArgs, TransferResult } from './idl';

import './App.css';

const MAINNET_CHAIN_ID = 'icp:737ba355e855bd4b61279056603e0550'
const HOST = 'http://127.0.0.1:4943'
const TEST_CANISTER_ID = 'bkyz2-fmaaa-aaaaa-qaaaq-cai'

function App() {
  const client = useMemo(() => {
    const client = getDAppClientInstance({
      name: 'Example DApp', // Name of the DApp,
      disclaimerText: 'This is an optional <b>disclaimer</b>.',
      appUrl: 'http://localhost:3000',
      matrixNodes: {
        [Regions.EUROPE_WEST]: [
          'beacon-node-1.diamond.papers.tech',
          'beacon-node-1.sky.papers.tech',
          'beacon-node-2.sky.papers.tech',
          'beacon-node-1.hope.papers.tech',
          'beacon-node-1.hope-2.papers.tech',
          'beacon-node-1.hope-3.papers.tech',
          'beacon-node-1.hope-4.papers.tech',
          'beacon-node-1.hope-5.papers.tech'
        ],
        [Regions.NORTH_AMERICA_EAST]: []
      }
    })

    const icBlockchain = new ICBlockchain()
    client.addBlockchain(icBlockchain)

    return client
  }, [])

  const [activeAccount, setActiveAccount] = useState(undefined)
  const [recipient, setRecipient] = useState(undefined)
  const [sendResult, setSendResult] = useState(undefined)

  useEffect(() => {
    const setInitialActiveAccount = async () => {
      const activeAccount = await client.getActiveAccount()
      setActiveAccount(activeAccount)
    }

    setInitialActiveAccount()
    
    client.subscribeToEvent(BeaconEvent.ACTIVE_ACCOUNT_SET, async () => {
      const activeAccount = await client.getActiveAccount()
      console.log('activeAccount', activeAccount)
      setActiveAccount(activeAccount)
    })
  }, [client])

  const verifyPermissionResponse = async (response) => {
    // TODO
  }

  const requestPermission = () => {
    const challenge = randomBytes(32)

    client.ic
      .requestPermissions({
        networks: [{ chainId: MAINNET_CHAIN_ID }],
        scopes: ['canister_call'],
        challenge: Buffer.from(challenge).toString('base64')
      })
      .then((response) => {
        console.log('requestPermissions success', response)
        verifyPermissionResponse(response)
      })
      .catch((error) => {
        console.log('requestPermissions error', error)
      })
  }

  const onRecipientInput = (event) => {
    setRecipient(event.target.value)
  }

  const send = () => {
    setSendResult(undefined)
    const canisterId = TEST_CANISTER_ID
    const args = idlEncode([TransferArgs], [{
      from_subaccount: [],
      to: {
        owner: Principal.from(recipient),
        subaccount: []
      },
      amount: 1000
    }])

    client.ic.requestCanisterCall({
      network: { chainId: MAINNET_CHAIN_ID },
      canisterId,
      sender: Principal.selfAuthenticating(Buffer.from(activeAccount.chainData.identity.publicKey, 'base64')).toText(),
      method: 'transfer',
      arg: Buffer.from(args).toString('base64')
    })
    .then(async (response) => {
      console.log('requestCanisterCall `transfer` success', response)
      const agent = await createAgent({
        identity: new AnonymousIdentity(),
        host: HOST,
        fetchRootKey: true
      })
      const requestId = requestIdOf({
        request_type: response.result.contentMap.request_type,
        sender: Principal.fromUint8Array(Buffer.from(response.result.contentMap.sender, 'base64')),
        nonce: response.result.contentMap.nonce ? Buffer.from(response.result.contentMap.nonce, 'base64') : undefined,
        ingress_expiry: BigInt(response.result.contentMap.ingress_expiry),
        canister_id: Principal.fromUint8Array(Buffer.from(response.result.contentMap.canister_id, 'base64')),
        method_name: response.result.contentMap.method_name,
        arg: Buffer.from(response.result.contentMap.arg, 'base64')
      })
      const certificate = await Certificate.create({
        certificate: Buffer.from(response.result.certificate, 'base64'),
        rootKey: agent.rootKey,
        canisterId: Principal.from(canisterId)
      })
      const path = [new TextEncoder().encode('request_status'), requestId]
      const result = idlDecode([TransferResult], certificate.lookup([...path, 'reply']))[0]
      setSendResult(JSON.stringify(result, (_, value) => typeof value === 'bigint' ? value.toString() : value, 2))
    })
    .catch((error) => {
      console.log('requestCanisterCall `transfer` error', error)
    })
  }

  const reset = () => {
    client.destroy().then(() => {
      window.location.reload()
    })
  }

  return (
    <div className="App">
      Beacon Example
      <br /><br />
      <span>
        Active account:
        <br />
        <span>{activeAccount ? Principal.selfAuthenticating(Buffer.from(activeAccount.chainData.identity.publicKey, 'base64')).toText() : ''}</span>
        <span>{activeAccount?.chainData.identity.ledger?.subaccount}</span>
        {/* <span>{activeAccount?.network.type}</span> */}
        <span>{activeAccount?.origin.type}</span>
      </span>
      <br /><br />
      <button onClick={requestPermission}>Request Permission</button>
      <br /><br />
      <button onClick={reset}>Reset and Refresh</button>
      <br /><br />
      {activeAccount && (
        <>
          <input type="text" onChange={onRecipientInput}></input>
          <button onClick={send}>Send 1000 DEV</button>
          {sendResult && <div>{sendResult}</div>}
          <br /><br />
        </>
      )}
    </div>
  );
}

export default App;
