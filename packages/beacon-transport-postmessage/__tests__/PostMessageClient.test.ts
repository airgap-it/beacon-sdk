// __tests__/communication-client/PostMessageClient.test.ts

import { windowRef, Serializer } from '@airgap/beacon-core'
import { openCryptobox, secretbox_NONCEBYTES, secretbox_MACBYTES } from '@airgap/beacon-utils'
import {
  ExtensionMessageTarget,
  Origin,
  ExtendedPostMessagePairingResponse
} from '@airgap/beacon-types'
import { PostMessageClient } from '../src/PostMessageClient'

// --- 1) Mocks for @airgap/beacon-core ---
jest.mock('@airgap/beacon-core', () => {
  const actual = jest.requireActual('@airgap/beacon-core')

  const windowRef = {
    postMessage: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    location: { origin: 'http://test-origin' }
  }

  const Serializer = jest.fn().mockImplementation(() => ({
    serialize: jest.fn().mockResolvedValue('serialized-payload')
  }))

  const getSenderId = jest.fn().mockResolvedValue('sender-id')

  class MessageBasedClient {
    public keyPair: any
    constructor(_name: string, keyPair: any) {
      this.keyPair = keyPair
    }
  }

  return {
    ...actual,
    windowRef,
    Serializer,
    getSenderId,
    MessageBasedClient
  }
})

// --- 2) Mocks for @airgap/beacon-utils ---
jest.mock('@airgap/beacon-utils', () => {
  const actual = jest.requireActual('@airgap/beacon-utils')
  return {
    ...actual,
    openCryptobox: jest.fn(),
    secretbox_NONCEBYTES: 8,
    secretbox_MACBYTES: 16
  }
})

