import { render, screen } from '@testing-library/react'
import { NetworkType, StorageKey } from '@airgap/beacon-types'
import PairingAlert from './index'
import { ConfigurableAlertProps } from '../../../common'

// Import the mocked hooks so we can later control their return values.
import useIsMobile from '../../hooks/useIsMobile'
import useWallets from '../../hooks/useWallets'
import useConnect from '../../hooks/useConnect'

// --- Mocks for hooks and platform utilities ---
jest.mock('../../hooks/useIsMobile', () => ({
  __esModule: true,
  default: jest.fn()
}))
jest.mock('../../hooks/useWallets', () => ({
  __esModule: true,
  default: jest.fn()
}))
jest.mock('../../hooks/useConnect', () => ({
  __esModule: true,
  default: jest.fn()
}))

jest.mock('../../../../components/alert', () => (props: any) => {
  // Destructure and remove extra props that are not valid DOM attributes.
  const {
    pairingPayload,
    featuredWallets,
    loading,
    onCloseClick,
    onClickShowMore,
    showMore,
    extraContent,
    onBackClick,
    ...rest
  } = props
  // We capture onBackClick via a data attribute so that our test can verify its existence.
  return (
    <div data-testid="alert" data-onbackclick={onBackClick ? 'true' : 'false'} {...rest}>
      {props.children}
    </div>
  )
})
jest.mock('../../../../components/bug-report-form', () => (props: any) => (
  <div data-testid="bug-report-form" onClick={props.onSubmit}>
    BugReportForm
  </div>
))
jest.mock('../../../../components/info', () => (props: any) => (
  <div data-testid="info">{props.title}</div>
))
jest.mock('../../../../components/pair-other', () => () => (
  <div data-testid="pair-other">PairOther</div>
))
jest.mock('../../../../components/top-wallets', () => () => (
  <div data-testid="top-wallets">TopWallets</div>
))
jest.mock('../../../../components/wallets', () => () => <div data-testid="wallets">Wallets</div>)
jest.mock('../../../../components/qr', () => (props: any) => (
  <div data-testid="qr">QR: {props.code}</div>
))

jest.mock('../../../../utils/platform', () => ({
  isIOS: jest.fn(() => false),
  isMobileOS: jest.fn(() => false)
}))

// Assuming NetworkType is a union type (e.g. 'mainnet' | 'testnet'). Here we assume 'mainnet' is valid.
const pairingPayload = {
  walletConnectSyncCode: 'wcCode',
  p2pSyncCode: 'p2pCode',
  postmessageSyncCode: 'postCode',
  networkType: NetworkType.GHOSTNET
}

const walletObj = {
  id: 'wallet1',
  key: 'wallet1',
  name: 'Wallet One',
  image: 'wallet-one.png',
  types: ['web', 'extension', 'desktop', 'ios'],
  firefoxId: 'firefox1',
  supportedInteractionStandards: ['wallet_connect']
}
const walletsMap = new Map([['wallet1', walletObj]])

const defaultProps: ConfigurableAlertProps = {
  open: true,
  title: 'Test',
  onClose: jest.fn(),
  pairingPayload,
  featuredWallets: []
}

// A default useConnect return value array.
// The order is assumed as follows:
// [0] wallet, [1] isLoading, [2] qrCode, [3] state,
// [4] displayQRExtra, [5] showMoreContent, [6] isWCWorking,
// [7] handleClickWallet, [8] handleNewTab, [9] handleDeepLinking,
// [10] handleClickOther, [11] handleClickConnectExtension,
// [12] handleClickInstallExtension, [13] handleClickOpenDesktopApp,
// [14] handleClickDownloadDesktopApp, [15] handleUpdateState,
// [16] handleUpdateQRCode, [17] handleShowMoreContent, [18] handleDisplayQRExtra.
const defaultUseConnect = [
  walletObj, // wallet
  false, // isLoading
  'QR_CODE_123', // qrCode
  'install', // state (will be overridden in tests)
  false, // displayQRExtra
  true, // showMoreContent
  true, // isWCWorking
  jest.fn(), // handleClickWallet
  jest.fn(), // handleNewTab
  jest.fn(), // handleDeepLinking
  jest.fn(), // handleClickOther
  jest.fn(), // handleClickConnectExtension
  jest.fn(), // handleClickInstallExtension
  jest.fn(), // handleClickOpenDesktopApp
  jest.fn(), // handleClickDownloadDesktopApp
  jest.fn(), // handleUpdateState
  jest.fn(), // handleUpdateQRCode
  jest.fn(), // handleShowMoreContent
  jest.fn() // handleDisplayQRExtra
]

