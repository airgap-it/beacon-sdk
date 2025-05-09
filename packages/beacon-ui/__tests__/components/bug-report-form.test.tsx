import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import BugReportForm from '../../src/components/bug-report-form'

// --- Mocks for external dependencies ---
jest.mock('@airgap/beacon-core', () => {
  return {
    IndexedDBStorage: jest.fn().mockImplementation(() => ({
      getAllKeys: jest.fn().mockResolvedValue([]),
      getAll: jest.fn().mockResolvedValue([])
    })),
    Logger: jest.fn().mockImplementation(() => ({
      error: jest.fn()
    })),
    // we cannot refer to the actual `SDK_VERSION` because
    // `jest.mock()` is not allowed to reference any out-of-scope variables.
    SDK_VERSION: '4.5.0',
    BACKEND_URL: 'https://beacon-backend.prod.gke.papers.tech'
  }
})

jest.mock('../../src/utils/platform', () => ({
  currentBrowser: jest.fn(() => 'TestBrowser'),
  currentOS: jest.fn(() => 'TestOS')
}))

// Optionally, suppress expected console messages during tests
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  jest.restoreAllMocks()
})

// --- Helper function to fill the form with valid data ---
const fillValidForm = () => {
  const titleInput = screen.getByLabelText(/Title/i) as HTMLInputElement
  const descriptionTextarea = screen.getByLabelText(/Description/i) as HTMLTextAreaElement
  const checkbox = screen.getByLabelText(/share anonymous data/i) as HTMLInputElement

  fireEvent.change(titleInput, {
    target: { value: 'This is a valid title example' }
  })
  fireEvent.change(descriptionTextarea, {
    target: {
      value: 'This is a valid description that is definitely more than thirty characters long.'
    }
  })
  fireEvent.click(checkbox)
}

describe('BugReportForm', () => {
  test('renders form with input fields and disabled submit button', () => {
    const onSubmit = jest.fn()
    render(<BugReportForm onSubmit={onSubmit} />)

    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/share anonymous data/i)).toBeInTheDocument()

    // Submit button initially shows "Submit" and is disabled
    const submitButton = screen.getByRole('button', { name: /Submit/i })
    expect(submitButton).toBeDisabled()
  })

  test('enables submit button when form is valid', async () => {
    const onSubmit = jest.fn()
    render(<BugReportForm onSubmit={onSubmit} />)

    const submitButton = screen.getByRole('button')
    fillValidForm()

    // Wait for the useEffect to update form validity
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
  })

  test('submits form successfully', async () => {
    jest.useFakeTimers()
    const onSubmit = jest.fn()

    // Mock a successful fetch response
    const fakeResponse = {
      ok: true,
      json: async () => ({ message: 'Success' })
    }
    global.fetch = jest.fn().mockResolvedValue(fakeResponse)

    render(<BugReportForm onSubmit={onSubmit} />)

    const submitButton = screen.getByRole('button')
    fillValidForm()

    // Wait for the form to become valid (submit button enabled)
    await waitFor(() => expect(submitButton).not.toBeDisabled())

    // Submit the form
    fireEvent.click(submitButton)

    // Ensure fetch was called with the expected URL and options
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))
    expect(global.fetch).toHaveBeenCalledWith(
      'https://beacon-backend.prod.gke.papers.tech/bug-report/save',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: expect.any(String)
      })
    )

    // Advance timers to trigger the "Thank You!" message (setTimeout for 600ms)
    act(() => {
      jest.advanceTimersByTime(600)
    })

    // Instead of getByText (which fails because the text is split), check the container:
    await waitFor(() => {
      const thankYouContainer = document.querySelector('.thank-you-message')
      expect(thankYouContainer).toBeInTheDocument()
      // Remove any whitespace to verify the full message
      expect(thankYouContainer?.textContent?.replace(/\s/g, '')).toEqual('ThankYou!')
    })

    // Advance timers to trigger the onSubmit callback (after additional 5000ms)
    act(() => {
      jest.advanceTimersByTime(5000)
    })
    expect(onSubmit).toHaveBeenCalled()

    jest.useRealTimers()
  })

  test('handles submission error', async () => {
    jest.useFakeTimers()
    const onSubmit = jest.fn()

    // Mock a fetch response that is not ok (simulate an error)
    const fakeResponse = {
      ok: false,
      json: async () => ({ message: 'Error' })
    }
    global.fetch = jest.fn().mockResolvedValue(fakeResponse)

    render(<BugReportForm onSubmit={onSubmit} />)

    const submitButton = screen.getByRole('button')
    fillValidForm()

    await waitFor(() => expect(submitButton).not.toBeDisabled())

    fireEvent.click(submitButton)

    // Wait for the fetch call to complete
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))

    // Since the response is not OK, the component should display the error icon ('✕')
    await waitFor(() => {
      expect(screen.getByText('✕')).toBeInTheDocument()
    })

    // Advance timers to trigger onSubmit callback
    act(() => {
      jest.advanceTimersByTime(5000)
    })
    expect(onSubmit).toHaveBeenCalled()

    jest.useRealTimers()
  })
})
