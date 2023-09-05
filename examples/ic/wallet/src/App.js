/* global BigInt */
import { Serializer } from '@airgap/beacon-sdk'
import { Secp256k1KeyIdentity } from '@dfinity/identity-secp256k1'
import { Principal } from '@dfinity/principal'
import { principalToSubAccount } from '@dfinity/utils'
import { useCallback, useEffect, useMemo, useState } from 'react'

import './App.css';
import { call, callQuery, createAgent, query, readState } from './agent';
import { createWalletClient } from './beacon'
import { BalanceArgs, BalanceResult, ConsentMessageRequest, ConsentMessageResponse, ICRC1TransferArgs, ICRC1TransferResult, MintArgs, MintResult, idlDecode, idlEncode } from './idl';

const LEDGER_CANISTER_ID = 'wkw6r-kyaaa-aaaao-a2hma-cai'
const ICRC21_CANISTER_ID = 'xhy27-fqaaa-aaaao-a2hlq-cai'

const ICRC21_TRANSFER_FEE = BigInt(1)

function App() {
  const client = useMemo(() => createWalletClient(), [])

  const [account, setAccount] = useState(undefined)
  const [balance, setBalance] = useState(undefined)
  const [mnemonic, setMnemonic] = useState('already alone man elite catalog affair friend mammal cash average idea wet')
  const [status, setStatus] = useState('')
  const [syncCode, setSyncCode] = useState(undefined)
  const [pendingPermissionRequest, setPendingPermissionRequest] = useState(undefined)
  const [pendingCanisterCallRequest, setPendingCanisterCallRequest] = useState(undefined)
  const [consentMessage, setConsentMessage] = useState(undefined)

  const onPermissionRequest = useCallback(async (request) => {
    setPendingPermissionRequest(request)
  }, [])

  const onCanisterCallRequest = useCallback(async (request) => {
    const canisterId = request.params.canisterId
    const method = request.params.method
    const arg = request.params.arg

    setPendingCanisterCallRequest(request)
    setStatus('Fetching consent message...')

    const agent = await createAgent(mnemonic)
    const queryResponse = await query(agent, canisterId, 'consent_message', idlEncode([ConsentMessageRequest], [{
      method,
      arg: Buffer.from(arg, 'base64'),
      consent_preferences: {
        language: 'en'
      }
    }]))

    setStatus('')

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
  }, [mnemonic])

  useEffect(() => {
    client.init().then(() => {
      client.ic
        .connect(async (message) => {
          setStatus('Handling request...')

          console.log('request', message)
  
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
    })
  }, [client, onPermissionRequest, onCanisterCallRequest])

  const onMnemonicInput = (event) => {
    setMnemonic(event.target.value)
  }

  const onSyncCodeInput = (event) => {
    setSyncCode(event.target.value)
  }

  const importAccount = async () => {
    const identity = Secp256k1KeyIdentity.fromSeedPhrase(mnemonic)
    const principal = identity.getPrincipal()

    setAccount({
      publicKey: identity.getPublicKey().toDer(),
      principal: principal.toText()
    })
  }

  const fetchBalance = useCallback(async () => {
    try {
      setStatus('Fetching the balance...')
      const agent = await createAgent(mnemonic)
      const queryResponse = await callQuery(agent, ICRC21_CANISTER_ID, 'balance_of', idlEncode([BalanceArgs], [{
        account: Principal.from(account.principal)
      }]))

      const balance = idlDecode([BalanceResult], queryResponse)[0]
      if (balance.Err) {
        throw balance.Err
      }

      setStatus('')
      setBalance({
        owner: balance.Ok.owner.toString(),
        deposit: balance.Ok.deposit.toString()
      })
    } catch (error) {
      console.error('fetchBalance error', error)
      setStatus('Failed to fetch the balance')
    }
  }, [mnemonic, account])

  useEffect(() => {
    if (account) {
      fetchBalance()
    }
  }, [mnemonic, account, fetchBalance])

  const deposit = async (amount) => {
    const fee = ICRC21_TRANSFER_FEE
    amount = typeof amount === 'bigint' ? amount : BigInt(balance.owner) - fee

    setStatus(`Depositing ${amount.toString()} DEV...`)
    
    const agent = await createAgent(mnemonic)
    const depositCallResponse = await call(agent, LEDGER_CANISTER_ID, 'icrc1_transfer', idlEncode([ICRC1TransferArgs], [{
      from_subaccount: [],
      to: {
        owner: Principal.from(ICRC21_CANISTER_ID),
        subaccount: [principalToSubAccount(Principal.from(account.principal))]
      },
      amount: amount,
      fee: [fee],
      memo: [],
      created_at_time: []
    }]))

    const depositState = await readState(agent, LEDGER_CANISTER_ID, depositCallResponse.requestId)
    const depositResult = idlDecode([ICRC1TransferResult], depositState.response)[0]
    
    if (depositResult.Err) {
      setStatus('Deposit failed')
      console.error(depositResult.Err)
      return
    }

    setStatus('')

    if (depositResult.Ok) {
      fetchBalance()
    }
  }

  const mint = async () => {
    setStatus('Minting 1,000 DEV...')
    const fee = ICRC21_TRANSFER_FEE
    const amount = BigInt(1_000)

    const agent = await createAgent(mnemonic)
    const mintCallResponse = await call(agent, ICRC21_CANISTER_ID, 'mint', idlEncode([MintArgs], [{
      amount: amount + fee
    }]))
    const mintState = await readState(agent, ICRC21_CANISTER_ID, mintCallResponse.requestId)
    const mintResult = idlDecode([MintResult], mintState.response)[0]
    
    if (mintResult.Err) {
      setStatus('Minting failed')
      console.error(mintResult.Err)
      return
    }

    await deposit(amount)
  }

  const connect = async () => {
    const _syncCode = syncCode ?? await navigator.clipboard.readText()
    try {
      const serializer = new Serializer()
      const peer = await serializer.deserialize(_syncCode)
      setStatus('Connecting...')
      await client.addPeer(peer)
      setStatus('Connected')
    } catch (error) {
      console.error('pasteSyncCode error', error)
      setStatus('Not a valid sync code: ' + _syncCode)
    } finally {
      setSyncCode('')
    }
  }

  const acceptPermissionRequest = async () => {
    const identity = Secp256k1KeyIdentity.fromSeedPhrase(mnemonic)
    const signature = await identity.sign(Buffer.concat([
      Buffer.from(new TextEncoder().encode('\x0Aic-wallet-challenge')), 
      Buffer.from(pendingPermissionRequest.params.challenge, 'base64')
    ]))

    const response = {
      version: pendingPermissionRequest.params.version,
      appMetadata: {
        name: client.name
      },
      networks: pendingPermissionRequest.params.networks,
      scopes: pendingPermissionRequest.params.scopes,
      identities: [{
        publicKey: Buffer.from(account.publicKey).toString('base64')
      }],
      signature: Buffer.from(signature).toString('base64'),
    }

    // Let's wait a little to make it more natural (to test the UI on the dapp side)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    await client.ic.respondWithResult(pendingPermissionRequest, response)
    setPendingPermissionRequest(undefined)
  }

  const rejectPermissionRequest = async () => {
    client.ic.respondWithError(pendingPermissionRequest, {
      version: '1',
      errorType: 'ABORTED'
    })

    setPendingPermissionRequest(undefined)
  }

  const acceptCanisterCall = async () => {
    setStatus('Executing canister call...')

    const agent = await createAgent(mnemonic)
    const callResponse = await call(
      agent, 
      pendingCanisterCallRequest.params.canisterId, 
      pendingCanisterCallRequest.params.method, 
      Buffer.from(pendingCanisterCallRequest.params.arg, 'base64')
    )

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

    setStatus('')
    setPendingCanisterCallRequest(undefined)
    setConsentMessage(undefined)
    fetchBalance()
  }

  const rejectCanisterCall = async () => {
    client.ic.respondWithError(pendingCanisterCallRequest, {
      version: '1',
      errorType: 'ABORTED'
    })

    setPendingCanisterCallRequest(undefined)
    setConsentMessage(undefined)
  }

  const reset = () => {
    client.destroy().then(() => {
      window.location.reload()
    })
  }

  return (
    <div className="App">
      ICRC-25 Example Wallet
      <br /><br />
      {account
        ? (
            <>
              {navigator.clipboard.readText ? <button onClick={connect}>Paste Sync Code</button> : (
                <>
                  <textarea onChange={onSyncCodeInput} placeholder='Sync Code' value={syncCode}></textarea>
                  <button onClick={connect}>Connect</button>
                </>
              )}
              <br /><br />
              {status && <div>Status: {status}</div>}
              <br />
              <div>
                Account:
                <br />
                <span>{account.principal}</span>
                <span>{account.subaccount}</span>
              </div>
              <br />
              <div>Balance: {balance ? (
                BigInt(balance.owner) > 0 ? `${balance.deposit} DEV (To Deposit: ${BigInt(balance.owner) - ICRC21_TRANSFER_FEE} DEV)` : `${balance.deposit} DEV`
              ) : '---'}</div>  
              <br />
              <button onClick={fetchBalance}>Fetch Balance</button>
              <br />
              <button onClick={mint}>Mint 1,000 DEV</button>
              {balance && BigInt(balance.owner) > 0 && (
                <>
                  <br />
                  <button onClick={deposit}>Deposit</button>
                </>
              )}
              <br />
            </>
          )
        : (
          <>
            Import Account
            <br /><br />
            <textarea onChange={onMnemonicInput} placeholder='BIP-39 mnemonic' defaultValue={mnemonic}></textarea>
            <button onClick={importAccount}>Import Account</button>
            <br />
          </>
        )
      }
      {
        pendingPermissionRequest && (
          <>
            ---
            <br /><br />
            Permission Request
            <div className='multiline'>{JSON.stringify(pendingPermissionRequest, null, 2)}</div>
            <br />
            <div>
              <button onClick={acceptPermissionRequest}>Ok</button>
              <button onClick={rejectPermissionRequest}>Reject</button>
            </div>
            <br />
          </>
        )
      }
      {
        consentMessage && (
          <>
            ---
            <br /><br />
            Canister Call
            <div>{consentMessage}</div>
            <br />
            <div>
              <button onClick={acceptCanisterCall}>Ok</button>
              <button onClick={rejectCanisterCall}>Reject</button>
            </div>
            <br />
          </>
        )
      }
      ---
      <br /><br />
      <button onClick={reset}>Reset and Refresh</button>
      <br /><br />
    </div>
  );
}

export default App;
