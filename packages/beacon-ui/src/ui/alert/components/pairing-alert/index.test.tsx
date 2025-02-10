import { render, screen, fireEvent } from '@testing-library/react'
import { NetworkType, StorageKey } from '@airgap/beacon-types'
import PairingAlert from './index'
import { ConfigurableAlertProps } from '../../../common'

// --- Mocks for hooks and platform utilities ---
import useIsMobile from '../../hooks/useIsMobile'
import useWallets from '../../hooks/useWallets'
import useConnect from '../../hooks/useConnect'

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

// Updated Alert mock: extraContent is wrapped with a unique test id.
jest.mock('../../../../components/alert', () => (props: any) => {
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
  return (
    <div data-testid="alert" data-onbackclick={onBackClick ? 'true' : 'false'} {...rest}>
      {props.children}
      {extraContent && <div data-testid="alert-extra-content">{extraContent}</div>}
    </div>
  )
})

// Other mocks
jest.mock('../../../../components/bug-report-form', () => (props: any) => (
  <div data-testid="bug-report-form" onClick={props.onSubmit}>
    BugReportForm
  </div>
))
jest.mock('../../../../components/info', () => (props: any) => (
  <div data-testid="info">
    <div>{props.title}</div>
    <div>{props.description}</div>
    {props.buttons &&
      props.buttons.map((button: any, index: number) => (
        <button key={index} data-testid="info-button" onClick={button.onClick}>
          {button.label}
        </button>
      ))}
    {props.onShowQRCodeClick && (
      <button data-testid="qr-button" onClick={props.onShowQRCodeClick}>
        QR
      </button>
    )}
  </div>
))
jest.mock('../../../../components/pair-other', () => () => (
  <div data-testid="pair-other">PairOther</div>
))
jest.mock('../../../../components/top-wallets', () => (props: any) => (
  <div data-testid="top-wallets">
    TopWallets
    {props.otherWallets && (
      <button data-testid="other-wallets-btn" onClick={props.otherWallets.onClick}>
        Other Wallets
      </button>
    )}
  </div>
))
jest.mock('../../../../components/wallets', () => () => <div data-testid="wallets">Wallets</div>)
jest.mock('../../../../components/qr', () => (props: any) => (
  <div data-testid="qr">
    QR: {props.code} - isMobile: {props.isMobile ? 'true' : 'false'}
  </div>
))

// Override platform utils.
import * as platformUtils from '../../../../utils/platform'
jest.mock('../../../../utils/platform', () => ({
  isIOS: jest.fn(() => false),
  isMobileOS: jest.fn(() => false)
}))

// --- Test Data ---
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
// Default wallets map (with one wallet) used in most tests.
const walletsMap = new Map<string, typeof walletObj>([['wallet1', walletObj]])

const defaultProps: ConfigurableAlertProps = {
  open: true,
  title: 'Test',
  onClose: jest.fn(),
  pairingPayload,
  featuredWallets: []
}

