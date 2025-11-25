import { WalletClient } from '@airgap/beacon-wallet'
import { ChromeStorage, Serializer, getSenderId } from '@airgap/beacon-core'
import { sealCryptobox, decryptCryptoboxPayload, encryptCryptoboxPayload, secretbox_NONCEBYTES, secretbox_MACBYTES, createReceiverSessionKey, createSenderSessionKey } from '@airgap/beacon-utils'
import { BeaconErrorType, PostMessagePairingRequest, PostMessagePairingResponse } from '@airgap/beacon-types'
import { TaquitoProvider } from '../wallet/TaquitoProvider'
import * as WalletStorage from '../wallet/WalletStorage'
import * as formatter from '../beacon/BeaconMessageFormatter'
import type { BeaconRequest } from '../beacon/BeaconMessageFormatter'
import { MessageTypes, type PendingRequest, type WalletState, type NetworkConfig } from '../beacon/types'
import { resolveRpcUrl, fetchBalance } from '../shared/networks'

let walletClient: WalletClient | null = null
let walletProvider: TaquitoProvider | null = null
let pendingRequests: Map<string, PendingRequest> = new Map()
let currentNetwork: NetworkConfig = { type: 'mainnet', rpcUrl: 'https://mainnet.api.tez.ie' }
let activePeers: Map<string, { publicKey: string; senderId: string }> = new Map()

async function initWalletClient(): Promise<void> {
  if (walletClient) return

  walletClient = new WalletClient({
    name: 'Beacon Example Wallet',
    iconUrl: chrome.runtime.getURL('icons/icon48.png'),
    appUrl: 'https://github.com/AirGap/beacon-sdk',
    storage: new ChromeStorage()
  })

  await walletClient.init()

  walletClient.connect(async (message, connectionInfo) => {
    await handleBeaconMessage(message, connectionInfo)
  })
}

async function initWalletProvider(): Promise<boolean> {
  if (walletProvider?.isReady()) return true

  walletProvider = new TaquitoProvider()

  const stored = await WalletStorage.getStoredWallet()

  if (stored.mnemonic) {
    await walletProvider.initFromMnemonic(stored.mnemonic)
    return true
  }

  if (stored.privateKey) {
    await walletProvider.initFromPrivateKey(stored.privateKey)
    return true
  }

  return false
}

initWalletClient().catch((err) => console.error('[Background] WalletClient init failed:', err))
initWalletProvider().catch((err) => console.error('[Background] WalletProvider init failed:', err))

async function handleBeaconMessage(message: any, connectionInfo: any, peerPublicKey?: string): Promise<void> {
  try {
    const uiRequest = formatter.toUIFormat(message)

    const pending: PendingRequest = {
      id: message.id,
      request: uiRequest,
      rawRequest: message,
      tabId: 0,
      timestamp: Date.now(),
      peerPublicKey
    }

    pendingRequests.set(message.id, pending)
    await chrome.storage.session.set({ pendingRequest: pending })

    await chrome.action.setBadgeText({ text: '1' })
    await chrome.action.setBadgeBackgroundColor({ color: '#3B82F6' })

    try {
      await chrome.action.openPopup()
    } catch (e) {
      // Can fail if user isn't interacting with browser
    }

    chrome.runtime.sendMessage({
      type: MessageTypes.PENDING_REQUEST,
      payload: uiRequest
    }).catch(() => {})
  } catch (error) {
    console.error('[Background] Error handling beacon message:', error)
  }
}

