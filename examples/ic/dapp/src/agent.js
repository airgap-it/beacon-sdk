import { AnonymousIdentity, polling } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'
import { createAgent as _createAgent } from '@dfinity/utils'

const LOCAL_HOST = 'http://127.0.0.1:4943'
const PUBLIC_HOST = 'https://icp-api.io'

export async function createAgent() {
  return _createAgent({ 
    identity: new AnonymousIdentity(),
    host: PUBLIC_HOST,
    fetchRootKey: true
  })
}

export async function rootKey() {
  const agent = await createAgent()

  return agent.rootKey
}

export async function callQuery(canisterId, method, arg) {
  const agent = await createAgent()
  const callResponse = await agent.call(canisterId, { methodName: method, arg })

  return polling.pollForResponse(agent, Principal.from(canisterId), callResponse.requestId, polling.defaultStrategy())
}
