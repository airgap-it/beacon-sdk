import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import QR from '../../src/components/qr/index'
import { getTzip10Link } from '../../src/utils/get-tzip10-link'
import { getQrData } from '../../src/utils/qr'

// --- Mocks --- //
jest.mock('../../src/utils/get-tzip10-link', () => ({
  getTzip10Link: jest.fn()
}))

jest.mock('../../src/utils/qr', () => ({
  getQrData: jest.fn()
}))

describe('QR Component', () => {
  const dummySvg = '<svg><text>QR CODE</text></svg>'
  const walletName = 'TestWallet'
  const code = 'sample-code'
  const tzip10Payload = 'dummy-tzip10-link'

  beforeEach(() => {
    // When getTzip10Link is called, return a dummy payload.
    ;(getTzip10Link as jest.Mock).mockReturnValue(tzip10Payload)
    // When getQrData is called, return our dummy SVG.
    ;(getQrData as jest.Mock).mockReturnValue(dummySvg)

    // Set up a mock for navigator.clipboard.writeText.
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined)
      }
    })

    // Use fake timers so we can test the timeout behavior.
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.resetAllMocks()
  })

  test('renders desktop view correctly', async () => {
    render(<QR isWalletConnect={false} isMobile={false} walletName={walletName} code={code} />)

    // For desktop, a heading "Or scan to connect" should be rendered.
    expect(screen.getByText(/Or scan to connect/i)).toBeInTheDocument()
    // The wallet instruction text should be rendered.
    expect(
      screen.getByText(new RegExp(`Open ${walletName} Wallet on your mobile phone and scan.`, 'i'))
    ).toBeInTheDocument()

    // Since onClickLearnMore was not provided, no "Learn more" element should be rendered.
    expect(screen.queryByText(/Learn more/i)).not.toBeInTheDocument()

    // Wait for the QR SVG to be set by useEffect.
    await waitFor(() => {
      const svgWrapper = document.querySelector('.qr-svg-wrapper')
      expect(svgWrapper?.innerHTML).toBe(dummySvg)
    })

    // Check that getQrData was called with desktop dimensions (160x160).
    expect(getQrData).toHaveBeenCalledWith(tzip10Payload, 160, 160)
  })

  test('renders mobile view with "Learn more" when onClickLearnMore is provided', async () => {
    const onClickLearnMore = jest.fn()
    render(
      <QR
        isWalletConnect={true}
        isMobile={true}
        walletName={walletName}
        code={code}
        onClickLearnMore={onClickLearnMore}
      />
    )

    // Mobile view should instruct scanning with a WalletConnect-compatible wallet.
    expect(
      screen.getByText(/Scan QR code with a WalletConnect-compatible wallet\./i)
    ).toBeInTheDocument()

    // Wait for the QR SVG to be set.
    await waitFor(() => {
      const svgWrapper = document.querySelector('.qr-svg-wrapper')
      expect(svgWrapper?.innerHTML).toBe(dummySvg)
    })

    // Check that getQrData was called with mobile dimensions (300x300).
    expect(getQrData).toHaveBeenCalledWith(tzip10Payload, 300, 300)
  })

  test('handles copy to clipboard and shows "Copied!" message', async () => {
    const onClickQrCode = jest.fn()
    render(
      <QR
        isWalletConnect={false}
        isMobile={true}
        walletName={walletName}
        code={code}
        onClickQrCode={onClickQrCode}
      />
    )

    // Locate the clickable QR area.
    const qrRightDiv = document.querySelector('.qr-right')
    expect(qrRightDiv).toBeInTheDocument()

    // Click the QR area.
    if (qrRightDiv) {
      fireEvent.click(qrRightDiv)
    }

    // Verify that onClickQrCode was called.
    expect(onClickQrCode).toHaveBeenCalledTimes(1)
    // Verify that navigator.clipboard.writeText was called with the correct code.
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(code)

    // After clicking, the UI should change to show the "Copied!" message.
    await waitFor(() => {
      expect(screen.getByText(/Copied!/i)).toBeInTheDocument()
    })

    // Wrap timer advancement in act to flush pending state updates.
    act(() => {
      jest.advanceTimersByTime(3000)
    })

    // After the timeout, the UI should show "Copy to clipboard" again.
    await waitFor(() => {
      expect(screen.getByText(/Copy to clipboard/i)).toBeInTheDocument()
    })
  })

  test('uses getTzip10Link and getQrData correctly based on isMobile prop', async () => {
    // Render with isMobile true.
    const { rerender } = render(
      <QR isWalletConnect={false} isMobile={true} walletName={walletName} code={code} />
    )

    await waitFor(() => {
      expect(getQrData).toHaveBeenCalledWith(tzip10Payload, 300, 300)
    })

    // Rerender with isMobile false.
    rerender(<QR isWalletConnect={false} isMobile={false} walletName={walletName} code={code} />)

    await waitFor(() => {
      expect(getQrData).toHaveBeenCalledWith(tzip10Payload, 160, 160)
    })
  })
})
