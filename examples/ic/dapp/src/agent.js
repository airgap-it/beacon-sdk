import { AnonymousIdentity, polling } from '@dfinity/agent'
import { createAgent as _createAgent } from '@dfinity/utils'

export async function createAgent() {
  return _createAgent({ 
    identity: new AnonymousIdentity(),
    host: 'http://127.0.0.1:4943',
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

  return polling.pollForResponse(agent, canisterId, callResponse.requestId, polling.defaultStrategy())
}
