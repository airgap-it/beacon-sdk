import axios from 'axios'
import { toHex } from '@airgap/beacon-utils'
import { LocalStorage, NOTIFICATION_ORACLE_URL, windowRef } from '@airgap/beacon-core'
import { StorageKey } from '@airgap/beacon-types'
import { WalletClient } from '../src/client/WalletClient'
import { WalletClientOptions } from '../src/client/WalletClientOptions'

// Mock axios for both get and post requests.
jest.mock('axios')

describe('WalletClient', () => {
  let walletClient: WalletClient
  let storage: LocalStorage

  // Example configuration options for WalletClient. Adjust these as needed for your project.
  const clientOptions: WalletClientOptions = {
    name: 'TestWallet',
    storage: new LocalStorage(),
    matrixNodes: {},
    iconUrl: 'http://icon.com',
    appUrl: 'http://app.com'
  }

  beforeEach(() => {
    delete (windowRef as any).beaconCreatedClientInstance
    // Create a fresh instance of the storage and client for each test.
    storage = new LocalStorage()
    clientOptions.storage = storage
    walletClient = new WalletClient(clientOptions)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getRegisterPushChallenge', () => {
    it('should return a valid challenge object and correctly construct payloadToSign', async () => {
      // Arrange: set up axios GET to return a sample challenge.
      const challengeData = {
        id: 'challenge123',
        timestamp: 'timestamp123'
      }
      ;(axios.get as jest.Mock).mockResolvedValue({ data: challengeData })

      const accountPublicKey = 'publicKey123'
      const backendUrl = 'http://backend.com'

      // Act: call the method under test.
      const result = await walletClient.getRegisterPushChallenge(backendUrl, accountPublicKey)

      // Construct expected result manually
      const constructedString = [
        'Tezos Signed Message: ',
        challengeData.id,
        challengeData.timestamp,
        accountPublicKey,
        backendUrl
      ].join(' ')

      const hexString = toHex(constructedString)
      const expectedPayloadToSign =
        '05' + '01' + hexString.length.toString(16).padStart(8, '0') + hexString

      // Assert: check both the challenge and payload.
      expect(result.challenge).toEqual(challengeData)
      expect(result.payloadToSign).toEqual(expectedPayloadToSign)
      // Also verify that axios.get was called with the proper URL (using the default oracle URL).
      expect(axios.get).toHaveBeenCalledWith(`${NOTIFICATION_ORACLE_URL}/challenge`)
    })
  })

  describe('registerPush', () => {
    it('should return an existing push token if already registered', async () => {
      // Arrange
      const existingToken = {
        publicKey: 'publicKey123',
        backendUrl: 'http://backend.com',
        accessToken: 'accessToken123',
        managementToken: 'managementToken123'
      }
      // Assume storage.get returns an array containing an existing token.
      storage.get = jest.fn().mockResolvedValue([existingToken])
      // Act
      const result = await walletClient.registerPush(
        { id: 'challenge123', timestamp: 'timestamp123' },
        'signature123',
        'http://backend.com',
        'publicKey123',
        'protocolIdentifier',
        'deviceId'
      )
      // Assert
      expect(result).toEqual(existingToken)
      // axios.post should not be called when token already exists.
      expect(axios.post).not.toHaveBeenCalled()
    })

    it('should register and return a new push token if one does not exist', async () => {
      // Arrange: simulate no token in storage.
      storage.get = jest.fn().mockResolvedValue([])

      // Set up axios POST to simulate a successful registration.
      const postResponse = {
        data: {
          accessToken: 'newAccessToken',
          managementToken: 'newManagementToken',
          message: 'Success',
          success: true
        }
      }
      ;(axios.post as jest.Mock).mockResolvedValue(postResponse)

      // Mock storage.set to simply resolve.
      storage.set = jest.fn().mockResolvedValue(undefined)

      // Act
      const result = await walletClient.registerPush(
        { id: 'challenge456', timestamp: 'timestamp456' },
        'signature456',
        'http://backend.com',
        'publicKey456',
        'protocolIdentifier',
        'deviceId'
      )

      // The expected new token object.
      const expectedToken = {
        publicKey: 'publicKey456',
        backendUrl: 'http://backend.com',
        accessToken: 'newAccessToken',
        managementToken: 'newManagementToken'
      }

      // Assert: the new token is returned.
      expect(result).toEqual(expectedToken)
      // The axios.post call URL should be using the default NOTIFICATION_ORACLE_URL.
      expect(axios.post).toHaveBeenCalledWith(`${NOTIFICATION_ORACLE_URL}/register`, {
        name: 'TestWallet',
        challenge: { id: 'challenge456', timestamp: 'timestamp456' },
        accountPublicKey: 'publicKey456',
        signature: 'signature456',
        backendUrl: 'http://backend.com',
        protocolIdentifier: 'protocolIdentifier',
        deviceId: 'deviceId'
      })
      // Verify that storage.set was called to store the new token.
      expect(storage.set).toHaveBeenCalledWith(
        StorageKey.PUSH_TOKENS,
        expect.arrayContaining([expectedToken])
      )
    })
  })
})
