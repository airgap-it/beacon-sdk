import { render, screen, fireEvent } from '@testing-library/react'
import Wallet from '../../src/components/wallet'
import { WalletProps } from 'src/ui/common'

describe('Wallet Component', () => {
  const onClick = jest.fn()
  const defaultProps: WalletProps = {
    name: 'Test Wallet',
    image: 'test-wallet.png',
    onClick
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('renders wallet main layout when small is false', () => {
    render(
      <Wallet
        {...defaultProps}
        description="This is a test wallet."
        tags={['popular', 'secure']}
        small={false}
        mobile={false}
      />
    )

    // Verify that the heading, description, tags, and image are rendered
    const heading = screen.getByRole('heading', { name: 'Test Wallet' })
    expect(heading).toBeInTheDocument()
    expect(screen.getByText(/This is a test wallet\./i)).toBeInTheDocument()
    expect(screen.getByText('popular')).toBeInTheDocument()
    expect(screen.getByText('secure')).toBeInTheDocument()

    const img = screen.getByAltText(/Test Wallet logo/i)
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'test-wallet.png')

    // Locate the main wallet container using the heading as an anchor
    const walletMain = heading.closest('.wallet-main')
    expect(walletMain).toBeInTheDocument()

    // Simulate clicking on the wallet container and verify the callback
    if (walletMain) {
      fireEvent.click(walletMain)
    }
    expect(onClick).toHaveBeenCalled()
  })

  test('renders wallet main layout with mobile styles when mobile is true', () => {
    render(
      <Wallet
        {...defaultProps}
        description="Mobile wallet description"
        small={false}
        mobile={true}
      />
    )

    // Use the heading to locate the container elements and verify mobile-specific classes
    const heading = screen.getByRole('heading', { name: 'Test Wallet' })
    const walletMain = heading.closest('.wallet-main')
    expect(walletMain).toHaveClass('wallet-main-mobile')

    const walletMainLeft = heading.closest('.wallet-main-left')
    expect(walletMainLeft).toHaveClass('wallet-main-left-mobile')
  })

  test('renders wallet small layout when small is true', () => {
    render(<Wallet {...defaultProps} small={true} mobile={false} />)

    // In the small layout, the container should have the class "wallet-small"
    const heading = screen.getByRole('heading', { name: 'Test Wallet' })
    const smallContainer = heading.closest('.wallet-small')
    expect(smallContainer).toBeInTheDocument()

    // The image should still be rendered with the correct alt text
    const img = screen.getByAltText(/Test Wallet logo/i)
    expect(img).toBeInTheDocument()
  })

  test('applies disabled style when disabled is true', () => {
    const { container } = render(
      <Wallet {...defaultProps} disabled={true} small={false} mobile={false} />
    )

    // The outer container (firstChild of the rendered container) should have the 'wallet-disabled' class
    expect(container.firstChild).toHaveClass('wallet-disabled')
  })
})
