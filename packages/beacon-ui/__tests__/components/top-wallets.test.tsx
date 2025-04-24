import { render, screen, fireEvent } from '@testing-library/react'
import TopWallets from '../../src/components/top-wallets/index'
import { StorageKey } from '@airgap/beacon-types'
import { MergedWallet } from 'src/utils/wallets'

// --- Mock the Wallet component ---
// Replace the real Wallet component with a dummy that renders a div with data-testid="wallet"
// and displays the wallet name and description.
jest.mock('../../src/components/wallet', () => {
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

describe('TopWallets Component', () => {
  // Dummy wallets array
  const dummyWallets: MergedWallet[] = [
    {
      id: 'wallet1',
      name: 'Wallet One',
      descriptions: ['Fast', 'Secure'],
      image: 'wallet1.png',
      tags: ['popular'],
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

  // Dummy callbacks
  const onClickWallet = jest.fn()
  const onClickLearnMore = jest.fn()
  const dummyOtherWallets = {
    images: ['other1.png', 'other2.png', 'other3.png'],
    onClick: jest.fn()
  }

  // Before each test, clear localStorage and reset mocks
  beforeEach(() => {
    localStorage.clear()
    onClickWallet.mockClear()
    onClickLearnMore.mockClear()
    dummyOtherWallets.onClick.mockClear()
  })

  test('renders header and bug report text when metrics are enabled', () => {
    localStorage.setItem(StorageKey.ENABLE_METRICS, 'true')
    render(
      <TopWallets
        wallets={dummyWallets}
        onClickWallet={onClickWallet}
        onClickLearnMore={onClickLearnMore}
        isMobile={false}
      />
    )
    // Check header
    expect(screen.getByRole('heading', { name: /Connect Wallet/i })).toBeInTheDocument()
    // Bug report text appears when ENABLE_METRICS is 'true'
    expect(screen.getByText(/Do you wish to report a bug\?/i)).toBeInTheDocument()
    expect(screen.getByText(/Click here/i)).toBeInTheDocument()
  })

  test('renders header and learn more text when metrics are disabled', () => {
    localStorage.setItem(StorageKey.ENABLE_METRICS, 'false')
    render(
      <TopWallets
        wallets={dummyWallets}
        onClickWallet={onClickWallet}
        onClickLearnMore={onClickLearnMore}
        isMobile={false}
      />
    )
    expect(screen.getByRole('heading', { name: /Connect Wallet/i })).toBeInTheDocument()
    // Normal text when ENABLE_METRICS is not 'true'
    expect(
      screen.getByText(
        /If you don't have a wallet, you can select a provider and create one now\./i
      )
    ).toBeInTheDocument()
    expect(screen.getByText(/Learn more/i)).toBeInTheDocument()
  })

  test('calls onClickLearnMore when the learn more text is clicked', () => {
    localStorage.setItem(StorageKey.ENABLE_METRICS, 'false')
    render(
      <TopWallets
        wallets={dummyWallets}
        onClickWallet={onClickWallet}
        onClickLearnMore={onClickLearnMore}
        isMobile={false}
      />
    )
    const learnMoreEl = screen.getByText(/Learn more/i)
    fireEvent.click(learnMoreEl)
    expect(onClickLearnMore).toHaveBeenCalled()
  })

  test('renders a list of wallets and calls onClickWallet when a wallet is clicked', () => {
    localStorage.setItem(StorageKey.ENABLE_METRICS, 'false')
    render(
      <TopWallets
        wallets={dummyWallets}
        onClickWallet={onClickWallet}
        onClickLearnMore={onClickLearnMore}
        isMobile={false}
      />
    )
    // Our mocked Wallet renders elements with data-testid="wallet"
    const walletElements = screen.getAllByTestId('wallet')
    expect(walletElements).toHaveLength(dummyWallets.length)
    // Click the first wallet element
    fireEvent.click(walletElements[0])
    expect(onClickWallet).toHaveBeenCalledWith(dummyWallets[0].id)
  })

  test('renders the other wallets section if provided and calls its onClick handler', () => {
    localStorage.setItem(StorageKey.ENABLE_METRICS, 'false')
    render(
      <TopWallets
        wallets={dummyWallets}
        onClickWallet={onClickWallet}
        onClickLearnMore={onClickLearnMore}
        otherWallets={dummyOtherWallets}
        isMobile={false}
      />
    )
    // Instead of using getByText directly (which finds multiple matches),
    // get all elements that match /Other Wallets/i and then pick the heading element.
    const headings = screen.getAllByText(/Other Wallets/i)
    const otherHeading = headings.find((el) => el.tagName.toLowerCase() === 'h3')
    expect(otherHeading).toBeInTheDocument()
    // Get the container (closest element with class 'top-wallets-other-wallets')
    const otherSection = otherHeading?.closest('.top-wallets-other-wallets')
    expect(otherSection).toBeInTheDocument()
    if (otherSection) {
      fireEvent.click(otherSection)
      expect(dummyOtherWallets.onClick).toHaveBeenCalled()
    }
  })
})
