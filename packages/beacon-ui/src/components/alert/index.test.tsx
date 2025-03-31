// index.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import Alert from './index'

// --- Mocks ---

// Force useIsMobile to return false (simulate a desktop environment)
jest.mock('../../ui/alert/hooks/useIsMobile', () => ({
  __esModule: true,
  default: () => false
}))

// Mock the icon components so we can easily query for them.
jest.mock('../icons', () => ({
  __esModule: true,
  CloseIcon: () => <span data-testid="close-icon">CloseIcon</span>,
  LeftIcon: () => <span data-testid="left-icon">LeftIcon</span>,
  LogoIcon: () => <span data-testid="logo-icon">LogoIcon</span>
}))

// Mock the Loader component.
jest.mock('../loader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader">Loader</div>
}))

// --- Tests ---

describe('Alert Component', () => {
  // Default props used for most tests
  const defaultProps = {
    open: true,
    onCloseClick: jest.fn(),
    onBackClick: undefined,
    loading: false,
    extraContent: 'Extra information',
    showMore: false,
    onClickShowMore: jest.fn(),
    children: <div data-testid="alert-child">Alert Content</div>,
    closeOnBackdropClick: true
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('renders with "show" classes when open', () => {
    const { container } = render(<Alert {...defaultProps} />)
    // The outer wrapper should have the "alert-wrapper-show" class
    expect(container.querySelector('.alert-wrapper-show')).toBeInTheDocument()
    // The modal container should have the "alert-modal-show" class
    expect(container.querySelector('.alert-modal-show')).toBeInTheDocument()
    // Verify that the children are rendered
    expect(screen.getByTestId('alert-child')).toBeInTheDocument()
  })

  test('renders with "hide" classes when closed', () => {
    const props = { ...defaultProps, open: false }
    const { container } = render(<Alert {...props} />)
    expect(container.querySelector('.alert-wrapper-hide')).toBeInTheDocument()
    expect(container.querySelector('.alert-modal-hide')).toBeInTheDocument()
  })

  test('calls onCloseClick when clicking on the wrapper', () => {
    render(<Alert {...defaultProps} />)
    // The outermost div uses the onCloseClick handler
    const wrapperDiv = document.querySelector('.alert-wrapper-show')
    expect(wrapperDiv).toBeInTheDocument()

    fireEvent.click(wrapperDiv!)
    expect(defaultProps.onCloseClick).toHaveBeenCalledTimes(1)
  })

  test('does not call onCloseClick when clicking inside the modal (stopPropagation)', () => {
    render(<Alert {...defaultProps} />)
    // The inner modal div stops the click event propagation
    const modalDiv = document.querySelector('.alert-modal-show')
    expect(modalDiv).toBeInTheDocument()

    fireEvent.click(modalDiv!)
    expect(defaultProps.onCloseClick).not.toHaveBeenCalled()
  })

  test('renders the back icon when onBackClick is provided and triggers callback on click', () => {
    const onBackClickMock = jest.fn()
    const props = { ...defaultProps, onBackClick: onBackClickMock }
    render(<Alert {...props} />)
    // The left icon should now be rendered since onBackClick is provided.
    const leftIcon = screen.getByTestId('left-icon')
    expect(leftIcon).toBeInTheDocument()

    fireEvent.click(leftIcon)
    expect(onBackClickMock).toHaveBeenCalledTimes(1)
  })

  test('displays the loader with full opacity when loading is true', () => {
    const props = { ...defaultProps, loading: true }
    render(<Alert {...props} />)
    const loadingWrapper = document.querySelector('.alert-modal-loading-wrapper')
    expect(loadingWrapper).toBeInTheDocument()
    // Verify inline style: opacity should be 1 when loading is true.
    expect(loadingWrapper).toHaveStyle('opacity: 1')
  })

  test('renders footer with "Show more" when extraContent exists and showMore is false', () => {
    render(<Alert {...defaultProps} />)
    // Since extraContent exists and we are not showing extra details, the footer should display "Show more".
    const footer = screen.getByText('Show more')
    expect(footer).toBeInTheDocument()

    fireEvent.click(footer)
    expect(defaultProps.onClickShowMore).toHaveBeenCalledTimes(1)
  })

  test('renders footer with "Show less" when showMore is true', () => {
    const props = { ...defaultProps, showMore: true }
    render(<Alert {...props} />)
    const footer = screen.getByText('Show less')
    expect(footer).toBeInTheDocument()
  })
})
