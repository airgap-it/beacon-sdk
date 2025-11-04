import { renderHook, act, waitFor } from '@testing-library/react'
import useWallets from '../../src/ui/alert/hooks/useWallets'
import { PostMessageTransport } from '@airgap/beacon-transport-postmessage'
import { NetworkType } from '@airgap/beacon-types'

// =====================================================================
// Mock the wallet utilities with a simple transformation so that the final
// wallet objects match the MergedWallet interface.
jest.mock('../../src/utils/wallets', () => ({
  parseWallets: jest.fn((wallets) =>
    wallets.map((wallet: any) => ({
      id: wallet.id,
      key: wallet.key,
      name: wallet.name,
      image: wallet.image,
      // Transform singular fields into arrays.
      descriptions: wallet.description ? [wallet.description] : [],
      types: wallet.type ? [wallet.type] : [],
      links: wallet.link ? [wallet.link] : [],
      deepLink: wallet.deepLink,
      supportedInteractionStandards: wallet.supportedInteractionStandards
    }))
  ),
  mergeWallets: jest.fn((wallets: any) => wallets),
  arrangeTopWallets: jest.fn((wallets: any, _featuredWallets: any) => wallets)
}))

// =====================================================================
// Provide dummy wallet lists for testing.
const dummyDesktopList = [
  {
    key: 'desktopWallet',
    name: 'Desktop Wallet',
    shortName: 'Desktop',
    logo: 'desktop.png',
    supportedInteractionStandards: [],
    downloadLink: 'http://download.desktop',
    deepLink: 'desktop://app'
  }
]

const dummyExtensionList = [
  {
    id: 'extWallet',
    key: 'extWallet',
    shortName: 'Extension',
    logo: 'ext.png',
    supportedInteractionStandards: [],
    link: 'http://extension.link'
  }
]

const dummyIOSList = [
  {
    key: 'iosWallet',
    shortName: 'iOS',
    logo: 'ios.png',
    supportedInteractionStandards: [],
    universalLink: 'http://ios.universal',
    deepLink: 'ios://app'
  }
]

const dummyWebList = [
  {
    key: 'webWallet',
    shortName: 'Web',
    logo: 'web.png',
    supportedInteractionStandards: [],
    links: {
      mainnet: 'http://web.mainnet',
      ghostnet: 'http://web.testnet'
    }
  }
]

// Mock the module that exports the wallet lists.
jest.mock('../../src/ui/alert/wallet-lists', () => ({
  desktopList: dummyDesktopList,
  extensionList: dummyExtensionList,
  iOSList: dummyIOSList,
  webList: dummyWebList
}))

// =====================================================================
// Mock PostMessageTransport so we can control the returned available extensions.
jest.mock('@airgap/beacon-transport-postmessage', () => ({
  PostMessageTransport: {
    getAvailableExtensions: jest.fn()
  }
}))

// =====================================================================
// Create a controlled mock for windowRef event listeners.
let messageHandler: any = null
const mockAddEventListener = jest.fn((event, handler) => {
  if (event === 'message') {
    messageHandler = handler
  }
})
const mockRemoveEventListener = jest.fn((event, handler) => {
  if (event === 'message' && messageHandler === handler) {
    messageHandler = null
  }
})

// Renamed variables starting with "mock" are allowed in module factory.
jest.mock('@airgap/beacon-core', () => ({
  windowRef: {
    addEventListener: (event: any, handler: any) => mockAddEventListener(event, handler),
    removeEventListener: (event: any, handler: any) => mockRemoveEventListener(event, handler)
  }
}))

