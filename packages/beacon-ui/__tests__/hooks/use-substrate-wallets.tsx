import { renderHook } from '@testing-library/react'
import useSubstrateWallets from '../../src/ui/alert/hooks/useSubstrateWallets'

jest.mock('../../src/utils/wallets', () => ({
  arrangeTopWallets: jest.fn((wallets) => wallets),
  mergeWallets: jest.fn((wallets) => wallets),
  parseWallets: jest.fn((wallets) => wallets)
}))

jest.mock('../../src/utils/wallet-list-loader', () => ({
  getSubstrateWalletLists: jest.fn().mockResolvedValue({
    version: 1,
    desktopList: [
      {
        key: 'desktop1',
        shortName: 'Desktop Wallet',
        logo: 'desktop.png',
        downloadLink: 'desktop-link',
        deepLink: 'desktop-deep',
        supportedInteractionStandards: []
      }
    ],
    extensionList: [
      {
        id: 'ext1',
        key: 'extension1',
        shortName: 'Extension Wallet',
        logo: 'extension.png',
        link: 'extension-link',
        supportedInteractionStandards: []
      }
    ],
    iOSList: [
      {
        key: 'ios1',
        shortName: 'iOS Wallet',
        logo: 'ios.png',
        universalLink: 'ios-link',
        deepLink: 'ios-deep',
        supportedInteractionStandards: []
      }
    ],
    webList: [
      {
        key: 'web1',
        shortName: 'Web Wallet',
        logo: 'web.png',
        links: { mainnet: 'web-link-main', ghostnet: 'web-link-ghost' },
        supportedInteractionStandards: []
      }
    ]
  })
}))

describe('useSubstrateWallets', () => {
  test('returns wallets correctly for default parameters', () => {
    const { result } = renderHook(() => useSubstrateWallets())

    expect(result.current.size).toBe(4)
    expect(result.current.has('desktop1')).toBe(true)
    expect(result.current.has('extension1')).toBe(true)
    expect(result.current.has('ios1')).toBe(true)
    expect(result.current.has('web1')).toBe(true)

    expect(result.current.get('desktop1')).toMatchObject({
      name: 'Desktop Wallet',
      description: 'Desktop App'
    })

    expect(result.current.get('web1')).toMatchObject({
      link: 'web-link-main'
    })
  })

  test('returns only featured wallet if specified', () => {
    const { result } = renderHook(() => useSubstrateWallets(undefined, ['ios1']))

    expect(result.current.size).toBe(1)
    expect(result.current.has('ios1')).toBe(true)
  })

  test('falls back to all wallets if featured wallet is not found', () => {
    const { result } = renderHook(() => useSubstrateWallets(undefined, ['non-existent-wallet']))

    expect(result.current.size).toBe(4)
  })

  test('handles empty featured wallets list correctly', () => {
    const { result } = renderHook(() => useSubstrateWallets(undefined, []))

    expect(result.current.size).toBe(4)
  })
})
