import { renderHook, act, cleanup } from '@testing-library/react'
import useConnect from '../../src/ui/alert/hooks/useConnect'
import { StorageKey, ExtensionMessageTarget, NetworkType } from '@airgap/beacon-types'
import { windowRef } from '@airgap/beacon-core'
import getDefaultLogo from '../../src/ui/alert/getDefautlLogo'
import { OSLink } from '../../src/utils/wallets'
import { AlertState } from '../../src/ui/common'

jest.mock('../../src/utils/get-tzip10-link', () => ({
  getTzip10Link: jest.fn().mockReturnValue('https://example.com/tzip10')
}))

const mockParseUri = jest.fn()
jest.mock('@walletconnect/utils', () => ({
  parseUri: (...args: any[]) => mockParseUri(...args)
}))

jest.mock('../../src/utils/platform', () => ({
  isTwBrowser: jest.fn().mockReturnValue(false),
  isAndroid: jest.fn().mockReturnValue(false),
  isMobileOS: jest.fn().mockReturnValue(false),
  isIOS: jest.fn().mockReturnValue(false)
}))

HTMLAnchorElement.prototype.click = jest.fn()
global.window.URL.createObjectURL = jest.fn()

// Mock window.open properly
const windowOpenMock = jest.fn()

beforeEach(() => {
  window.open = windowOpenMock
  localStorage.clear()
  mockParseUri.mockReset()
})

afterEach(() => {
  cleanup()
  jest.clearAllMocks()
})