describe('PostMessageClient', () => {
  let client: any // PostMessageClient
  const fakeKeyPair: any = { publicKey: 'pub', secretKey: 'sec' }

  beforeEach(() => {
    jest.clearAllMocks()
    client = new PostMessageClient('my-app', fakeKeyPair)
  })

  describe('init()', () => {
    it('registers a message listener', async () => {
      await client.init()
      expect(windowRef.addEventListener).toHaveBeenCalledWith('message', expect.any(Function))
    })
  })

  describe('listenForEncryptedMessage()', () => {
    it('adds a listener and calls back when decrypt succeeds', async () => {
      const cb = jest.fn()
      client.decryptMessage = jest.fn().mockResolvedValue('decrypted-text')

      await client.listenForEncryptedMessage('sender-pub', cb)
      expect((client as any).activeListeners.has('sender-pub')).toBe(true)

      const listener = (client as any).activeListeners.get('sender-pub')!
      await listener({ encryptedPayload: 'payload' }, { origin: Origin.EXTENSION, id: 'ctx' })

      expect(client.decryptMessage).toHaveBeenCalledWith('sender-pub', 'payload')
      expect(cb).toHaveBeenCalledWith('decrypted-text', { origin: Origin.EXTENSION, id: 'ctx' })
    })

    it('does not register the same listener twice', async () => {
      const cb = jest.fn()
      client.decryptMessage = jest.fn().mockResolvedValue('x')

      await client.listenForEncryptedMessage('sender-pub', cb)
      await client.listenForEncryptedMessage('sender-pub', cb)

      expect((client as any).activeListeners.size).toBe(1)
    })

    it('silently ignores decryption errors', async () => {
      const cb = jest.fn()
      client.decryptMessage = jest.fn().mockRejectedValue(new Error('fail'))

      await client.listenForEncryptedMessage('sender-pub', cb)
      const listener = (client as any).activeListeners.get('sender-pub')!
      await listener({ encryptedPayload: 'bad' }, { origin: Origin.EXTENSION, id: 'ctx' })

      expect(cb).not.toHaveBeenCalled()
    })
  })

  describe('sendMessage()', () => {
    beforeEach(() => {
      client.encryptMessage = jest.fn().mockResolvedValue('enc-payload')
    })

    it('encrypts and posts with extensionId', async () => {
      const peer = { publicKey: 'peer-pub', extensionId: 'ext-1' } as any
      await client.sendMessage('hello', peer)

      expect(client.encryptMessage).toHaveBeenCalledWith('peer-pub', 'hello')
      expect(windowRef.postMessage).toHaveBeenCalledWith(
        {
          target: ExtensionMessageTarget.EXTENSION,
          encryptedPayload: 'enc-payload',
          targetId: 'ext-1'
        },
        windowRef.location.origin
      )
    })

    it('encrypts and posts without extensionId', async () => {
      const peer = { publicKey: 'peer-pub' } as any
      await client.sendMessage('world', peer)

      expect(windowRef.postMessage).toHaveBeenCalledWith(
        {
          target: ExtensionMessageTarget.EXTENSION,
          encryptedPayload: 'enc-payload',
          targetId: undefined
        },
        windowRef.location.origin
      )
    })
  })

  describe('listenForChannelOpening()', () => {
    it('registers a message listener', async () => {
      const cb = jest.fn()
      await client.listenForChannelOpening(cb)
      expect(windowRef.addEventListener).toHaveBeenCalledWith('message', expect.any(Function))
    })

    it('decrypts a valid channel-open event and calls back', async () => {
      const raw = { id: 'id1', name: 'n', publicKey: 'p', version: 'v' }
      ;(openCryptobox as jest.Mock).mockResolvedValueOnce(JSON.stringify(raw))

      const cb = jest.fn()
      await client.listenForChannelOpening(cb)

      const listener = (windowRef.addEventListener as jest.Mock).mock.calls.find(
        ([e]) => e === 'message'
      )![1] as (e: any) => Promise<void>

      const payloadHex = Buffer.alloc(secretbox_NONCEBYTES + secretbox_MACBYTES).toString('hex')
      const fakeEvent = {
        source: windowRef,
        origin: windowRef.location.origin,
        data: {
          message: { target: ExtensionMessageTarget.PAGE, payload: payloadHex },
          sender: { id: 'sender-ext' }
        }
      }

      await listener(fakeEvent)

      expect(openCryptobox).toHaveBeenCalledWith(Buffer.from(payloadHex, 'hex'), 'pub', 'sec')

      expect(cb).toHaveBeenCalledTimes(1)
      const resp = cb.mock.calls[0][0] as ExtendedPostMessagePairingResponse
      expect(resp.id).toBe('id1')
      expect(resp.name).toBe('n')
      expect(resp.publicKey).toBe('p')
      expect(resp.version).toBe('v')
      expect(resp.senderId).toBe('sender-id')
      expect(resp.extensionId).toBe('sender-ext')
    })

    it('ignores events from the wrong source or origin', async () => {
      const cb = jest.fn()
      await client.listenForChannelOpening(cb)
      const listener = (windowRef.addEventListener as jest.Mock).mock.calls.find(
        ([e]) => e === 'message'
      )![1] as (e: any) => Promise<void>

      await listener({ source: {}, origin: windowRef.location.origin, data: {} })
      await listener({ source: windowRef, origin: 'bad', data: {} })

      expect(openCryptobox).not.toHaveBeenCalled()
      expect(cb).not.toHaveBeenCalled()
    })
  })

  describe('sendPairingRequest()', () => {
    it('serializes the pairing request and posts it', async () => {
      ;(client.getPairingRequestInfo as jest.Mock) = jest.fn().mockResolvedValue({ foo: 'bar' })
      ;(Serializer as jest.Mock).mockImplementationOnce(() => ({
        serialize: jest.fn().mockResolvedValue('ser-payload')
      }))

      await client.sendPairingRequest('ext-id')

      expect((Serializer as jest.Mock).mock.results[0].value.serialize).toHaveBeenCalledWith({
        foo: 'bar'
      })
      expect(windowRef.postMessage).toHaveBeenCalledWith(
        {
          target: ExtensionMessageTarget.EXTENSION,
          payload: 'ser-payload',
          targetId: 'ext-id'
        },
        windowRef.location.origin
      )
    })
  })

  describe('isChannelOpenMessage()', () => {
    it('returns true for objects with a payload key', async () => {
      await expect(client.isChannelOpenMessage({ payload: 'x' })).resolves.toBe(true)
      await expect(client.isChannelOpenMessage({ foo: 'bar' })).resolves.toBe(false)
    })
  })
})