// A default useConnect return value array.
// Index positions:
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
    ;(useIsMobile as jest.Mock).mockReturnValue(false)
    ;(useWallets as jest.Mock).mockReturnValue(walletsMap)
    ;(useConnect as jest.Mock).mockReturnValue(defaultUseConnect)
    Object.defineProperty(window.navigator, 'onLine', { value: true, writable: true })
    localStorage.clear()
    ;(platformUtils.isIOS as jest.Mock).mockReturnValue(false)
    ;(platformUtils.isMobileOS as jest.Mock).mockReturnValue(false)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  // --- Install State Tests ---
  describe('Install State', () => {
    beforeEach(() => {
      const connectReturn = [...defaultUseConnect]
      connectReturn[3] = 'install'
      ;(useConnect as jest.Mock).mockReturnValue(connectReturn)
    })

    test('renders Info components for web, extension, and desktop branches', () => {
      render(<PairingAlert {...defaultProps} />)
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
      expect(screen.getByTestId('qr')).toHaveTextContent('QR: QR_CODE_123 - isMobile: false')
    })

    test('renders QR component with isMobile true when wallet.types length equals 1', () => {
      const iosWallet = { ...walletObj, types: ['ios'] }
      // For non-mobile mode, we can supply a small map.
      const walletsMapSingle = new Map([['wallet1', iosWallet]])
      ;(useWallets as jest.Mock).mockReturnValue(walletsMapSingle)
      const connectReturn = [...defaultUseConnect]
      connectReturn[0] = iosWallet
      connectReturn[3] = 'install'
      connectReturn[2] = 'QR_CODE_SINGLE'
      ;(useConnect as jest.Mock).mockReturnValue(connectReturn)
      render(<PairingAlert {...defaultProps} />)
      expect(screen.getByTestId('qr')).toHaveTextContent('QR: QR_CODE_SINGLE - isMobile: true')
    })

    test('clicking "Use Browser" button calls handleNewTab', () => {
      const newTabMock = jest.fn()
      const connectReturn = [...defaultUseConnect]
      connectReturn[3] = 'install'
      connectReturn[8] = newTabMock
      ;(useConnect as jest.Mock).mockReturnValue(connectReturn)
      render(<PairingAlert {...defaultProps} />)
      const useBrowserBtn = screen.getByText('Use Browser')
      fireEvent.click(useBrowserBtn)
      expect(newTabMock).toHaveBeenCalled()
    })

    test('clicking "Use Extension" button calls handleClickConnectExtension when firefoxId exists', () => {
      const clickConnectMock = jest.fn()
      const connectReturn = [...defaultUseConnect]
      connectReturn[3] = 'install'
      connectReturn[11] = clickConnectMock
      ;(useConnect as jest.Mock).mockReturnValue(connectReturn)
      render(<PairingAlert {...defaultProps} />)
      const useExtensionBtn = screen.getByText('Use Extension')
      fireEvent.click(useExtensionBtn)
      expect(clickConnectMock).toHaveBeenCalled()
    })

    test('clicking "Install extension" button calls handleClickInstallExtension when firefoxId is missing', () => {
      const walletNoFirefox = { ...walletObj, firefoxId: undefined }
      const walletsMapNoFirefox = new Map([['wallet1', walletNoFirefox]])
      ;(useWallets as jest.Mock).mockReturnValue(walletsMapNoFirefox)
      const connectReturn = [...defaultUseConnect]
      connectReturn[0] = walletNoFirefox as any
      connectReturn[3] = 'install'
      const installExtensionMock = jest.fn()
      connectReturn[12] = installExtensionMock
      ;(useConnect as jest.Mock).mockReturnValue(connectReturn)
      render(<PairingAlert {...defaultProps} />)
      const installExtensionBtn = screen.getByText('Install extension')
      fireEvent.click(installExtensionBtn)
      expect(installExtensionMock).toHaveBeenCalled()
    })

    test('clicking desktop app buttons calls appropriate handlers', () => {
      const clickOpenDesktopApp = jest.fn()
      const clickDownloadDesktopApp = jest.fn()
      const connectReturn = [...defaultUseConnect]
      connectReturn[3] = 'install'
      connectReturn[13] = clickOpenDesktopApp
      connectReturn[14] = clickDownloadDesktopApp
      ;(useConnect as jest.Mock).mockReturnValue(connectReturn)
      render(<PairingAlert {...defaultProps} />)
      const openDesktopBtn = screen.getByText('Open desktop app')
      const downloadDesktopBtn = screen.getByText('Download desktop app')
      fireEvent.click(openDesktopBtn)
      fireEvent.click(downloadDesktopBtn)
      expect(clickOpenDesktopApp).toHaveBeenCalled()
      expect(clickDownloadDesktopApp).toHaveBeenCalled()
    })
  })

  // --- QR State Tests ---
  describe('QR State', () => {
    test('renders PairOther when displayQRExtra is false', () => {
      const connectReturn = [...defaultUseConnect]
      connectReturn[3] = 'qr'
      connectReturn[4] = false
      ;(useConnect as jest.Mock).mockReturnValue(connectReturn)
      render(<PairingAlert {...defaultProps} />)
      expect(screen.getByTestId('pair-other')).toBeInTheDocument()
    })

    test('renders QR component when displayQRExtra is true', () => {
      const connectReturn = [...defaultUseConnect]
      connectReturn[3] = 'qr'
      connectReturn[4] = true
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
      expect(screen.getAllByTestId('wallets').length).toBeGreaterThan(0)
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
      const infoTexts = screen.getAllByTestId('info').map((el) => el.textContent)
      expect(infoTexts).toEqual(
        expect.arrayContaining([
          expect.stringContaining('What is a wallet?'),
          expect.stringContaining('Not sure where to start?')
        ])
      )
    })

    test('clicking on BugReportForm calls onClose', () => {
      localStorage.setItem(StorageKey.ENABLE_METRICS, 'true')
      const onCloseMock = jest.fn()
      const newProps = { ...defaultProps, onClose: onCloseMock }
      const connectReturn = [...defaultUseConnect]
      connectReturn[3] = 'help'
      ;(useConnect as jest.Mock).mockReturnValue(connectReturn)
      render(<PairingAlert {...newProps} />)
      const bugReport = screen.getByTestId('bug-report-form')
      fireEvent.click(bugReport)
      expect(onCloseMock).toHaveBeenCalled()
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
      const extraContent = screen.getByTestId('alert-extra-content')
      expect(extraContent).toBeInTheDocument()
      expect(extraContent).toHaveTextContent('Wallets')
    })
  })

  // --- Other State Tests ---
  describe('Other State', () => {
    test('renders TopWallets when state is not install, qr, wallets, or help', () => {
      const connectReturn = [...defaultUseConnect]
      connectReturn[3] = 'other'
      ;(useConnect as jest.Mock).mockReturnValue(connectReturn)
      render(<PairingAlert {...defaultProps} />)
      const topWallets = screen.getByTestId('top-wallets')
      expect(topWallets).toBeInTheDocument()
      expect(topWallets.parentElement).toHaveStyle('opacity: 1')
    })
  })

  // --- Back Button and Show More Handling Tests ---
  describe('Back Button and Show More Handling', () => {
    test('provides onBackClick prop when state is install, qr, (wallets and mobile) or help', () => {
      const connectReturn = [...defaultUseConnect]
      connectReturn[3] = 'install'
      const updateStateMock = jest.fn()
      connectReturn[15] = updateStateMock
      ;(useConnect as jest.Mock).mockReturnValue(connectReturn)
      const { container } = render(<PairingAlert {...defaultProps} />)
      expect(container.firstChild).toHaveAttribute('data-onbackclick', 'true')
    })
  })

  // --- QRCode LocalStorage Side Effect Tests ---
  describe('QRCode LocalStorage Side Effect', () => {
    test('sets LAST_SELECTED_WALLET in localStorage when QRCode is rendered', () => {
      const connectReturn = [...defaultUseConnect]
      connectReturn[3] = 'qr'
      connectReturn[4] = true
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

  // --- Mobile OS Branch Tests ---
  describe('Mobile OS Branch', () => {
    test('renders error Info when on mobile OS and wallet_connect is supported but isWCWorking is false', () => {
      ;(platformUtils.isMobileOS as jest.Mock).mockReturnValue(true)
      const connectReturn = [...defaultUseConnect]
      connectReturn[3] = 'install'
      connectReturn[6] = false // force error branch
      ;(useConnect as jest.Mock).mockReturnValue(connectReturn)
      render(<PairingAlert {...defaultProps} />)
      const infoElements = screen.getAllByTestId('info')
      const errorInfo = infoElements.find(
        (el) => el.textContent?.includes(`Connect with ${walletObj.name} Mobile`)
      )
      expect(errorInfo).toBeDefined()
    })

    test('mobile OS Info "QR" button calls appropriate handlers', () => {
      ;(platformUtils.isMobileOS as jest.Mock).mockReturnValue(true)
      const updateStateMock = jest.fn()
      const updateQRCodeMock = jest.fn()
      const displayQRExtraMock = jest.fn()
      const deepLinkingMock = jest.fn()
      const connectReturn = [...defaultUseConnect]
      connectReturn[3] = 'install'
      connectReturn[6] = true // isWCWorking true so that Info renders normally
      connectReturn[15] = updateStateMock
      connectReturn[16] = updateQRCodeMock
      connectReturn[18] = displayQRExtraMock
      connectReturn[9] = deepLinkingMock
      ;(useConnect as jest.Mock).mockReturnValue(connectReturn)
      render(<PairingAlert {...defaultProps} />)
      const qrBtn = screen.getByTestId('qr-button')
      fireEvent.click(qrBtn)
      expect(updateQRCodeMock).toHaveBeenCalledWith('wcCode')
      expect(updateStateMock).toHaveBeenCalledWith('qr')
      expect(displayQRExtraMock).toHaveBeenCalledWith(true)
    })

    test('does not render mobile OS branch when wallet does not include ios', () => {
      const nonIosWallet = { ...walletObj, types: ['web', 'extension', 'desktop'] }
      const walletsMapNonIos = new Map([['wallet1', nonIosWallet]])
      ;(useWallets as jest.Mock).mockReturnValue(walletsMapNonIos)
      const connectReturn = [...defaultUseConnect]
      connectReturn[0] = nonIosWallet
      connectReturn[3] = 'install'
      ;(useConnect as jest.Mock).mockReturnValue(connectReturn)
      ;(platformUtils.isMobileOS as jest.Mock).mockReturnValue(true)
      render(<PairingAlert {...defaultProps} />)
      const infos = screen.getAllByTestId('info').map((el) => el.textContent)
      expect(infos).not.toEqual(
        expect.arrayContaining([
          expect.stringContaining(`Connect with ${nonIosWallet.name} Mobile`)
        ])
      )
    })

    test('clicking "Use App" in mobile OS branch calls handleDeepLinking', () => {
      ;(platformUtils.isMobileOS as jest.Mock).mockReturnValue(true)
      const deepLinkMock = jest.fn()
      const connectReturn = [...defaultUseConnect]
      connectReturn[3] = 'install'
      connectReturn[6] = true
      connectReturn[9] = deepLinkMock
      ;(useConnect as jest.Mock).mockReturnValue(connectReturn)
      render(<PairingAlert {...defaultProps} />)
      const useAppBtn = screen.getByText('Use App')
      fireEvent.click(useAppBtn)
      expect(deepLinkMock).toHaveBeenCalled()
    })

    test('clicking on error "here" span calls handleUpdateState with "help"', () => {
      ;(platformUtils.isMobileOS as jest.Mock).mockReturnValue(true)
      const updateStateMock = jest.fn()
      const connectReturn = [...defaultUseConnect]
      connectReturn[3] = 'install'
      connectReturn[6] = false // force error branch
      connectReturn[15] = updateStateMock
      ;(useConnect as jest.Mock).mockReturnValue(connectReturn)
      localStorage.setItem(StorageKey.WC_INIT_ERROR, 'Network error details')
      render(<PairingAlert {...defaultProps} />)
      const hereElement = screen.getByText('here')
      fireEvent.click(hereElement)
      expect(updateStateMock).toHaveBeenCalledWith('help')
    })

    test('onShowQRCodeClick with empty syncCode calls props.onClose', () => {
      ;(platformUtils.isMobileOS as jest.Mock).mockReturnValue(true)
      const onCloseMock = jest.fn()
      const connectReturn = [...defaultUseConnect]
      connectReturn[3] = 'install'
      connectReturn[6] = true
      ;(useConnect as jest.Mock).mockReturnValue(connectReturn)
      // Set walletConnectSyncCode to empty so that syncCode becomes empty
      const newPairingPayload = { ...pairingPayload, walletConnectSyncCode: '' }
      render(
        <PairingAlert
          {...{ ...defaultProps, onClose: onCloseMock, pairingPayload: newPairingPayload }}
        />
      )
      const qrButton = screen.getByTestId('qr-button')
      fireEvent.click(qrButton)
      expect(onCloseMock).toHaveBeenCalled()
    })

    test('onShowQRCodeClick calls handleDeepLinking when isMobile is true and wallet types length equals 1', () => {
      // Supply a larger wallet map (at least 6 entries) so that TopWallets "otherWallets" does not error
      ;(useIsMobile as jest.Mock).mockReturnValue(true)
      const iosWallet = { ...walletObj, types: ['ios'] }
      const walletsMapIos = new Map<string, typeof walletObj>([
        ['wallet1', iosWallet],
        ['wallet2', iosWallet],
        ['wallet3', iosWallet],
        ['wallet4', iosWallet],
        ['wallet5', iosWallet],
        ['wallet6', iosWallet]
      ])
      ;(useWallets as jest.Mock).mockReturnValue(walletsMapIos)
      const deepLinkingMock = jest.fn()
      const updateQRCodeMock = jest.fn()
      const updateStateMock = jest.fn()
      const displayQRExtraMock = jest.fn()
      const connectReturn = [...defaultUseConnect]
      connectReturn[0] = iosWallet
      connectReturn[3] = 'install'
      connectReturn[6] = true
      connectReturn[9] = deepLinkingMock
      connectReturn[16] = updateQRCodeMock
      connectReturn[15] = updateStateMock
      connectReturn[18] = displayQRExtraMock
      ;(useConnect as jest.Mock).mockReturnValue(connectReturn)
      ;(platformUtils.isMobileOS as jest.Mock).mockReturnValue(true)
      render(<PairingAlert {...defaultProps} />)
      const qrButton = screen.getByTestId('qr-button')
      fireEvent.click(qrButton)
      expect(deepLinkingMock).toHaveBeenCalledWith(iosWallet, 'wcCode')
      expect(updateQRCodeMock).not.toHaveBeenCalled()
      expect(updateStateMock).toHaveBeenCalledWith('qr')
      expect(displayQRExtraMock).toHaveBeenCalledWith(true)
    })
  })
})