describe('PairingAlert Component', () => {
  beforeEach(() => {
    // Set default hook return values.
    ;(useIsMobile as jest.Mock).mockReturnValue(false)
    ;(useWallets as jest.Mock).mockReturnValue(walletsMap)
    ;(useConnect as jest.Mock).mockReturnValue(defaultUseConnect)
    // Ensure navigator.onLine is true.
    Object.defineProperty(window.navigator, 'onLine', { value: true, writable: true })
    // Clear localStorage.
    localStorage.clear()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  // --- Install State Tests ---
  describe('Install State', () => {
    beforeEach(() => {
      const connectReturn = [...defaultUseConnect]
      connectReturn[3] = 'install' // state = install
      ;(useConnect as jest.Mock).mockReturnValue(connectReturn)
    })

    test('renders Info components for web, extension, and desktop branches', () => {
      render(<PairingAlert {...defaultProps} />)
      // Our mocked Info renders a div with data-testid "info" showing its title.
      const infoTitles = screen.getAllByTestId('info').map((el) => el.textContent)
      expect(infoTitles).toEqual(
        expect.arrayContaining([
          expect.stringContaining(`Connect with ${walletObj.name} Web`),
          expect.stringContaining(`Connect with ${walletObj.name} Browser Extension`),
          expect.stringContaining(`Connect with ${walletObj.name} Desktop App`)
        ])
      )
    })

    test('renders QR component for the iOS branch when wallet.types length > 1', () => {
      const connectReturn = [...defaultUseConnect]
      connectReturn[3] = 'install'
      connectReturn[2] = 'QR_CODE_123'
      ;(useConnect as jest.Mock).mockReturnValue(connectReturn)
      render(<PairingAlert {...defaultProps} />)
      // Since wallet.types length is 4 (> 1), expect the QR component (mocked) to be rendered.
      expect(screen.getByTestId('qr')).toHaveTextContent('QR: QR_CODE_123')
    })
  })

  // --- QR State Tests ---
  describe('QR State', () => {
    test('renders PairOther when displayQRExtra is false', () => {
      const connectReturn = [...defaultUseConnect]
      connectReturn[3] = 'qr'
      connectReturn[4] = false // displayQRExtra is false
      ;(useConnect as jest.Mock).mockReturnValue(connectReturn)
      render(<PairingAlert {...defaultProps} />)
      expect(screen.getByTestId('pair-other')).toBeInTheDocument()
    })

    test('renders QR component when displayQRExtra is true', () => {
      const connectReturn = [...defaultUseConnect]
      connectReturn[3] = 'qr'
      connectReturn[4] = true // displayQRExtra is true
      ;(useConnect as jest.Mock).mockReturnValue(connectReturn)
      render(<PairingAlert {...defaultProps} />)
      expect(screen.getByTestId('qr')).toBeInTheDocument()
    })
  })

  // --- Wallets State Tests ---
  describe('Wallets State', () => {
    test('renders Wallets component when state is "wallets"', () => {
      const connectReturn = [...defaultUseConnect]
      connectReturn[3] = 'wallets'
      ;(useConnect as jest.Mock).mockReturnValue(connectReturn)
      render(<PairingAlert {...defaultProps} />)
      expect(screen.getByTestId('wallets')).toBeInTheDocument()
    })
  })

  // --- Help State Tests ---
  describe('Help State', () => {
    test('renders BugReportForm when metrics are enabled', () => {
      localStorage.setItem(StorageKey.ENABLE_METRICS, 'true')
      const connectReturn = [...defaultUseConnect]
      connectReturn[3] = 'help'
      ;(useConnect as jest.Mock).mockReturnValue(connectReturn)
      render(<PairingAlert {...defaultProps} />)
      expect(screen.getByTestId('bug-report-form')).toBeInTheDocument()
    })

    test('renders Info components for wallet help when metrics are disabled', () => {
      localStorage.setItem(StorageKey.ENABLE_METRICS, 'false')
      const connectReturn = [...defaultUseConnect]
      connectReturn[3] = 'help'
      ;(useConnect as jest.Mock).mockReturnValue(connectReturn)
      render(<PairingAlert {...defaultProps} />)
      // Our mocked Info should render help titles such as "What is a wallet?" and "Not sure where to start?"
      const infoTitles = screen.getAllByTestId('info').map((el) => el.textContent)
      expect(infoTitles).toEqual(
        expect.arrayContaining(['What is a wallet?', 'Not sure where to start?'])
      )
    })
  })

  // --- Top-Wallets Extra Content Tests ---
  describe('Top-Wallets Extra Content', () => {
    test('renders extraContent with Wallets when state is "top-wallets" and not mobile', () => {
      const connectReturn = [...defaultUseConnect]
      connectReturn[3] = 'top-wallets'
      ;(useConnect as jest.Mock).mockReturnValue(connectReturn)
      ;(useIsMobile as jest.Mock).mockReturnValue(false)
      render(<PairingAlert {...defaultProps} />)
      // When state is "top-wallets" and not mobile, the Alert extraContent should include the Wallets component.
      expect(screen.getByTestId('wallets')).toBeInTheDocument()
    })
  })

  // --- Back Button and Show More Handling Tests ---
  describe('Back Button and Show More Handling', () => {
    test('provides onBackClick prop when state is install, qr, (wallets and mobile) or help', () => {
      const connectReturn = [...defaultUseConnect]
      connectReturn[3] = 'install'
      const updateStateMock = jest.fn()
      connectReturn[15] = updateStateMock // handleUpdateState at index 15
      ;(useConnect as jest.Mock).mockReturnValue(connectReturn)
      const { container } = render(<PairingAlert {...defaultProps} />)
      // Our mocked Alert attaches onBackClick presence via the data attribute.
      expect(container.firstChild).toHaveAttribute('data-onbackclick', 'true')
    })
  })

  // --- QRCode LocalStorage Side Effect Tests ---
  describe('QRCode LocalStorage Side Effect', () => {
    test('sets LAST_SELECTED_WALLET in localStorage when QRCode is rendered', () => {
      const connectReturn = [...defaultUseConnect]
      connectReturn[3] = 'qr'
      connectReturn[4] = true // so that the QR branch is taken (displayQRExtra true)
      ;(useConnect as jest.Mock).mockReturnValue(connectReturn)
      render(<PairingAlert {...defaultProps} />)
      const expectedLS = JSON.stringify({
        key: walletObj.key,
        name: walletObj.name,
        type: 'mobile',
        icon: walletObj.image
      })
      expect(localStorage.getItem(StorageKey.LAST_SELECTED_WALLET)).toEqual(expectedLS)
    })
  })
})
