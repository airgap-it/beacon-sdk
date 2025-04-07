// __tests__/validators/StorageValidator.test.ts

import { StorageValidator } from '../../src/storage/StorageValidator'
import { StorageKey } from '@airgap/beacon-types'

describe('StorageValidator', () => {
  let storageMock: any // { get: jest.Mock } type
  let validator: StorageValidator

  // Define a set of valid values for each key expected by the validator.
  const validValues: Record<string, any> = {
    [StorageKey.BEACON_SDK_VERSION]: '1.0.0', // Expected 'str'
    [StorageKey.MATRIX_SELECTED_NODE]: 'node', // Expected 'str'
    [StorageKey.MULTI_NODE_SETUP_DONE]: true, // Expected 'bol'
    [StorageKey.TRANSPORT_P2P_PEERS_DAPP]: [], // Expected 'arr'
    [StorageKey.TRANSPORT_P2P_PEERS_WALLET]: [], // Expected 'arr'
    [StorageKey.TRANSPORT_POSTMESSAGE_PEERS_DAPP]: [], // Expected 'arr'
    [StorageKey.TRANSPORT_POSTMESSAGE_PEERS_WALLET]: [], // Expected 'arr'
    [StorageKey.TRANSPORT_WALLETCONNECT_PEERS_DAPP]: [], // Expected 'arr'
    [StorageKey.ACCOUNTS]: [], // Expected 'arr'
    [StorageKey.APP_METADATA_LIST]: [], // Expected 'arr'
    [StorageKey.PERMISSION_LIST]: [], // Expected 'arr'
    [StorageKey.ACTIVE_ACCOUNT]: 'active', // Expected 'str'
    [StorageKey.LAST_SELECTED_WALLET]: { key: 'someKey' } // Expected 'obj' with property "key"
  }

  beforeEach(() => {
    // Create a fake storage with a get method that returns valid values.
    storageMock = {
      get: jest.fn((key: string) => Promise.resolve(validValues[key]))
    }
    validator = new StorageValidator(storageMock)
  })

  it('should return true when all validations pass', async () => {
    const result = await validator.validate()
    expect(result).toBe(true)
  })

  it('should return false when BEACON_SDK_VERSION is invalid', async () => {
    storageMock.get.mockImplementation((key: string) => {
      if (key === StorageKey.BEACON_SDK_VERSION) return Promise.resolve(123) // invalid: number instead of string
      return Promise.resolve(validValues[key])
    })
    const result = await validator.validate()
    expect(result).toBe(false)
  })

  it('should return false when MATRIX_SELECTED_NODE is invalid', async () => {
    storageMock.get.mockImplementation((key: string) => {
      if (key === StorageKey.MATRIX_SELECTED_NODE) return Promise.resolve({}) // invalid: not a string
      return Promise.resolve(validValues[key])
    })
    const result = await validator.validate()
    expect(result).toBe(false)
  })

  it('should return false when MULTI_NODE_SETUP_DONE is invalid', async () => {
    storageMock.get.mockImplementation((key: string) => {
      if (key === StorageKey.MULTI_NODE_SETUP_DONE) return Promise.resolve('not a boolean')
      return Promise.resolve(validValues[key])
    })
    const result = await validator.validate()
    expect(result).toBe(false)
  })

  it('should return false when TRANSPORT_P2P_PEERS_DAPP is not an array', async () => {
    storageMock.get.mockImplementation((key: string) => {
      if (key === StorageKey.TRANSPORT_P2P_PEERS_DAPP) return Promise.resolve('not an array')
      return Promise.resolve(validValues[key])
    })
    const result = await validator.validate()
    expect(result).toBe(false)
  })

  it('should return false when LAST_SELECTED_WALLET does not have the required property "key"', async () => {
    storageMock.get.mockImplementation((key: string) => {
      if (key === StorageKey.LAST_SELECTED_WALLET) return Promise.resolve({ notKey: 'value' })
      return Promise.resolve(validValues[key])
    })
    const result = await validator.validate()
    expect(result).toBe(false)
  })
})
