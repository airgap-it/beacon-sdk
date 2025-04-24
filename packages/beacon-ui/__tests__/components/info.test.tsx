import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import Info from '../../src/components/info/index'
import { InfoProps } from '../../src/ui/common'

// A dummy icon component for testing
const DummyIcon = () => <span data-testid="dummy-icon">Icon</span>

describe('Info Component', () => {
  const defaultProps: InfoProps = {
    title: 'Test Title'
  }

  test('renders title correctly', () => {
    render(<Info {...defaultProps} />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  test('renders description and data when provided', () => {
    const props: InfoProps = {
      ...defaultProps,
      description: 'Test description',
      data: 'Test data'
    }
    render(<Info {...props} />)

    expect(screen.getByText('Test description')).toBeInTheDocument()
    expect(screen.getByText('Test data')).toBeInTheDocument()
  })

  test('applies border class when border prop is true', () => {
    const props: InfoProps = {
      ...defaultProps,
      border: true
    }
    const { container } = render(<Info {...props} />)
    expect(container.firstChild).toHaveClass('info-border')
  })

  test('renders icon with badge and bigIcon style when specified', () => {
    const props: InfoProps = {
      ...defaultProps,
      icon: <DummyIcon />,
      iconBadge: true,
      bigIcon: true
    }
    const { container } = render(<Info {...props} />)

    // Check if icon is rendered by looking for the dummy icon
    expect(screen.getByTestId('dummy-icon')).toBeInTheDocument()

    // Check if the icon container has the badge class
    const iconContainer = container.querySelector('.info-icon')
    expect(iconContainer).toHaveClass('info-badge')

    // Check if bigIcon style is applied (font size set to 3.4em)
    expect(iconContainer).toHaveStyle('font-size: 3.4em')
  })

  test('renders buttons and handles click events', () => {
    const primaryClick = jest.fn()
    const secondaryClick = jest.fn()

    const props: InfoProps = {
      ...defaultProps,
      buttons: [
        { label: 'Primary', type: 'primary', onClick: primaryClick },
        { label: 'Secondary', type: 'secondary', onClick: secondaryClick }
      ]
    }
    render(<Info {...props} />)

    // Check that both buttons are rendered
    const primaryButton = screen.getByText('Primary')
    const secondaryButton = screen.getByText('Secondary')

    expect(primaryButton).toBeInTheDocument()
    expect(secondaryButton).toBeInTheDocument()

    // Check that classes are applied accordingly
    expect(primaryButton).toHaveClass('info-button')
    expect(secondaryButton).toHaveClass('info-button-secondary')

    // Simulate click events
    fireEvent.click(primaryButton)
    expect(primaryClick).toHaveBeenCalledTimes(1)

    fireEvent.click(secondaryButton)
    expect(secondaryClick).toHaveBeenCalledTimes(1)
  })

  test('renders download link when provided', () => {
    const props: InfoProps = {
      ...defaultProps,
      downloadLink: { url: 'http://example.com', label: 'Download' }
    }
    render(<Info {...props} />)

    const linkElement = screen.getByText('Download') as HTMLAnchorElement
    expect(linkElement).toBeInTheDocument()
    expect(linkElement).toHaveAttribute('href', 'http://example.com')
  })

  test('renders QR code button and handles click event', () => {
    const qrClick = jest.fn()
    const props: InfoProps = {
      ...defaultProps,
      onShowQRCodeClick: qrClick
    }
    const { container } = render(<Info {...props} />)

    // Find the button using querySelector and its id
    const qrButton = container.querySelector('#qr-code-icon')
    expect(qrButton).toBeInTheDocument()

    // Simulate the click event on the QR code button
    if (qrButton) {
      fireEvent.click(qrButton)
    }
    expect(qrClick).toHaveBeenCalledTimes(1)
  })

  test('does not render optional elements when props are missing', () => {
    render(<Info {...defaultProps} />)

    // Icon, description, data, buttons, download link and QR code should not be rendered
    expect(screen.queryByTestId('dummy-icon')).not.toBeInTheDocument()
    expect(screen.queryByText('Test description')).not.toBeInTheDocument()
    expect(screen.queryByText('Test data')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /qr-code-icon/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