async function handlePostMessageRequest(
  data: { payload?: string; encryptedPayload?: string; targetId?: string },
  sender: chrome.runtime.MessageSender
): Promise<{ ok: boolean }> {
  try {
    if (data.payload) {
      const serializer = new Serializer()
      const deserialized = await serializer.deserialize(data.payload) as Record<string, unknown>

      if (deserialized.type === 'postmessage-pairing-request') {
        const pairingRequest = deserialized as unknown as PostMessagePairingRequest

        if (walletClient) {
          await walletClient.addPeer(pairingRequest, false)

          const peerSenderId = await getSenderId(pairingRequest.publicKey)
          activePeers.set(peerSenderId, {
            publicKey: pairingRequest.publicKey,
            senderId: peerSenderId
          })

          const response: PostMessagePairingResponse = new PostMessagePairingResponse(
            pairingRequest.id,
            'Beacon Example Wallet',
            await walletClient.beaconId,
            pairingRequest.version
          )

          const encryptedResponse = await sealCryptobox(
            JSON.stringify(response),
            Buffer.from(pairingRequest.publicKey, 'hex')
          )

          if (sender.tab?.id) {
            chrome.tabs.sendMessage(sender.tab.id, {
              type: MessageTypes.BEACON_RESPONSE,
              payload: {
                message: {
                  target: 'toPage',
                  payload: encryptedResponse
                },
                sender: { id: chrome.runtime.id }
              }
            })
          }
        }

        return { ok: true }
      }
    }

    if (data.encryptedPayload && walletClient) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const keyPair = await (walletClient as any).keyPair

      for (const [, peer] of activePeers) {
        try {
          const sharedKey = createReceiverSessionKey(keyPair, peer.publicKey)

          const payload = Buffer.from(data.encryptedPayload, 'hex')
          if (payload.length >= secretbox_NONCEBYTES + secretbox_MACBYTES) {
            const decrypted = await decryptCryptoboxPayload(payload, sharedKey.receive)
            const serializer = new Serializer()
            const message = await serializer.deserialize(decrypted)

            await handleBeaconMessage(message, {
              origin: 'extension',
              id: peer.senderId
            }, peer.publicKey)

            return { ok: true }
          }
        } catch (e) {
          // Wrong peer, try next
        }
      }
    }

    return { ok: true }
  } catch (error) {
    console.error('[Background] Error handling PostMessage request:', error)
    return { ok: false }
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse).catch((error) => {
    console.error('[Background] Error handling message:', error)
    sendResponse({ error: error.message })
  })
  return true // async response
})

async function handleMessage(message: any, sender: chrome.runtime.MessageSender): Promise<any> {
  switch (message.type) {
    case MessageTypes.GET_WALLET_STATE:
      return getWalletState()

    case MessageTypes.INIT_WALLET:
      return initWallet(message.payload)

    case MessageTypes.GET_PENDING_REQUEST:
      return getPendingRequest()

    case MessageTypes.APPROVE_REQUEST:
      return approveRequest(message.payload.requestId, message.payload.approval)

    case MessageTypes.REJECT_REQUEST:
      return rejectRequest(message.payload.requestId)

    case MessageTypes.BEACON_MESSAGE:
      return handlePostMessageRequest(message.payload, sender)

    case MessageTypes.SET_NETWORK:
      return setNetwork(message.payload)

    default:
      return { error: 'Unknown message type' }
  }
}

async function getWalletState(): Promise<WalletState> {
  await initWalletProvider()

  const info = walletProvider?.getWalletInfo()

  let balance: string | null = null
  if (info?.address) {
    balance = await fetchBalance(info.address, currentNetwork)
  }

  return {
    isReady: walletProvider?.isReady() ?? false,
    address: info?.address ?? null,
    publicKey: info?.publicKey ?? null,
    balance,
    network: currentNetwork
  }
}

async function setNetwork(network: NetworkConfig): Promise<WalletState> {
  currentNetwork = network
  return getWalletState()
}

async function initWallet(payload: { type: 'mnemonic' | 'privateKey' | 'generate'; value?: string }): Promise<{ success: boolean; error?: string }> {
  try {
    walletProvider = new TaquitoProvider()

    switch (payload.type) {
      case 'mnemonic':
        if (!payload.value) throw new Error('Mnemonic is required')
        await walletProvider.initFromMnemonic(payload.value)
        await WalletStorage.saveMnemonic(payload.value)
        break

      case 'privateKey':
        if (!payload.value) throw new Error('Private key is required')
        await walletProvider.initFromPrivateKey(payload.value)
        await WalletStorage.savePrivateKey(payload.value)
        break

      case 'generate':
        const mnemonic = await walletProvider.generateNew()
        await WalletStorage.saveMnemonic(mnemonic)
        break
    }

    return { success: true }
  } catch (error) {
    console.error('[Background] Wallet init error:', error)
    return { success: false, error: (error as Error).message }
  }
}

async function getPendingRequest(): Promise<PendingRequest | null> {
  const result = await chrome.storage.session.get('pendingRequest')
  return result.pendingRequest || null
}

