import { render, screen, fireEvent } from '@testing-library/react'
import InfoAlert from './index'
import { ConfigurableAlertProps } from '../../../common'

jest.mock('../../hooks/useIsMobile', () => ({
  __esModule: true,
  default: () => false
}))

describe('InfoAlert Component', () => {
  const onCloseMock = jest.fn()

  const defaultProps: ConfigurableAlertProps = {
    title: 'Test Title',
    body: 'Test description',
    data: 'Test data',
    open: true,
    onClose: onCloseMock
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('renders with provided title, body, and data', () => {
    render(<InfoAlert {...defaultProps} />)

    // Expect the title (rendered as a heading) to appear.
    expect(screen.getByRole('heading', { name: /Test Title/i })).toBeInTheDocument()
    // Expect the description to appear.
    expect(screen.getByText(/Test description/i)).toBeInTheDocument()
    // Expect the data to appear (if rendered as preformatted text or similar).
    expect(screen.getByText(/Test data/i)).toBeInTheDocument()
    // Expect the "Close" button to be present.
    expect(screen.getByRole('button', { name: /Close/i })).toBeInTheDocument()
  })

  test('calls onClose when the "Close" button is clicked', () => {
    render(<InfoAlert {...defaultProps} />)

    // Find the "Close" button and simulate a click.
    const closeButton = screen.getByRole('button', { name: /Close/i })
    fireEvent.click(closeButton)
    expect(onCloseMock).toHaveBeenCalledTimes(1)
  })

  test('applies hidden class when open is false', () => {
    // Render the component with open={false}. Depending on your Alert implementation,
    // the Alert container may have a class like "alert-wrapper-hide" when closed.
    const { container } = render(<InfoAlert {...defaultProps} open={false} />)
    expect(container.firstChild).toHaveClass('alert-wrapper-hide')
  })
})
