import { render, screen, fireEvent } from '@testing-library/react'
import Wallets from '../../src/components/wallets/index'
import { WalletsProps } from 'src/ui/common'

// --- Mock the Wallet component ---
// Replace the real Wallet component with a dummy that renders a div with data-testid="wallet".
// It receives props and renders the wallet name and description, and attaches the onClick handler.
jest.mock('../../src/components/wallet/index', () => {
  return ({
    name,
    description,
    onClick
  }: {
    name: string
    description: string
    onClick: () => void
  }) => (
    <div data-testid="wallet" onClick={onClick}>
      <span>{name}</span>
      <span>{description}</span>
    </div>
  )
})

describe('Wallets Component', () => {
  // Dummy wallets array (using a sample MergedWallet type)
  const dummyWallets = [
    {
      id: 'wallet1',
      name: 'Wallet One',
      descriptions: ['Fast', 'Secure'],
      image: 'wallet1.png',
      tags: ['popular'],
      // Additional fields that might be needed by the type
      key: 'wallet1',
      links: [],
      types: []
    },
    {
      id: 'wallet2',
      name: 'Wallet Two',
      descriptions: ['Reliable'],
      image: 'wallet2.png',
      tags: ['new'],
      key: 'wallet2',
      links: [],
      types: []
    }
  ]

  // Dummy callback functions
  const onClickWallet = jest.fn()
  const onClickOther = jest.fn()

  // A helper function to render the component with props
  const renderComponent = (props?: Partial<WalletsProps>) => {
    const defaultProps: WalletsProps = {
      wallets: dummyWallets,
      onClickWallet,
      onClickOther,
      isMobile: false,
      small: false,
      disabled: false
    }
    return render(<Wallets {...defaultProps} {...props} />)
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders a list of Wallet components with the correct description', () => {
    renderComponent()

    // The Wallet component is mocked to render with data-testid="wallet"
    const walletElements = screen.getAllByTestId('wallet')
    expect(walletElements).toHaveLength(dummyWallets.length)

    // Verify that each wallet shows the correct name and joined description.
    expect(walletElements[0]).toHaveTextContent('Wallet One')
    expect(walletElements[0]).toHaveTextContent('Fast & Secure') // descriptions joined with ' & '
    expect(walletElements[1]).toHaveTextContent('Wallet Two')
    expect(walletElements[1]).toHaveTextContent('Reliable')
  })

  test('calls onClickWallet with correct id when a wallet is clicked', () => {
    renderComponent()
    const walletElements = screen.getAllByTestId('wallet')
    // Click on the first wallet
    fireEvent.click(walletElements[0])
    expect(onClickWallet).toHaveBeenCalledWith(dummyWallets[0].id)
  })

  test('renders button with "Show QR code" when isMobile is false', () => {
    renderComponent({ isMobile: false })
    const button = screen.getByRole('button', { name: /Show QR code/i })
    expect(button).toBeInTheDocument()
  })

  test('renders button with "Pair wallet on another device" when isMobile is true', () => {
    renderComponent({ isMobile: true })
    const button = screen.getByRole('button', {
      name: /Pair wallet on another device/i
    })
    expect(button).toBeInTheDocument()
  })

  test('calls onClickOther when the button is clicked', () => {
    renderComponent()
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(onClickOther).toHaveBeenCalled()
  })
})
