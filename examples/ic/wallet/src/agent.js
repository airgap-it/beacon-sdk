import { polling } from '@dfinity/agent';
import { Secp256k1KeyIdentity } from '@dfinity/identity-secp256k1'
import { createAgent as _createAgent } from '@dfinity/utils';

export const createAgent = (mnemonic) => {
  return _createAgent({ 
    identity: Secp256k1KeyIdentity.fromSeedPhrase(mnemonic),
    host: 'http://127.0.0.1:4943',
    fetchRootKey: true
  })
}

export const readState = (agent, canisterId, requestId) => {
  return polling.pollForResponse(agent, canisterId, requestId, polling.defaultStrategy())
}