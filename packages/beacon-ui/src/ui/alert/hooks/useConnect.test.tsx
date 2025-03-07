import { renderHook, act } from '@testing-library/react'
import useConnect from './useConnect'
import { StorageKey, ExtensionMessageTarget, NetworkType } from '@airgap/beacon-types'
import { windowRef } from '@airgap/beacon-core'
import getDefaultLogo from '../getDefautlLogo'
import { OSLink } from '../../../utils/wallets'
import { AlertState } from '../../../ui/common'

// --- Mocks --- //
jest.mock('../../../utils/get-tzip10-link', () => ({
  getTzip10Link: jest.fn().mockReturnValue('https://example.com/tzip10')
}))

const mockParseUri = jest.fn()
jest.mock('@walletconnect/utils', () => ({
  parseUri: (...args: any[]) => mockParseUri(...args)
}))

// Force the platform helpers to return desktop defaults.
const platform = require('../../../utils/platform')
jest.spyOn(platform, 'isTwBrowser').mockReturnValue(false)
jest.spyOn(platform, 'isAndroid').mockReturnValue(false)
jest.spyOn(platform, 'isMobileOS').mockReturnValue(false)
jest.spyOn(platform, 'isIOS').mockReturnValue(false)

// --- Test Suite --- //
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
    mockParseUri.mockReset()
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks() // restore all mocked/spied functions
    window.open = originalWindowOpen
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() =>
      useConnect(false, 'wc-payload', 'p2p-payload', 'post-payload', wallets, onCloseHandler)
    )
    const [wallet, isLoading, qrCode, state, displayQRExtra, showMoreContent, isWCWorking] =
      result.current
    expect(wallet).toBeUndefined()
    expect(isLoading).toBe(true)
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
          p2pSyncCode: Promise.resolve('test'),
          postmessageSyncCode: Promise.resolve('test'),
          walletConnectSyncCode: Promise.resolve('test')
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
          p2pSyncCode: Promise.resolve('test'),
          postmessageSyncCode: Promise.resolve('test'),
          walletConnectSyncCode: Promise.resolve('test')
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
          p2pSyncCode: Promise.resolve('test'),
          postmessageSyncCode: Promise.resolve('test'),
          walletConnectSyncCode: Promise.resolve('test')
        }
      })
    })

    const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null)

    // handleClickInstallExtension is returned at index 12.
    act(() => {
      result.current[12]()
    })

    expect(windowOpenSpy).toHaveBeenCalledWith('https://extension.com', '_blank', 'noopener')
  })

  it('should handle clickOpenDesktopApp by opening the deep link with p2p payload and updating localStorage', () => {
    const desktopWallet = {
      key: 'wallet-desktop',
      name: 'Desktop Wallet',
      id: 'wallet-desktop-id',
      types: ['desktop'],
      deepLink: 'https://desktopapp.com/deeplink',
      links: {
        [OSLink.DESKTOP]: 'https://desktopapp.com/download'
      },
      image: 'https://desktopapp.com/icon.png'
    }
    wallets.set('wallet-desktop', desktopWallet)

    const p2pPayload = 'p2p-payload'
    const { result } = renderHook(() =>
      useConnect(false, 'wc-payload', p2pPayload, 'post-payload', wallets, onCloseHandler)
    )

    // Set the wallet state via handleClickWallet.
    act(() => {
      result.current[7]('wallet-desktop', {
        title: 'test',
        pairingPayload: {
          networkType: NetworkType.GHOSTNET,
          p2pSyncCode: Promise.resolve('test'),
          postmessageSyncCode: Promise.resolve('test'),
          walletConnectSyncCode: Promise.resolve('test')
        }
      })
    })

    const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null)

    // Call handleClickOpenDesktopApp (returned at index 13).
    act(() => {
      result.current[13]()
    })

    // Expect that the link opened is the one returned by getTzip10Link.
    expect(windowOpenSpy).toHaveBeenCalledWith('https://example.com/tzip10', '_blank', 'noopener')

    // Verify that localStorage was updated with type "desktop".
    const storedWallet = JSON.parse(localStorage.getItem(StorageKey.LAST_SELECTED_WALLET)!)
    expect(storedWallet).toEqual({
      key: desktopWallet.key,
      name: desktopWallet.name,
      type: 'desktop',
      icon: desktopWallet.image
    })
  })

  it('should handle clickDownloadDesktopApp by opening the download link', () => {
    const desktopWallet = {
      key: 'wallet-desktop',
      name: 'Desktop Wallet',
      id: 'wallet-desktop-id',
      types: ['desktop'],
      links: {
        [OSLink.DESKTOP]: 'https://desktopapp.com/download'
      },
      image: 'https://desktopapp.com/icon.png'
    }
    wallets.set('wallet-desktop', desktopWallet)

    const { result } = renderHook(() =>
      useConnect(false, 'wc-payload', 'p2p-payload', 'post-payload', wallets, onCloseHandler)
    )

    // Set the wallet state via handleClickWallet.
    act(() => {
      result.current[7]('wallet-desktop', {
        title: 'test',
        pairingPayload: {
          networkType: NetworkType.GHOSTNET,
          p2pSyncCode: Promise.resolve('test'),
          postmessageSyncCode: Promise.resolve('test'),
          walletConnectSyncCode: Promise.resolve('test')
        }
      })
    })

    const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null)

    // Call handleClickDownloadDesktopApp (returned at index 14).
    act(() => {
      result.current[14]()
    })

    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://desktopapp.com/download',
      '_blank',
      'noopener'
    )
  })

  // --- Additional tests for remaining branches --- //

  it('should handle wallet_connect branch with valid wcPayload (non-mobile)', () => {
    const wcWallet = {
      key: 'wallet-wc-valid',
      name: 'Valid Wallet',
      id: 'wallet-wc-valid-id',
      types: ['ios', 'web'],
      supportedInteractionStandards: ['wallet_connect'],
      links: {
        [OSLink.WEB]: 'https://wcwallet.com',
        [OSLink.IOS]: 'https://wcwallet-ios.com'
      },
      image: 'https://wcwallet.com/icon.png'
    }
    wallets.set('wallet-wc-valid', wcWallet)
    // Simulate valid payload by returning an object with a symKey.
    mockParseUri.mockReturnValue({ symKey: 'abc' })

    const { result } = renderHook(() =>
      useConnect(false, 'wc-payload', 'p2p-payload', 'post-payload', wallets, onCloseHandler)
    )

    act(() => {
      result.current[7]('wallet-wc-valid', {
        title: 'wc test',
        pairingPayload: {
          networkType: NetworkType.GHOSTNET,
          p2pSyncCode: Promise.resolve('test'),
          postmessageSyncCode: Promise.resolve('test'),
          walletConnectSyncCode: Promise.resolve('test')
        }
      })
    })

    // Since isMobile is false, the branch should set the QR code to wcPayload and then
    // call setInstallState which for a wallet with >1 type should change state to 'install'.
    expect(result.current[2]).toBe('wc-payload')
    expect(result.current[3]).toBe('install')
    expect(result.current[1]).toBe(false)
  })

  it('should handle wallet_connect branch with invalid wcPayload for a "kukai" wallet', () => {
    const wcWalletInvalid = {
      key: 'wallet-wc-invalid',
      name: 'Kukai Wallet',
      id: 'wallet-wc-invalid-id',
      types: ['web', 'ios'],
      supportedInteractionStandards: ['wallet_connect'],
      links: {
        [OSLink.WEB]: 'https://kukaiexample.com'
      },
      image: 'https://kukaiexample.com/icon.png'
    }
    wallets.set('wallet-wc-invalid', wcWalletInvalid)
    // Simulate invalid payload by returning an empty object (no symKey).
    mockParseUri.mockReturnValue({})

    const { result } = renderHook(() =>
      useConnect(
        false,
        'invalid-wc-payload',
        'p2p-payload',
        'post-payload',
        wallets,
        onCloseHandler
      )
    )

    act(() => {
      result.current[7]('wallet-wc-invalid', {
        title: 'wc invalid test',
        pairingPayload: {
          networkType: NetworkType.GHOSTNET,
          p2pSyncCode: Promise.resolve('test'),
          postmessageSyncCode: Promise.resolve('test'),
          walletConnectSyncCode: Promise.resolve('test')
        }
      })
    })

    // The branch for a "kukai" wallet with invalid wc payload should set QR to "error"
    // and then call setInstallState (which should change state to 'install' because wallet.types length > 1)
    expect(result.current[2]).toBe('error')
    expect(result.current[3]).toBe('install')
    expect(result.current[1]).toBe(false)
  })

  it('should handle mobileOS branch in handleClickWallet', () => {
    // Override isMobileOS to return true.
    jest.spyOn(platform, 'isMobileOS').mockReturnValue(true)
    const mobileWallet = {
      key: 'wallet-mobile',
      name: 'Mobile Wallet',
      id: 'wallet-mobile-id',
      types: ['ios'],
      links: {
        [OSLink.IOS]: 'https://mobilewallet-ios.com'
      },
      image: 'https://mobilewallet.com/icon.png'
    }
    wallets.set('wallet-mobile', mobileWallet)
    // isMobile is true.
    const { result } = renderHook(() =>
      useConnect(true, 'wc-payload', 'p2p-payload', 'post-payload', wallets, onCloseHandler)
    )

    const pairingPayload = {
      networkType: NetworkType.GHOSTNET,
      p2pSyncCode: Promise.resolve('test'),
      postmessageSyncCode: Promise.resolve('test'),
      walletConnectSyncCode: Promise.resolve('test')
    }

    // --- Return a real anchor element instead of a plain object ---
    const fakeAnchor = document.createElement('a')
    const originalCreateElement = document.createElement.bind(document)
    const createElementSpy = jest
      .spyOn(document, 'createElement')
      .mockImplementation((tag: string) => {
        if (tag === 'a') {
          return fakeAnchor
        }
        return originalCreateElement(tag)
      })

    act(() => {
      result.current[7]('wallet-mobile', {
        title: 'mobile test',
        pairingPayload
      })
    })

    // In this branch, qrCode should be set to empty string.
    expect(result.current[2]).toBe('')
    // updateSelectedWalletWithURL should have updated localStorage with url equal to "https://example.com/tzip10"
    const storedWallet = JSON.parse(localStorage.getItem(StorageKey.LAST_SELECTED_WALLET)!)
    expect(storedWallet.url).toBe('https://example.com/tzip10')
    expect(result.current[1]).toBe(false)

    createElementSpy.mockRestore()
  })

  it('should handle final else branch in handleClickWallet', () => {
    // Create a wallet that does not match any special conditions.
    const otherWallet = {
      key: 'wallet-final',
      name: 'Final Wallet',
      id: 'wallet-final-id',
      types: ['custom'],
      supportedInteractionStandards: [],
      links: {
        [OSLink.WEB]: 'https://finalwallet.com'
      },
      image: 'https://finalwallet.com/icon.png'
    }
    wallets.set('wallet-final', otherWallet)

    const { result } = renderHook(() =>
      useConnect(false, 'wc-payload', 'p2p-payload', 'post-payload', wallets, onCloseHandler)
    )

    act(() => {
      result.current[7]('wallet-final', {
        title: 'final test',
        pairingPayload: {
          networkType: NetworkType.GHOSTNET,
          p2pSyncCode: Promise.resolve('test'),
          postmessageSyncCode: Promise.resolve('test'),
          walletConnectSyncCode: Promise.resolve('test')
        }
      })
    })

    // For a wallet that doesn’t match any branch, it should simply set QR code to p2pPayload.
    expect(result.current[2]).toBe('p2p-payload')
    // setInstallState will not update the state because the wallet has only one type and not ios/desktop.
    expect(result.current[3]).toBe('top-wallets')
    expect(result.current[1]).toBe(false)
  })

  it('should handle handleNewTab with invalid wcPayload (wallet_connect branch)', () => {
    // Note: The wallet name is now "Other Wallet" so it does NOT contain "kukai" in its lower-case form.
    const newTabWallet = {
      key: 'wallet-newtab-invalid',
      name: 'Other Wallet',
      id: 'wallet-newtab-invalid-id',
      types: ['web'],
      supportedInteractionStandards: ['wallet_connect'] as any,
      links: ['https://newtabwallet.com', '', '', ''],
      image: 'https://newtabwallet.com/icon.png',
      descriptions: ['test']
    }
    wallets.set('wallet-newtab-invalid', newTabWallet)
    // Simulate invalid wc payload.
    mockParseUri.mockReturnValue({})

    const newTabMock = { opener: {}, location: { href: '' } }
    const windowOpenMock = jest.fn().mockReturnValue(newTabMock)
    window.open = windowOpenMock

    const { result } = renderHook(() =>
      useConnect(
        false,
        'invalid-wc-payload',
        'p2p-payload',
        'post-payload',
        wallets,
        onCloseHandler
      )
    )

    act(() => {
      // Directly call handleNewTab (returned at index 8).
      result.current[8](
        {
          title: 'new tab test',
          pairingPayload: {
            networkType: NetworkType.GHOSTNET,
            p2pSyncCode: Promise.resolve('test'),
            postmessageSyncCode: Promise.resolve('test'),
            walletConnectSyncCode: Promise.resolve('test')
          }
        },
        newTabWallet
      )
    })

    // Since the payload is invalid, the branch should return early.
    expect(newTabMock.location.href).toBe('')
    // LocalStorage should not be updated.
    expect(localStorage.getItem(StorageKey.LAST_SELECTED_WALLET)).toBeNull()
    // isWCWorking should be set to false.
    expect(result.current[6]).toBe(false)
  })

  it('should call onCloseHandler in handleDeepLinking when syncCode is empty', () => {
    const deepLinkWallet = {
      key: 'wallet-deeplink-close',
      name: 'DeepLink Wallet',
      id: 'wallet-deeplink-close-id',
      types: ['ios'],
      supportedInteractionStandards: ['wallet_connect'] as any,
      links: ['', '', '', ''],
      image: 'https://deeplinkwallet.com/icon.png',
      descriptions: ['test']
    }
    // Use empty wcPayload so that syncCode is empty.
    wallets.set('wallet-deeplink-close', deepLinkWallet)

    const { result } = renderHook(() =>
      useConnect(false, '', 'p2p-payload', 'post-payload', wallets, onCloseHandler)
    )

    act(() => {
      result.current[9](deepLinkWallet, '')
    })

    expect(onCloseHandler).toHaveBeenCalled()
  })

  it('should handle handleDeepLinking when wallet.links[OSLink.IOS] is present', () => {
    const deepLinkWallet = {
      key: 'wallet-deeplink',
      name: 'DeepLink Wallet',
      id: 'wallet-deeplink-id',
      types: ['ios'],
      supportedInteractionStandards: [],
      links: ['', 'https://ioswallet.com/', '', ''],
      image: 'https://ioswallet.com/icon.png',
      descriptions: ['test']
    }
    wallets.set('wallet-deeplink', deepLinkWallet)
    const testUri = 'my-uri'

    // --- Return a real anchor element ---
    const fakeAnchor = document.createElement('a')
    const setAttributeSpy = jest.spyOn(fakeAnchor, 'setAttribute')
    const dispatchEventSpy = jest.spyOn(fakeAnchor, 'dispatchEvent')
    // Save the original createElement to avoid recursion.
    const originalCreateElement = document.createElement.bind(document)
    const createElementSpy = jest
      .spyOn(document, 'createElement')
      .mockImplementation((tag: string) => {
        if (tag === 'a') {
          return fakeAnchor
        }
        return originalCreateElement(tag)
      })

    const { result } = renderHook(() =>
      useConnect(false, 'wc-payload', 'p2p-payload', 'post-payload', wallets, onCloseHandler)
    )

    act(() => {
      result.current[9](deepLinkWallet, testUri)
    })

    // updateSelectedWalletWithURL should have updated localStorage with url ending in "wc?uri="
    const storedWallet = JSON.parse(localStorage.getItem(StorageKey.LAST_SELECTED_WALLET)!)
    expect(storedWallet.url).toBe('https://ioswallet.com/wc?uri=')

    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(setAttributeSpy).toHaveBeenCalledWith(
      'href',
      `https://ioswallet.com/wc?uri=${encodeURIComponent(testUri)}`
    )
    expect(setAttributeSpy).toHaveBeenCalledWith('rel', 'noopener')
    expect(dispatchEventSpy).toHaveBeenCalled()

    createElementSpy.mockRestore()
  })

  it('should update state, QR code, showMoreContent, and displayQRExtra via update functions', () => {
    const { result } = renderHook(() =>
      useConnect(false, 'initial-wc', 'initial-p2p', 'initial-post', wallets, onCloseHandler)
    )

    // handleUpdateState is at index 15.
    act(() => {
      result.current[15](AlertState.BUG_REPORT)
    })
    expect(result.current[3]).toBe(AlertState.BUG_REPORT)

    // handleUpdateQRCode is at index 16.
    act(() => {
      result.current[16]('new-qr-code')
    })
    expect(result.current[2]).toBe('new-qr-code')

    // handleShowMoreContent is at index 17. (toggles boolean)
    const initialShowMore = result.current[5]
    act(() => {
      result.current[17]()
    })
    expect(result.current[5]).toBe(!initialShowMore)

    // handleDisplayQRExtra is at index 18.
    act(() => {
      result.current[18](true)
    })
    expect(result.current[4]).toBe(true)
  })
})
