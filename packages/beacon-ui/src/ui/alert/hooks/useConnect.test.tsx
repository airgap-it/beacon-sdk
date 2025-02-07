import { renderHook, act } from '@testing-library/react'
import useConnect from './useConnect'
import { StorageKey, ExtensionMessageTarget, NetworkType } from '@airgap/beacon-types'
import { windowRef } from '@airgap/beacon-core'
import getDefaultLogo from '../getDefautlLogo'
import { OSLink } from '../../../utils/wallets'

// --- Mocks --- //
jest.mock('../../../utils/get-tzip10-link', () => ({
  getTzip10Link: jest.fn().mockReturnValue('https://example.com/tzip10')
}))

jest.mock('@walletconnect/utils', () => ({
  parseUri: jest.fn()
}))

jest.mock('../../../utils/platform', () => ({
  isTwBrowser: jest.fn(() => false),
  isAndroid: jest.fn(() => false),
  isMobileOS: jest.fn(() => false),
  isIOS: jest.fn(() => false)
}))

describe('useConnect hook', () => {
  let wallets: Map<string, any>
  let onCloseHandler: jest.Mock
  let originalWindowOpen: typeof window.open

  beforeEach(() => {
    // Clear localStorage between tests.
    localStorage.clear()
    wallets = new Map()
    onCloseHandler = jest.fn()
    originalWindowOpen = window.open
  })

  afterEach(() => {
    jest.clearAllMocks()
    window.open = originalWindowOpen
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() =>
      useConnect(false, 'wc-payload', 'p2p-payload', 'post-payload', wallets, onCloseHandler)
    )
    const [wallet, isLoading, qrCode, state, displayQRExtra, showMoreContent, isWCWorking] =
      result.current
    expect(wallet).toBeUndefined()
    expect(isLoading).toBe(false)
    expect(qrCode).toBeUndefined()
    expect(state).toBe('top-wallets')
    expect(displayQRExtra).toBe(false)
    expect(showMoreContent).toBe(false)
    expect(isWCWorking).toBe(true)
  })

  it('should handle clickOther and update state to "qr"', () => {
    const { result } = renderHook(() =>
      useConnect(false, 'wc-payload', 'p2p-payload', 'post-payload', wallets, onCloseHandler)
    )
    // handleClickOther is returned at index 10.
    act(() => {
      result.current[10]() // handleClickOther
    })
    // Verify that localStorage is updated with the default wallet.
    const storedWallet = JSON.parse(localStorage.getItem(StorageKey.LAST_SELECTED_WALLET)!)
    expect(storedWallet).toEqual({
      key: 'wallet',
      name: 'wallet',
      type: 'mobile',
      icon: getDefaultLogo()
    })
    // Also, the internal state should change to 'qr' (returned at index 3).
    expect(result.current[3]).toBe('qr')
  })

  it('should handle clickWallet for a web wallet and open a new tab', () => {
    const testWallet = {
      key: 'wallet1',
      name: 'Test Wallet',
      id: 'wallet1-id',
      types: ['web'],
      supportedInteractionStandards: [],
      links: {
        [OSLink.WEB]: 'https://example.com',
        [OSLink.IOS]: 'https://example-ios.com',
        [OSLink.EXTENSION]: 'https://extension.com',
        [OSLink.DESKTOP]: 'https://desktop.com'
      },
      image: 'https://example.com/icon.png'
    }
    wallets.set('wallet1', testWallet)

    // Mock window.open so that it returns a fake "new tab" object.
    const newTabMock = { opener: {}, location: { href: '' } }
    const windowOpenMock = jest.fn().mockReturnValue(newTabMock)
    window.open = windowOpenMock

    const { result } = renderHook(() =>
      useConnect(false, 'wc-payload', 'p2p-payload', 'post-payload', wallets, onCloseHandler)
    )

    // handleClickWallet is returned at index 7.
    act(() => {
      result.current[7]('wallet1', {
        title: 'test',
        pairingPayload: {
          networkType: NetworkType.GHOSTNET,
          p2pSyncCode: 'test',
          postmessageSyncCode: 'test',
          walletConnectSyncCode: 'test'
        }
      })
    })

    // First, handleClickWallet calls handleNewTab which opens a new tab with an empty URL.
    expect(windowOpenMock).toHaveBeenCalledWith('', '_blank')
    // Then the new tab's location is set using the URL returned by getTzip10Link.
    expect(newTabMock.location.href).toBe('https://example.com/tzip10')

    // Verify that localStorage is updated with the wallet info (type "web").
    const storedWallet = JSON.parse(localStorage.getItem(StorageKey.LAST_SELECTED_WALLET)!)
    expect(storedWallet).toEqual({
      key: testWallet.key,
      name: testWallet.name,
      type: 'web',
      icon: testWallet.image
    })
  })

  it('should handle clickConnectExtension and post messages', () => {
    const extensionWallet = {
      key: 'wallet-ext',
      name: 'Extension Wallet',
      id: 'ext-id',
      firefoxId: 'firefox-ext-id',
      types: ['extension'],
      supportedInteractionStandards: [],
      links: {
        [OSLink.EXTENSION]: 'https://extension.com'
      },
      image: 'https://extension.com/icon.png'
    }
    wallets.set('wallet-ext', extensionWallet)
    const postPayload = 'post-payload'

    // Use handleClickWallet to set the internal wallet state.
    const { result } = renderHook(() =>
      useConnect(false, 'wc-payload', 'p2p-payload', postPayload, wallets, onCloseHandler)
    )
    act(() => {
      result.current[7]('wallet-ext', {
        title: 'test',
        pairingPayload: {
          networkType: NetworkType.GHOSTNET,
          p2pSyncCode: 'test',
          postmessageSyncCode: 'test',
          walletConnectSyncCode: 'test'
        }
      })
    })

    // Spy on windowRef.postMessage.
    const postMessageSpy = jest.spyOn(windowRef, 'postMessage').mockImplementation(() => {})

    // handleClickConnectExtension is returned at index 11.
    act(() => {
      result.current[11]()
    })

    // Verify that two messages were posted (using wallet.id and wallet.firefoxId).
    expect(postMessageSpy).toHaveBeenCalledWith(
      {
        target: ExtensionMessageTarget.EXTENSION,
        payload: postPayload,
        targetId: extensionWallet.id
      },
      windowRef.location.origin
    )
    expect(postMessageSpy).toHaveBeenCalledWith(
      {
        target: ExtensionMessageTarget.EXTENSION,
        payload: postPayload,
        targetId: extensionWallet.firefoxId
      },
      windowRef.location.origin
    )

    // Also, check that localStorage was updated with type "extension".
    const storedWallet = JSON.parse(localStorage.getItem(StorageKey.LAST_SELECTED_WALLET)!)
    expect(storedWallet).toEqual({
      key: extensionWallet.key,
      name: extensionWallet.name,
      type: 'extension',
      icon: extensionWallet.image
    })
  })

  it('should handle clickInstallExtension by opening the extension URL', () => {
    const extensionWallet = {
      key: 'wallet-ext',
      name: 'Extension Wallet',
      id: 'ext-id',
      types: ['extension'],
      supportedInteractionStandards: [],
      links: {
        [OSLink.EXTENSION]: 'https://extension.com'
      },
      image: 'https://extension.com/icon.png'
    }
    wallets.set('wallet-ext', extensionWallet)

    const { result } = renderHook(() =>
      useConnect(false, 'wc-payload', 'p2p-payload', 'post-payload', wallets, onCloseHandler)
    )

    // Set the wallet state by calling handleClickWallet.
    act(() => {
      result.current[7]('wallet-ext', {
        title: 'test',
        pairingPayload: {
          networkType: NetworkType.GHOSTNET,
          p2pSyncCode: 'test',
          postmessageSyncCode: 'test',
          walletConnectSyncCode: 'test'
        }
      })
    })

    const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null)

    // handleClickInstallExtension is returned at index 12.
    act(() => {
      result.current[12]()
    })

    expect(windowOpenSpy).toHaveBeenCalledWith(
      extensionWallet.links[OSLink.EXTENSION],
      '_blank',
      'noopener'
    )
  })

  // Additional tests for handleClickOpenDesktopApp and handleClickDownloadDesktopApp
  // can be written in a similar fashion.
})
