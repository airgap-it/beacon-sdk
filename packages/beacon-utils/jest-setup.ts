import { webcrypto } from 'crypto'

// Polyfill globalThis.crypto for @stablelib/random in Node.js test environment
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = webcrypto as Crypto
}
