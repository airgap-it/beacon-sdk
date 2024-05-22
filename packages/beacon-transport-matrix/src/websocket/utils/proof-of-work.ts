import { type Crypto } from '../crypto'

export function verifyDifficulty(data: Uint8Array, difficulty: Uint8Array): boolean {
  if (data.length < difficulty.length) {
    return false
  }

  for (let i = 0; i < difficulty.length; i += 1) {
    if (data[i]! > difficulty[i]!) {
      return false
    }
  }

  return true
}

export function proofOfWork(crypto: Crypto, payload: Uint8Array, difficulty: Uint8Array): Uint8Array {
  while (true) {
    const nonce: Uint8Array = crypto.getRandomValues(16)
    const difficultyHash = crypto.sha256(Buffer.concat([payload, nonce]))

    if (verifyDifficulty(difficultyHash, difficulty)) {
      return nonce
    }
  }
}