async function sendEncryptedResponse(response: unknown, peerPublicKey: string): Promise<void> {
  if (!walletClient) throw new Error('WalletClient not initialized')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const keyPair = await (walletClient as any).keyPair
  const sharedKey = createSenderSessionKey(keyPair, peerPublicKey)

  const serializer = new Serializer()
  const serialized = await serializer.serialize(response)
  const encrypted = await encryptCryptoboxPayload(serialized, sharedKey.send)

  const tabs = await chrome.tabs.query({})
  for (const tab of tabs) {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: MessageTypes.BEACON_RESPONSE,
        payload: {
          message: {
            target: 'toPage',
            encryptedPayload: encrypted
          },
          sender: { id: chrome.runtime.id }
        }
      }).catch(() => {})
    }
  }
}

async function approveRequest(requestId: string, approval: any): Promise<{ success: boolean; error?: string }> {
  try {
    const pending = pendingRequests.get(requestId)
    if (!pending) {
      throw new Error('Request not found')
    }

    if (!walletClient) {
      throw new Error('WalletClient not initialized')
    }

    if (!walletProvider?.isReady()) {
      throw new Error('Wallet not initialized')
    }

    const walletInfo = walletProvider.getWalletInfo()
    if (!walletInfo) {
      throw new Error('Wallet info not available')
    }

    const senderId = await walletClient.beaconId

    const walletMetadata: formatter.WalletMetadata = {
      senderId,
      name: 'Beacon Example Wallet',
      icon: chrome.runtime.getURL('icons/icon48.png')
    }

    let response: unknown

    const rawRequest = pending.rawRequest as BeaconRequest

    switch (pending.request.type) {
      case 'permission':
        const network = pending.request.network || currentNetwork
        currentNetwork = network

        response = formatter.toBeaconPermissionResponse(
          rawRequest,
          {
            address: walletInfo.address,
            publicKey: walletInfo.publicKey,
            network,
            scopes: approval.scopes || pending.request.scopes
          },
          walletMetadata
        )
        break

      case 'sign':
        const signResult = await walletProvider.signPayload(pending.request.payload, pending.request.signingType)
        response = formatter.toBeaconSignResponse(rawRequest, signResult, walletMetadata)
        break

      case 'operation':
        const network2 = pending.request.network
        const opResult = await walletProvider.signOperation(pending.request.operations, {
          type: network2.type,
          rpcUrl: resolveRpcUrl(network2)
        })
        response = formatter.toBeaconOperationResponse(rawRequest, opResult, walletMetadata)
        break

      default:
        throw new Error(`Unknown request type: ${(pending.request as any).type}`)
    }

    if (pending.peerPublicKey) {
      await sendEncryptedResponse(response, pending.peerPublicKey)
    } else {
      await walletClient.respond(response as any)
    }

    pendingRequests.delete(requestId)
    await chrome.storage.session.remove('pendingRequest')
    await chrome.action.setBadgeText({ text: '' })

    return { success: true }
  } catch (error) {
    console.error('[Background] Approve error:', error)
    return { success: false, error: (error as Error).message }
  }
}

async function rejectRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const pending = pendingRequests.get(requestId)
    if (!pending) {
      throw new Error('Request not found')
    }

    if (!walletClient) {
      throw new Error('WalletClient not initialized')
    }

    const senderId = await walletClient.beaconId
    const rawRequest = pending.rawRequest as BeaconRequest

    const response = formatter.toBeaconError(rawRequest, BeaconErrorType.ABORTED_ERROR, senderId)

    if (pending.peerPublicKey) {
      await sendEncryptedResponse(response, pending.peerPublicKey)
    } else {
      await walletClient.respond(response as any)
    }

    pendingRequests.delete(requestId)
    await chrome.storage.session.remove('pendingRequest')
    await chrome.action.setBadgeText({ text: '' })

    return { success: true }
  } catch (error) {
    console.error('[Background] Reject error:', error)
    return { success: false, error: (error as Error).message }
  }
}

chrome.runtime.onStartup.addListener(() => {
  initWalletClient().catch(console.error)
  initWalletProvider().catch(console.error)
})

chrome.runtime.onInstalled.addListener(() => {
  initWalletClient().catch(console.error)
})
