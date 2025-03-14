// src/components/toast/index.test.tsx
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import Toast from './index'

// --- Mock external dependencies ---
// Mock useDrag to return a function that, when called, returns an empty object.
jest.mock('@use-gesture/react', () => ({
  useDrag: () => {
    return () => ({})
  }
}))

// Mock isMobileOS so that by default it returns false (non-mobile).
jest.mock('../../utils/platform', () => ({
  isMobileOS: jest.fn(() => false)
}))

// Import the isMobileOS so we can override it in tests.
import { isMobileOS } from '../../utils/platform'

describe('Toast Component', () => {
  beforeEach(() => {
    // Use fake timers for any setTimeout behavior.
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.resetAllMocks()
  })

  test('renders toast with show class when open is true and hide class when false', () => {
    const { rerender, container } = render(
      <Toast label="Test Toast" open={true} onClickClose={jest.fn()} />
    )
    expect(container.firstChild?.firstChild).toHaveClass('toast-inner-show')

    rerender(<Toast label="Test Toast" open={false} onClickClose={jest.fn()} />)
    expect(container.firstChild?.firstChild).toHaveClass('toast-inner-hide')
  })

  test('calls onClickClose when the close icon is clicked', () => {
    const onClickClose = jest.fn()
    render(<Toast label="Test Toast" open={true} onClickClose={onClickClose} />)

    // The close icon is rendered inside a div with the "toast-button-icon" class.
    const closeIconDiv = document.querySelector('.toast-button-icon')
    expect(closeIconDiv).toBeInTheDocument()

    if (closeIconDiv) {
      fireEvent.click(closeIconDiv)
    }
    expect(onClickClose).toHaveBeenCalled()
  })

  test('renders plain label if no wallet placeholder is present', () => {
    const label = 'Simple Toast Label'
    render(<Toast label={label} open={true} onClickClose={jest.fn()} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  test('renders wallet info when label includes {{wallet}} and walletInfo is provided', () => {
    const label = 'Payment received from {{wallet}}!'
    const walletInfo = {
      icon: 'wallet-icon.png',
      name: 'TestWallet'
    }
    const { container } = render(
      <Toast label={label} open={true} onClickClose={jest.fn()} walletInfo={walletInfo} />
    )
    // Verify that the wallet icon is rendered (using its alt text)
    const walletIcon = screen.getByAltText(`${walletInfo.name} icon`)
    expect(walletIcon).toBeInTheDocument()

    // Verify that the wallet name is rendered as a heading.
    expect(screen.getByRole('heading', { name: walletInfo.name })).toBeInTheDocument()

    // Because the text "Payment received from" is split across multiple elements,
    // we check that the overall text content contains it.
    expect(container.textContent).toContain('Payment received from')
    expect(container.textContent).toContain('!')
  })

  test('renders actions if provided and showMoreInfo is true', () => {
    const actions = [
      {
        text: 'Action 1',
        isBold: true,
        actionText: 'Click Me',
        actionCallback: jest.fn()
      }
    ]
    render(
      <Toast label="Toast with actions" open={true} onClickClose={jest.fn()} actions={actions} />
    )

    // The action text and button should be visible.
    expect(screen.getByText('Action 1')).toBeInTheDocument()
    const actionButton = screen.getByText('Click Me')
    expect(actionButton).toBeInTheDocument()

    // Simulate clicking the action button.
    fireEvent.click(actionButton)
    expect(actions[0].actionCallback).toHaveBeenCalled()
  })

  test('temporarily hides actions when label includes "Request sent to"', async () => {
    const actions = [
      {
        text: 'Action 1',
        actionText: 'Click Me',
        actionCallback: jest.fn()
      }
    ]
    render(
      <Toast label="Request sent to user" open={true} onClickClose={jest.fn()} actions={actions} />
    )

    // Because the label includes "Request sent to", the useEffect hides actions initially.
    expect(screen.queryByText('Action 1')).not.toBeInTheDocument()

    // Advance timers by 3000ms so that showMoreInfo becomes true.
    act(() => {
      jest.advanceTimersByTime(3000)
    })

    await waitFor(() => {
      expect(screen.getByText('Action 1')).toBeInTheDocument()
    })
  })

  test('renders open wallet action button if not mobile and openWalletAction is provided', () => {
    // By default, our isMobileOS mock returns false (non-mobile).
    const openWalletAction = jest.fn()
    render(
      <Toast
        label="Test Toast"
        open={true}
        onClickClose={jest.fn()}
        openWalletAction={openWalletAction}
      />
    )

    // The "Open Wallet" button should be rendered.
    const openWalletButton = screen.getByText(/Open Wallet/i)
    expect(openWalletButton).toBeInTheDocument()

    // Simulate clicking the open wallet button.
    fireEvent.click(openWalletButton)
    expect(openWalletAction).toHaveBeenCalled()
  })

  test('does not render open wallet action button on mobile', () => {
    // Override the isMobileOS mock to simulate a mobile OS.
    ;(isMobileOS as jest.Mock).mockReturnValue(true)
    const openWalletAction = jest.fn()
    render(
      <Toast
        label="Test Toast"
        open={true}
        onClickClose={jest.fn()}
        openWalletAction={openWalletAction}
      />
    )
    // On mobile, the "Open Wallet" button should not be rendered.
    expect(screen.queryByText(/Open Wallet/i)).not.toBeInTheDocument()
  })

  test('applies default drag transform style', () => {
    // Since useDrag is mocked to return a function that returns an empty object,
    // the initial position remains [0, 0] so the transform should be translate3d(0px, 0px, 0)
    const { container } = render(<Toast label="Test Toast" open={true} onClickClose={jest.fn()} />)
    expect(container.firstChild).toHaveStyle('transform: translate3d(0px, 0px, 0)')
  })
})
