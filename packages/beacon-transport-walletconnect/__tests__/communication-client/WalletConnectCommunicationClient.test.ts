// __tests__/WalletConnectCommunicationClient.test.ts

import { SessionTypes, SignClientTypes } from '@walletconnect/types'
import {
  BeaconMessageType,
  SignPayloadRequest,
  NetworkType,
  SigningType
} from '@airgap/beacon-types'
import { WalletConnectCommunicationClient } from '../../src/communication-client/WalletConnectCommunicationClient'

jest.mock('@airgap/beacon-core', () => {
  const actual = jest.requireActual('@airgap/beacon-core')
  return {
    ...actual,
    Logger: jest.fn().mockImplementation(() => ({
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      log: jest.fn()
    })),
    WCStorage: jest.fn().mockImplementation(() => ({
      onMessageHandler: undefined,
      onErrorHandler: undefined,
      backup: jest.fn(),
      resetState: jest.fn(),
      notify: jest.fn()
    })),
    Serializer: jest.fn().mockImplementation(() => ({
      serialize: jest.fn((x) => Promise.resolve(JSON.stringify(x))),
      deserialize: jest.fn((x) => Promise.resolve(JSON.parse(x)))
    }))
  }
})

jest.mock('@walletconnect/sign-client', () => ({
  init: jest.fn(() =>
    Promise.resolve({
      session: { keys: [], get: jest.fn(), getAll: jest.fn(() => []) },
      core: {
        pairing: { getPairings: jest.fn(() => []) },
        events: { removeAllListeners: jest.fn() },
        relayer: {
          transportClose: jest.fn(),
          events: { removeAllListeners: jest.fn() },
          provider: { events: { removeAllListeners: jest.fn() } },
          subscriber: { events: { removeAllListeners: jest.fn() } }
        },
        heartbeat: { stop: jest.fn() }
      },
      request: jest.fn()
    })
  )
}))

jest.mock('@walletconnect/utils', () => ({
  getSdkError: jest.fn((code: string) => ({ code }))
}))

jest.mock('@airgap/beacon-utils', () => ({
  generateGUID: jest.fn().mockResolvedValue('guid'),
  getAddressFromPublicKey: jest.fn().mockResolvedValue('tz1address'),
  isPublicKeySC: jest.fn().mockReturnValue(true)
}))

function getStringBetween(str: string | undefined, startChar: string, endChar: string): string {
  if (!str || !startChar || !endChar) {
    return ''
  }

  const startIndex = str.indexOf(startChar)
  const endIndex = str.indexOf(endChar, startIndex + 1)

  if (startIndex === -1 || endIndex === -1) {
    throw new Error('String not found')
  }

  return str.substring(startIndex + 1, endIndex)
}

describe('getStringBetween', () => {
  it('returns substring between two chars', () => {
    expect(getStringBetween('wc:topic@2', ':', '@')).toBe('topic')
  })

  it('returns empty string if inputs missing', () => {
    expect(getStringBetween(undefined, ':', '@')).toBe('')
    expect(getStringBetween('abc', '', '@')).toBe('')
    expect(getStringBetween('abc', ':', '')).toBe('')
  })

  it('throws if start or end not found', () => {
    expect(() => getStringBetween('abc', 'x', 'y')).toThrow('String not found')
  })
})

describe('WalletConnectCommunicationClient basics', () => {
  const wcOptions = { network: 'mainnet' as NetworkType, opts: {} as SignClientTypes.Options }
  const isLeader = jest.fn().mockResolvedValue(true)
  let client: WalletConnectCommunicationClient

  beforeEach(() => {
    jest.clearAllMocks()
    client = new WalletConnectCommunicationClient(wcOptions, isLeader)
  })

  it('is a singleton via getInstance()', () => {
    const same = WalletConnectCommunicationClient.getInstance(wcOptions, isLeader)
    expect(same).toBe(WalletConnectCommunicationClient.getInstance(wcOptions, isLeader))
  })

  it('listenForEncryptedMessage adds and dedups listeners', async () => {
    const cb = jest.fn()
    await client.listenForEncryptedMessage('key1', cb)
    expect((client as any).activeListeners.has('key1')).toBe(true)
    await client.listenForEncryptedMessage('key1', cb)
    expect((client as any).activeListeners.size).toBe(1)
  })

  it('listenForChannelOpening adds a channel listener', async () => {
    const cb = jest.fn()
    await client.listenForChannelOpening(cb)
    expect((client as any).channelOpeningListeners.has('channelOpening')).toBe(true)
  })

  it('unsubscribeFromEncryptedMessages clears all listeners', async () => {
    await client.listenForEncryptedMessage('k', () => {})
    await client.listenForChannelOpening(() => {})
    await client.unsubscribeFromEncryptedMessages()
    expect((client as any).activeListeners.size).toBe(0)
    expect((client as any).channelOpeningListeners.size).toBe(0)
  })

  it('getTopicFromSession returns session.topic', () => {
    const dummy: SessionTypes.Struct = {
      topic: 't1',
      namespaces: {},
      pairingTopic: '',
      peer: { metadata: { name: '', icons: [], redirect: {} } },
      sessionProperties: {}
    } as any
    expect((client as any).getTopicFromSession(dummy)).toBe('t1')
  })
})

describe('String message dispatching', () => {
  const wcOptions = { network: 'mainnet' as NetworkType, opts: {} as SignClientTypes.Options }
  const isLeader = jest.fn().mockResolvedValue(true)
  let client: WalletConnectCommunicationClient

  beforeEach(() => {
    jest.clearAllMocks()
    client = new WalletConnectCommunicationClient(wcOptions, isLeader)
  })

  it('sendMessage no-op on unknown type', async () => {
    const raw = JSON.stringify({ id: '1', type: 'Foo' })
    await client.sendMessage(raw)
    // no errors
  })

  it('sendMessage dispatches PermissionRequest', async () => {
    const msg = { id: '1', type: BeaconMessageType.PermissionRequest, network: 'mainnet' }
    jest.spyOn(client, 'requestPermissions').mockImplementationOnce(() => Promise.resolve())
    await client.sendMessage(JSON.stringify(msg))
    expect(client.requestPermissions).toHaveBeenCalled()
  })

  it('sendMessage dispatches OperationRequest', async () => {
    const msg = { id: '2', type: BeaconMessageType.OperationRequest, operationDetails: [] }
    jest.spyOn(client, 'sendOperations').mockImplementationOnce(() => Promise.resolve())
    await client.sendMessage(JSON.stringify(msg))
    expect(client.sendOperations).toHaveBeenCalled()
  })

  it('sendMessage dispatches SignPayloadRequest', async () => {
    const msg: SignPayloadRequest = {
      id: '3',
      type: BeaconMessageType.SignPayloadRequest,
      payload: 'p',
      signingType: SigningType.RAW,
      senderId: '',
      sourceAddress: 'tz1test',
      version: '3'
    }
    jest.spyOn(client, 'signPayload').mockImplementationOnce(() => Promise.resolve())
    await client.sendMessage(JSON.stringify(msg))
    expect(client.signPayload).toHaveBeenCalled()
  })
})
