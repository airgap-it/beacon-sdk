/* global BigInt */
import { BeaconEvent } from '@airgap/beacon-sdk'
import { Certificate, requestIdOf } from '@dfinity/agent'
import { Ed25519PublicKey, unwrapDER } from '@dfinity/identity'
import { Secp256k1PublicKey } from '@dfinity/identity-secp256k1'
import { Principal } from '@dfinity/principal'
import { createHash, randomBytes } from 'crypto-browserify'
import { ec as EC } from 'elliptic'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { callQuery, rootKey } from './agent'
import { BalanceArgs, BalanceResult, idlDecode, idlEncode, TransferArgs, TransferResult } from './idl'

import './App.css'
import { createDAppClient, publicKeyFromAccount } from './beacon'

const MAIN_CHAIN_ID = 'icp:737ba355e855bd4b61279056603e0550'
const ICRC21_CANISTER_ID = 'xhy27-fqaaa-aaaao-a2hlq-cai'

const ICRC21_TRANSFER_FEE = BigInt(1)

function App() {
  const client = useMemo(() => createDAppClient(), [])

  const [activeAccount, setActiveAccount] = useState(undefined)
  const [balance, setBalance] = useState(undefined)
  const [recipient, setRecipient] = useState(undefined)
  const [amount, setAmount] = useState(undefined)
  const [sendResult, setSendResult] = useState(undefined)

  useEffect(() => {
    const setInitialActiveAccount = async () => {
      const activeAccount = await client.getActiveAccount()
      setActiveAccount(activeAccount)
    }

    setInitialActiveAccount()
    
    client.subscribeToEvent(BeaconEvent.ACTIVE_ACCOUNT_SET, async () => {
      const activeAccount = await client.getActiveAccount()
      setActiveAccount(activeAccount)
    })
  }, [client])

  const fetchBalance = useCallback(async () => {
    try {
      const queryResponse = await callQuery(ICRC21_CANISTER_ID, 'balance_of', idlEncode([BalanceArgs], [{
        account: Principal.selfAuthenticating(publicKeyFromAccount(activeAccount))
      }]))

      const balance = idlDecode([BalanceResult], queryResponse)[0]
      if (balance.Err) {
        throw balance.Err
      }

      setBalance({
        owner: balance.Ok.owner.toString(),
        deposit: balance.Ok.deposit.toString()
      })
    } catch (error) {
      console.error('fetchBalance error', error)
    }
  }, [activeAccount])

  useEffect(() => {
    if (activeAccount) {
      fetchBalance()
    }
  }, [activeAccount, fetchBalance])

  const verifyPermissionResponse = async (response, challenge) => {
    const derPublicKey = Buffer.from(response.result.identities[0].publicKey, 'base64')
    const secp256k1PublicKey = (publicKey) => {
      try {
        return {
          curve: 'secp256k1',
          raw: Secp256k1PublicKey.fromDer(publicKey).toRaw()
        }
      } catch {
        return undefined
      }
    }
    const ed25519PublicKey = (publicKey) => {
      try {
        return {
          curve: 'ed25519',
          raw: Ed25519PublicKey.fromDer(publicKey).toRaw()
        }
      } catch {
        return undefined
      }
    }
    const p256PublicKey = (publicKey) => {
      const ECDSA_P256_OID = Uint8Array.from([
        ...[0x30, 0x13], // SEQUENCE
        ...[0x06, 0x07], // OID with 7 bytes
        ...[0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01], // OID ECDSA
        ...[0x06, 0x08], // OID with 8 bytes
        ...[0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07], // OID P-256
      ]);

      try {
        return {
          curve: 'p256',
          raw: unwrapDER(publicKey, ECDSA_P256_OID)
        }
      } catch {
        return undefined
      }
    }

    const publicKey = secp256k1PublicKey(derPublicKey) ?? ed25519PublicKey(derPublicKey) ?? p256PublicKey(derPublicKey)
    if (publicKey === undefined) {
      throw new Error('Public key not supported')
    }

    const signatureRaw = Buffer.from(response.result.signature, 'base64')
    const dataRaw = Buffer.concat([
      Buffer.from(new TextEncoder().encode('\x0Aic-wallet-challenge')), 
      challenge
    ])

    let signature
    let data
    // eslint-disable-next-line default-case
    switch (publicKey.curve) {
      case 'secp256k1':
      case 'p256':
        signature = { r: signatureRaw.subarray(0, 32), s: signatureRaw.subarray(32) }
        const hash = createHash('sha256')
        hash.update(dataRaw)
        data = hash.digest()
        break
      case 'ed25519':
        signature = signatureRaw
        data = dataRaw
        break
    }

    const ec = new EC(publicKey.curve)
    const verified = ec.verify(data, signature, publicKey.raw, 'hex')
    if (!verified) {
      throw new Error('Invalid signature')
    }

    console.log('challenge verified')
  }

  const verifyContentMap = (sender, canisterId, method, arg, contentMap) => {
    if (sender.compareTo(contentMap.sender) !== 'eq') {
      throw new Error(`Invalid content map, senders don't match (${sender.toText()} != ${contentMap.sender.toText()})`)
    }

    if (canisterId !== contentMap.canister_id.toText()) {
      throw new Error(`Invalid content map, canister IDs don't match (${canisterId} != ${contentMap.canister_id.toText()})`)
    }

    if (method !== contentMap.method_name) {
      throw new Error(`Invalid content map, method names don't match (${method} != ${contentMap.method_name})`)
    }

    if (Buffer.from(arg).toString('hex') !== contentMap.arg.toString('hex')) {
      throw new Error(`Invalid content map, args don't match (${arg.toString('hex')} != ${contentMap.arg.toString('hex')})`)
    }

    console.log('content map verified')
  }

  const requestPermission = async () => {
    setSendResult(undefined)

    try {
      const challenge = randomBytes(32)
      const response = await client.ic.requestPermissions({
        version: '1',
        appMetadata: {
          name: client.name,
          url: client.appUrl,
        },
        networks: [{ chainId: MAIN_CHAIN_ID }],
        scopes: ['canister_call'],
        challenge: Buffer.from(challenge).toString('base64')
      })

      await verifyPermissionResponse(response, challenge)

      console.log('requestPermissions success', response)
    } catch (error) {
      setActiveAccount(undefined)
      console.error('requestPermissions error', error)
    }
  }

  const onRecipientInput = (event) => {
    setRecipient(event.target.value)
  }

  const onAmountInput = (event) => {
    setAmount(event.target.value)
  }

  const contentMapFromResponse = (response) => {
    return {
      request_type: response.result.contentMap.request_type,
      sender: Principal.fromUint8Array(Buffer.from(response.result.contentMap.sender, 'base64')),
      nonce: response.result.contentMap.nonce ? Buffer.from(response.result.contentMap.nonce, 'base64') : undefined,
      ingress_expiry: BigInt(response.result.contentMap.ingress_expiry),
      canister_id: Principal.fromUint8Array(Buffer.from(response.result.contentMap.canister_id, 'base64')),
      method_name: response.result.contentMap.method_name,
      arg: Buffer.from(response.result.contentMap.arg, 'base64')
    }
  }

  const certificateFromResponse = async (response) => {
    return Certificate.create({
      certificate: Buffer.from(response.result.certificate, 'base64'),
      rootKey: await rootKey(),
      canisterId: Principal.fromUint8Array(Buffer.from(response.result.contentMap.canister_id, 'base64'))
    })
  }

  const send = async () => {
    setSendResult(undefined)

    const canisterId = ICRC21_CANISTER_ID
    const method = 'transfer'

    try {
      const sender = Principal.selfAuthenticating(publicKeyFromAccount(activeAccount))
      const arg = idlEncode([TransferArgs], [{
        from_subaccount: [],
        to: {
          owner: Principal.from(recipient),
          subaccount: []
        },
        amount: BigInt(amount)
      }])

      const response = await client.ic.requestCanisterCall({
        version: '1',
        network: { chainId: MAIN_CHAIN_ID },
        canisterId,
        sender: sender.toText(),
        method,
        arg: Buffer.from(arg).toString('base64')
      })
      console.log('requestCanisterCall `transfer` response', response)
      
      const contentMap = contentMapFromResponse(response)
      verifyContentMap(sender, canisterId, method, arg, contentMap)

      const requestId = requestIdOf(contentMap)
      const certificate = await certificateFromResponse(response)
      const path = [new TextEncoder().encode('request_status'), requestId]
      const result = idlDecode([TransferResult], certificate.lookup([...path, 'reply']))[0]

      console.log('requestCanisterCall `transfer` success')

      setSendResult(JSON.parse(JSON.stringify(result, (_, value) => typeof value === 'bigint' ? value.toString() : value, 2)))
      fetchBalance()
    } catch (error) {
      console.error(`requestCanisterCall ${method} error`, error)
    }
  }

  const reset = () => {
    client.destroy().then(() => {
      window.location.reload()
    })
  }

  return (
    <div className="App">
      ICRC-25 Example DApp
      <br /><br />
      <button onClick={requestPermission}>Request Permission</button>
      <br /><br />
      <div>
        Active account:
        <br />
        <span>{activeAccount ? Principal.selfAuthenticating(publicKeyFromAccount(activeAccount)).toText() : ''}</span>
        <span>{activeAccount?.chainData.identities[0].ledger?.subaccounts[0]}</span>
        {/* <span>{activeAccount?.network.type}</span> */}
        <span>{activeAccount?.origin.type}</span>
      </div>
      <br />
      {activeAccount && (
        <>
          <div>Balance: {balance ? (
            BigInt(balance.owner) > 0 ? `${balance.deposit} DEV (To Deposit: ${BigInt(balance.owner) - ICRC21_TRANSFER_FEE} DEV)` : `${balance.deposit} DEV`
          ) : '---'}</div>  
          <br />
          <button onClick={fetchBalance}>Fetch Balance</button>
          <br />
          ---
          <br /><br />
          Transfer
          <br /><br />
          <input type="text" placeholder='to (principal)' onChange={onRecipientInput}></input>
          <input type="text" placeholder='amount' onChange={onAmountInput}></input>
          <button onClick={send}>Send</button>
          {sendResult && <div className='multiline'>{JSON.stringify(sendResult, null, 2)}</div>}
          <br /><br />
        </>
      )}
      ---
      <br /><br />
      <button onClick={reset}>Reset and Refresh</button>
    </div>
  );
}

export default App;