// =====================================================================
// Begin tests
describe('useWallets hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    messageHandler = null
  })

  test('fetches available extensions on mount and returns a wallet map', async () => {
    // Set up the mock to return an extension that is not already in extensionList.
    const fakeExtension = {
      id: 'newExt',
      name: 'New Extension',
      shortName: 'NewExt',
      iconUrl: 'new.png',
      link: 'http://new.link'
    }

    ;(PostMessageTransport.getAvailableExtensions as any).mockResolvedValueOnce([fakeExtension])

    // Render the hook.
    const { result } = renderHook(() => useWallets())

    // Wait for the async effect (fetching available extensions) to complete.
    await waitFor(() => {
      expect(result.current.wallets.size).toBe(5)
    })

    const walletMap = result.current.wallets
    expect(walletMap).toBeInstanceOf(Map)
    expect(walletMap.has('desktopWallet')).toBe(true)
    expect(walletMap.has('extWallet')).toBe(true)
    expect(walletMap.has('iosWallet')).toBe(true)
    expect(walletMap.has('webWallet')).toBe(true)
    expect(walletMap.has('newExt')).toBe(true)

    // Check one wallet's properties.
    const desktopWallet = walletMap.get('desktopWallet')
    expect(desktopWallet).toMatchObject({
      id: 'desktopWallet',
      name: 'Desktop',
      descriptions: ['Desktop App'],
      types: ['desktop'],
      links: ['http://download.desktop'],
      deepLink: 'desktop://app'
    })
  })

  test('updates available extensions on "extensionsUpdated" message event', async () => {
    // Initially return an empty array.
    ;(PostMessageTransport.getAvailableExtensions as any).mockResolvedValueOnce([])

    const { result } = renderHook(() => useWallets())

    // Wait for the initial effect.
    await waitFor(() => result.current.wallets instanceof Map)

    // Initially, the wallet map should not include any extra extension.
    expect(result.current.wallets.has('updatedExt')).toBe(false)

    // Now, simulate receiving an "extensionsUpdated" message with new extension data.
    const updatedExtension = {
      id: 'updatedExt',
      name: 'Updated Extension',
      shortName: 'UpdatedExt',
      iconUrl: 'updated.png',
      link: 'http://updated.link'
    }
    // Set up the mock to return the updated extension.
    ;(PostMessageTransport.getAvailableExtensions as any).mockResolvedValueOnce([updatedExtension])

    // Simulate dispatching a message event.
    await act(async () => {
      if (messageHandler) {
        await messageHandler({ data: 'extensionsUpdated' })
      }
    })

    // Wait for the state update after handling the message.
    await waitFor(() => result.current.wallets.has('updatedExt'))
    expect(result.current.wallets.has('updatedExt')).toBe(true)
  })

  test('respects networkType parameter for web wallets', async () => {
    // For this test, pass networkType as 'testnet' to match our dummy webList.
    ;(PostMessageTransport.getAvailableExtensions as any).mockResolvedValueOnce([])

    const { result } = renderHook(() => useWallets(NetworkType.GHOSTNET))

    await waitFor(() => {
      const walletMap = result.current.wallets
      const webWallet = walletMap.get('webWallet')
      return Boolean(webWallet && webWallet.links[0] === 'http://web.testnet')
    })

    const walletMap = result.current.wallets
    const webWallet = walletMap.get('webWallet')
    expect(webWallet).toBeDefined()
    expect(webWallet!.links[0]).toBe('http://web.testnet')
  })

  test('removes event listener on unmount', async () => {
    ;(PostMessageTransport.getAvailableExtensions as any).mockResolvedValueOnce([])

    const { unmount, result } = renderHook(() => useWallets())
    await waitFor(() => result.current.wallets instanceof Map)

    unmount()
    expect(mockRemoveEventListener).toHaveBeenCalledWith('message', expect.any(Function))
  })

  test('passes featuredWallets parameter to arrangeTopWallets', async () => {
    // This test checks that the featuredWallets parameter is passed along.
    const featuredWallets = ['custom1', 'custom2']
    ;(PostMessageTransport.getAvailableExtensions as any).mockResolvedValueOnce([])

    renderHook(() => useWallets(undefined, featuredWallets))
    // Wait for the effect to run.
    await waitFor(() => {
      const { arrangeTopWallets } = require('../../src/utils/wallets')
      return arrangeTopWallets.mock.calls.length > 0
    })

    const { arrangeTopWallets } = require('../../src/utils/wallets')
    expect(arrangeTopWallets).toHaveBeenCalledWith(expect.any(Array), featuredWallets)
  })
})
