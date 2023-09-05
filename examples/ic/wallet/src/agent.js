import { 
  Cbor,
  Certificate, 
  Expiry, 
  IdentityInvalidError, 
  polling, 
  requestIdOf,
  RequestStatusResponseStatus, 
  SubmitRequestType 
} from '@dfinity/agent'
import { Secp256k1KeyIdentity } from '@dfinity/identity-secp256k1'
import { Principal } from '@dfinity/principal'
import { createAgent as _createAgent } from '@dfinity/utils'

const LOCAL_HOST = 'http://127.0.0.1:4943'
const PUBLIC_HOST = 'https://icp-api.io'

export async function createAgent(mnemonic) {
  return _createAgent({ 
    identity: Secp256k1KeyIdentity.fromSeedPhrase(mnemonic),
    host: PUBLIC_HOST,
    fetchRootKey: true
  })
}

export async function query(agent, canisterId, method, arg) {
  return agent.query(canisterId, { methodName: method, arg })
}

export async function callQuery(agent, canisterId, method, arg) {
  const callResponse = await call(agent, canisterId, method, arg)
  const state = await readState(agent, canisterId, callResponse.requestId)

  return state.response
}

export async function call(agent, canisterId, method, arg) {
  const options = {
    methodName: method,
    arg
  }

  const id = await agent._identity
    if (!id) {
      throw new IdentityInvalidError(
        "This identity has expired due this application's security policy. Please refresh your authentication."
      )
    }
    const canister = Principal.from(canisterId)
    const ecid = options.effectiveCanisterId ? Principal.from(options.effectiveCanisterId) : canister

    const sender = id.getPrincipal() || Principal.anonymous()

    const submit = {
      request_type: SubmitRequestType.Call,
      canister_id: canister,
      method_name: options.methodName,
      arg: options.arg,
      sender,
      ingress_expiry: new Expiry(5 * 60 * 1000)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let transformedRequest = (await agent._transform({
      request: {
        body: null,
        method: 'POST',
        headers: {
          'Content-Type': 'application/cbor',
          ...(agent._credentials ? { Authorization: 'Basic ' + btoa(agent._credentials) } : {})
        }
      },
      endpoint: "call",
      body: submit
    }))

    // Apply transform for identity.
    transformedRequest = await id.transformRequest(transformedRequest)

    const body = Cbor.encode(transformedRequest.body)

    // Run both in parallel. The fetch is quite expensive, so we have plenty of time to
    // calculate the requestId locally.
    const [response, requestId] = await Promise.all([
      agent._fetch('' + new URL(`/api/v2/canister/${ecid.toText()}/call`, agent._host), {
        ...transformedRequest.request,
        body
      }),
      requestIdOf(submit)
    ])

    if (!response.ok) {
      throw new Error(
        `Server returned an error:\n` + `  Code: ${response.status} (${response.statusText})\n` + `  Body: ${await response.text()}\n`
      )
    }

    return {
      requestId,
      contentMap: submit,
      response: {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      }
    }
}

export async function readState(agent, canisterId, requestId, strategy = polling.defaultStrategy()) {
  return pollForResponse(agent, Principal.from(canisterId), requestId, strategy)
}

async function pollForResponse(agent, canisterId, requestId, strategy, request) {
  const path = [new TextEncoder().encode('request_status'), requestId]
  const currentRequest = request ?? (await agent.createReadStateRequest?.({ paths: [path] }))
  const state = await agent.readState(canisterId, { paths: [path] }, undefined, currentRequest)
  if (agent.rootKey == null) throw new Error('Agent root key not initialized before polling')
  const cert = await Certificate.create({
    certificate: state.certificate,
    rootKey: agent.rootKey,
    canisterId: canisterId
  })
  const maybeBuf = cert.lookup([...path, new TextEncoder().encode('status')])
  let status
  if (typeof maybeBuf === 'undefined') {
    // Missing requestId means we need to wait
    status = RequestStatusResponseStatus.Unknown
  } else {
    status = new TextDecoder().decode(maybeBuf)
  }

  // eslint-disable-next-line default-case
  switch (status) {
    case RequestStatusResponseStatus.Replied: {
      return { 
        response: cert.lookup([...path, 'reply']),
        certificate: state.certificate
      }
    }

    case RequestStatusResponseStatus.Received:
    case RequestStatusResponseStatus.Unknown:
    case RequestStatusResponseStatus.Processing:
      // Execute the polling strategy, then retry.
      await strategy(canisterId, requestId, status)
      return pollForResponse(agent, canisterId, requestId, strategy, currentRequest)

    case RequestStatusResponseStatus.Rejected: {
      const rejectCode = new Uint8Array(cert.lookup([...path, 'reject_code']))[0]
      const rejectMessage = new TextDecoder().decode(cert.lookup([...path, 'reject_message']))
      throw new Error(
        `Call was rejected:\n` +
          `  Request ID: ${Buffer.from(requestId).toString('hex')}\n` +
          `  Reject code: ${rejectCode}\n` +
          `  Reject text: ${rejectMessage}\n`
      )
    }

    case RequestStatusResponseStatus.Done:
      // This is _technically_ not an error, but we still didn't see the `Replied` status so
      // we don't know the result and cannot decode it.
      throw new Error(`Call was marked as done but we never saw the reply:\n` + `  Request ID: ${Buffer.from(requestId).toString('hex')}\n`)
  }
  throw new Error('unreachable')
}