describe('useConnect hook', () => {
  let wallets: Map<string, any>
  let onCloseHandler: jest.Mock

  beforeEach(() => {
    wallets = new Map()
    onCloseHandler = jest.fn()
  })

  it('should initialize with default values', async () => {
    const { result } = renderHook(() =>
      useConnect(
        false,
        Promise.resolve('wc-payload'),
        Promise.resolve('p2p-payload'),
        Promise.resolve('post-payload'),
        wallets,
        onCloseHandler
      )
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

  it('should handle clickOther and update state to "qr"', async () => {
    const { result } = renderHook(() =>
      useConnect(
        false,
        Promise.resolve('wc-payload'),
        Promise.resolve('p2p-payload'),
        Promise.resolve('post-payload'),
        wallets,
        onCloseHandler
      )
    )

    act(() => {
      result.current[10]()
    })

    const storedWallet = JSON.parse(localStorage.getItem(StorageKey.LAST_SELECTED_WALLET)!)
    expect(storedWallet).toEqual({
      key: 'wallet',
      name: 'wallet',
      type: 'mobile',
      icon: getDefaultLogo()
    })
    expect(result.current[3]).toBe('qr')
  })

  it('should handle clickWallet for a web wallet and open a new tab', async () => {
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

    // Mock window.open to return a fake new-tab object.
    const newTabMock = { opener: {}, location: { href: '' } }
    const windowOpenMock = jest.fn().mockReturnValue(newTabMock)
    window.open = windowOpenMock

    const { result } = renderHook(() =>
      useConnect(
        false,
        Promise.resolve('wc-payload'),
        Promise.resolve('p2p-payload'),
        Promise.resolve('post-payload'),
        wallets,
        onCloseHandler
      )
    )

    // Wrap the async click handler in async act.
    await act(async () => {
      await result.current[7]('wallet1', {
        title: 'test',
        pairingPayload: {
          networkType: NetworkType.GHOSTNET,
          p2pSyncCode: Promise.resolve('test'),
          postmessageSyncCode: Promise.resolve('test'),
          walletConnectSyncCode: Promise.resolve('test')
        }
      })
    })

    expect(windowOpenMock).toHaveBeenCalledWith('', '_blank')
    expect(newTabMock.location.href).toBe('https://example.com/tzip10')

    const storedWallet = JSON.parse(localStorage.getItem(StorageKey.LAST_SELECTED_WALLET)!)
    expect(storedWallet).toEqual({
      key: testWallet.key,
      name: testWallet.name,
      type: 'web',
      icon: testWallet.image
    })
  })

  it('should handle clickConnectExtension and post messages', async () => {
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

    const { result } = renderHook(() =>
      useConnect(
        false,
        Promise.resolve('wc-payload'),
        Promise.resolve('p2p-payload'),
        Promise.resolve(postPayload),
        wallets,
        onCloseHandler
      )
    )

    await act(async () => {
      await result.current[7]('wallet-ext', {
        title: 'test',
        pairingPayload: {
          networkType: NetworkType.GHOSTNET,
          p2pSyncCode: Promise.resolve('test'),
          postmessageSyncCode: Promise.resolve('test'),
          walletConnectSyncCode: Promise.resolve('test')
        }
      })
    })

    const postMessageSpy = jest.spyOn(windowRef, 'postMessage').mockImplementation(() => {})

    await act(async () => {
      await result.current[11]()
    })

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

    const storedWallet = JSON.parse(localStorage.getItem(StorageKey.LAST_SELECTED_WALLET)!)
    expect(storedWallet).toEqual({
      key: extensionWallet.key,
      name: extensionWallet.name,
      type: 'extension',
      icon: extensionWallet.image
    })
  })

  it('should handle clickInstallExtension by opening the extension URL', async () => {
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
      useConnect(
        false,
        Promise.resolve('wc-payload'),
        Promise.resolve('p2p-payload'),
        Promise.resolve('post-payload'),
        wallets,
        onCloseHandler
      )
    )

    await act(async () => {
      await result.current[7]('wallet-ext', {
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

    // handleClickInstallExtension is synchronous.
    act(() => {
      result.current[12]()
    })

    expect(windowOpenSpy).toHaveBeenCalledWith('https://extension.com', '_blank', 'noopener')
  })

  it('should handle clickOpenDesktopApp by opening the deep link with p2p payload and updating localStorage', async () => {
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
      useConnect(
        false,
        Promise.resolve('wc-payload'),
        Promise.resolve(p2pPayload),
        Promise.resolve('post-payload'),
        wallets,
        onCloseHandler
      )
    )

    await act(async () => {
      await result.current[7]('wallet-desktop', {
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

    await act(async () => {
      await result.current[13]()
    })

    expect(windowOpenSpy).toHaveBeenCalledWith('https://example.com/tzip10', '_blank', 'noopener')

    const storedWallet = JSON.parse(localStorage.getItem(StorageKey.LAST_SELECTED_WALLET)!)
    expect(storedWallet).toEqual({
      key: desktopWallet.key,
      name: desktopWallet.name,
      type: 'desktop',
      icon: desktopWallet.image
    })
  })

  it('should handle clickDownloadDesktopApp by opening the download link', async () => {
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
      useConnect(
        false,
        Promise.resolve('wc-payload'),
        Promise.resolve('p2p-payload'),
        Promise.resolve('post-payload'),
        wallets,
        onCloseHandler
      )
    )

    await act(async () => {
      await result.current[7]('wallet-desktop', {
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

  it('should handle wallet_connect branch with valid wcPayload (non-mobile)', async () => {
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
    mockParseUri.mockReturnValue({ symKey: 'abc' })

    const { result } = renderHook(() =>
      useConnect(
        false,
        Promise.resolve('wc-payload'),
        Promise.resolve('p2p-payload'),
        Promise.resolve('post-payload'),
        wallets,
        onCloseHandler
      )
    )

    await act(async () => {
      await result.current[7]('wallet-wc-valid', {
        title: 'wc test',
        pairingPayload: {
          networkType: NetworkType.GHOSTNET,
          p2pSyncCode: Promise.resolve('test'),
          postmessageSyncCode: Promise.resolve('test'),
          walletConnectSyncCode: Promise.resolve('test')
        }
      })
    })

    expect(result.current[2]).toBe('wc-payload')
    expect(result.current[3]).toBe('install')
    expect(result.current[1]).toBe(false)
  })

  it('should handle wallet_connect branch with invalid wcPayload for a "kukai" wallet', async () => {
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
    mockParseUri.mockReturnValue({})

    const { result } = renderHook(() =>
      useConnect(
        false,
        Promise.resolve('invalid-wc-payload'),
        Promise.resolve('p2p-payload'),
        Promise.resolve('post-payload'),
        wallets,
        onCloseHandler
      )
    )

    await act(async () => {
      await result.current[7]('wallet-wc-invalid', {
        title: 'wc invalid test',
        pairingPayload: {
          networkType: NetworkType.GHOSTNET,
          p2pSyncCode: Promise.resolve('test'),
          postmessageSyncCode: Promise.resolve('test'),
          walletConnectSyncCode: Promise.resolve('test')
        }
      })
    })

    expect(result.current[2]).toBe('error')
    expect(result.current[3]).toBe('install')
    expect(result.current[1]).toBe(false)
  })

  it('should handle final else branch in handleClickWallet', async () => {
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
      useConnect(
        false,
        Promise.resolve('wc-payload'),
        Promise.resolve('p2p-payload'),
        Promise.resolve('post-payload'),
        wallets,
        onCloseHandler
      )
    )

    await act(async () => {
      await result.current[7]('wallet-final', {
        title: 'final test',
        pairingPayload: {
          networkType: NetworkType.GHOSTNET,
          p2pSyncCode: Promise.resolve('test'),
          postmessageSyncCode: Promise.resolve('test'),
          walletConnectSyncCode: Promise.resolve('test')
        }
      })
    })

    expect(result.current[2]).toBe('p2p-payload')
    expect(result.current[3]).toBe('top-wallets')
    expect(result.current[1]).toBe(false)
  })

  it('should handle handleNewTab with invalid wcPayload (wallet_connect branch)', async () => {
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
    mockParseUri.mockReturnValue({})

    const newTabMock = { opener: {}, location: { href: '' } }
    const windowOpenMock = jest.fn().mockReturnValue(newTabMock)
    window.open = windowOpenMock

    const { result } = renderHook(() =>
      useConnect(
        false,
        Promise.resolve('invalid-wc-payload'),
        Promise.resolve('p2p-payload'),
        Promise.resolve('post-payload'),
        wallets,
        onCloseHandler
      )
    )

    await act(async () => {
      await result.current[8](
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

    expect(newTabMock.location.href).toBe('')
    expect(localStorage.getItem(StorageKey.LAST_SELECTED_WALLET)).toBeNull()
    expect(result.current[6]).toBe(false)
  })

  it('should call onCloseHandler in handleDeepLinking when syncCode is empty', async () => {
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
    wallets.set('wallet-deeplink-close', deepLinkWallet)

    const { result } = renderHook(() =>
      useConnect(
        false,
        Promise.resolve(''),
        Promise.resolve('p2p-payload'),
        Promise.resolve('post-payload'),
        wallets,
        onCloseHandler
      )
    )

    await act(async () => {
      await result.current[9](deepLinkWallet)
    })

    expect(onCloseHandler).toHaveBeenCalled()
  })

  // Updated test: pass testUri as p2pPayload so that the expected deep link is generated.
  it('should handle handleDeepLinking when wallet.links[OSLink.IOS] is present', async () => {
    const wcPayload = 'wc-payload'
    const deepLinkWallet = {
      key: 'wallet-deeplink',
      name: 'DeepLink Wallet',
      id: 'wallet-deeplink-id',
      types: ['ios'],
      supportedInteractionStandards: ['wallet_connect'] as any,
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
      useConnect(
        false,
        Promise.resolve(wcPayload),
        Promise.resolve(testUri), // Use testUri as the p2pPayload value
        Promise.resolve('post-payload'),
        wallets,
        onCloseHandler
      )
    )

    await act(async () => {
      await result.current[9](deepLinkWallet)
    })

    const storedWallet = JSON.parse(localStorage.getItem(StorageKey.LAST_SELECTED_WALLET)!)
    expect(storedWallet.url).toBe(`https://ioswallet.com/wc?uri=${wcPayload}`)

    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(setAttributeSpy).toHaveBeenCalledWith(
      'href',
      `https://ioswallet.com/wc?uri=${encodeURIComponent(wcPayload)}`
    )
    expect(setAttributeSpy).toHaveBeenCalledWith('rel', 'noopener')
    expect(dispatchEventSpy).toHaveBeenCalled()

    createElementSpy.mockRestore()
  })

  it('should update state, QR code, showMoreContent, and displayQRExtra via update functions', () => {
    const { result } = renderHook(() =>
      useConnect(
        false,
        Promise.resolve('initial-wc'),
        Promise.resolve('initial-p2p'),
        Promise.resolve('initial-post'),
        wallets,
        onCloseHandler
      )
    )

    act(() => {
      result.current[15](AlertState.BUG_REPORT)
    })
    expect(result.current[3]).toBe(AlertState.BUG_REPORT)

    act(() => {
      result.current[16]('new-qr-code')
    })
    expect(result.current[2]).toBe('new-qr-code')

    const initialShowMore = result.current[5]
    act(() => {
      result.current[17]()
    })
    expect(result.current[5]).toBe(!initialShowMore)

    act(() => {
      result.current[18](true)
    })
    expect(result.current[4]).toBe(true)
  })

  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })
})
