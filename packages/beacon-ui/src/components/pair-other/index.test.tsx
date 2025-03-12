import { render, screen, fireEvent } from '@testing-library/react'
import PairOther from './index'
import { PairOtherProps } from '../../ui/common'

// Mock the QR component so that we can inspect its rendered output.
jest.mock('../qr', () => {
  // The mock receives props and renders a dummy element with the passed code and isWalletConnect info.
  return (props: any) => (
    <div data-testid="qr-component">
      QR: {props.code} {props.isWalletConnect ? 'walletconnect' : 'p2p'}
    </div>
  )
})

describe('PairOther Component', () => {
  const defaultProps: PairOtherProps = {
    walletList: [],
    p2pPayload: Promise.resolve('p2p-code'),
    wcPayload: Promise.resolve('wc-code'),
    onClickLearnMore: jest.fn()
  }

  test('renders selection view with both buttons when payloads are provided', async () => {
    render(<PairOther {...defaultProps} />)

    // Wait for the prompt message to appear.
    expect(await screen.findByText(/Select QR Type/i)).toBeInTheDocument()

    // Wait for both buttons to be rendered.
    const beaconButton = await screen.findByRole('button', { name: /Beacon/i })
    const walletConnectButton = await screen.findByRole('button', { name: /WalletConnect/i })
    expect(beaconButton).toBeInTheDocument()
    expect(walletConnectButton).toBeInTheDocument()
  })

  test('clicking the Beacon button shows the QR component with p2p payload', async () => {
    render(<PairOther {...defaultProps} />)

    // Wait for the Beacon button to appear.
    const beaconButton = await screen.findByRole('button', { name: /Beacon/i })
    fireEvent.click(beaconButton)

    // After clicking, wait for the QR component to render.
    const qrComponent = await screen.findByTestId('qr-component')
    expect(qrComponent).toBeInTheDocument()
    expect(qrComponent).toHaveTextContent('p2p-code')
    expect(qrComponent).toHaveTextContent('p2p')
  })

  test('clicking the WalletConnect button shows the QR component with walletconnect payload', async () => {
    render(<PairOther {...defaultProps} />)

    // Wait for the WalletConnect button to appear.
    const wcButton = await screen.findByRole('button', { name: /WalletConnect/i })
    fireEvent.click(wcButton)

    // After clicking, wait for the QR component to render.
    const qrComponent = await screen.findByTestId('qr-component')
    expect(qrComponent).toBeInTheDocument()
    expect(qrComponent).toHaveTextContent('wc-code')
    expect(qrComponent).toHaveTextContent('walletconnect')
  })

  test('renders selection view without action buttons when no payload is provided', async () => {
    const props: PairOtherProps = {
      walletList: [],
      p2pPayload: Promise.resolve(''),
      wcPayload: Promise.resolve(''),
      onClickLearnMore: jest.fn()
    }

    render(<PairOther {...props} />)

    // Wait for the prompt to appear.
    expect(await screen.findByText(/Select QR Type/i)).toBeInTheDocument()

    // The buttons should not be rendered if the payloads are empty.
    expect(screen.queryByRole('button', { name: /Beacon/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /WalletConnect/i })).not.toBeInTheDocument()
  })
})
