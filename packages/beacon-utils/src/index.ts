export { keys } from './utils/keys'
export { ExposedPromise, ExposedPromiseStatus } from './utils/exposed-promise'
export {
  getKeypairFromSeed,
  toHex,
  getAddressFromPublicKey,
  decryptCryptoboxPayload,
  encryptCryptoboxPayload,
  getHexHash,
  sealCryptobox,
  openCryptobox,
  recipientString,
  signMessage,
  isValidAddress,
  prefixPublicKey,
  encodePoeChallengePayload
} from './utils/crypto'
export { generateGUID } from './utils/generate-uuid'

export const CONTRACT_PREFIX = 'KT1'
export const secretbox_NONCEBYTES = 24 // crypto_secretbox_NONCEBYTES
export const secretbox_MACBYTES = 16 // crypto_secretbox_MACBYTES
