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
    p2pPayload: 'p2p-code',
    wcPayload: 'wc-code',
    onClickLearnMore: jest.fn()
  }

  test('renders selection view with both buttons when payloads are provided', () => {
    render(<PairOther {...defaultProps} />)

    // The initial selection view should display a prompt message.
    expect(screen.getByText(/Select QR Type/i)).toBeInTheDocument()

    // Since both payloads are provided, both buttons should be rendered.
    expect(screen.getByRole('button', { name: /Beacon/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /WalletConnect/i })).toBeInTheDocument()
  })

  test('clicking the Beacon button shows the QR component with p2p payload', () => {
    render(<PairOther {...defaultProps} />)

    // Simulate clicking the Beacon button.
    const beaconButton = screen.getByRole('button', { name: /Beacon/i })
    fireEvent.click(beaconButton)

    // After clicking, the QR component should be rendered with the p2p payload.
    const qrComponent = screen.getByTestId('qr-component')
    expect(qrComponent).toBeInTheDocument()
    expect(qrComponent).toHaveTextContent('p2p-code')
    expect(qrComponent).toHaveTextContent('p2p')
  })

  test('clicking the WalletConnect button shows the QR component with walletconnect payload', () => {
    render(<PairOther {...defaultProps} />)

    // Simulate clicking the WalletConnect button.
    const wcButton = screen.getByRole('button', { name: /WalletConnect/i })
    fireEvent.click(wcButton)

    // After clicking, the QR component should be rendered with the walletconnect payload.
    const qrComponent = screen.getByTestId('qr-component')
    expect(qrComponent).toBeInTheDocument()
    expect(qrComponent).toHaveTextContent('wc-code')
    expect(qrComponent).toHaveTextContent('walletconnect')
  })

  test('renders selection view without action buttons when no payload is provided', () => {
    const props: PairOtherProps = {
      walletList: [],
      p2pPayload: '',
      wcPayload: '',
      onClickLearnMore: jest.fn()
    }

    render(<PairOther {...props} />)

    // The selection view should still render the prompt.
    expect(screen.getByText(/Select QR Type/i)).toBeInTheDocument()

    // Neither button should be rendered if the payloads are empty.
    expect(screen.queryByRole('button', { name: /Beacon/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /WalletConnect/i })).not.toBeInTheDocument()
  })
})
