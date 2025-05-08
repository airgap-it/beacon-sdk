// useIsMobile.test.js
import { renderHook, act } from '@testing-library/react'
import useIsMobile from '../../src/ui/alert/hooks/useIsMobile'
import * as platformUtils from '../../src/utils/platform'

// Mock the external isMobileOS function.
jest.mock('../../src/utils/platform', () => ({
  isMobileOS: jest.fn()
}))

describe('useIsMobile', () => {
  beforeEach(() => {
    // Clear mocks between tests
    jest.clearAllMocks()
  })

  test('returns true if isMobileOS returns true regardless of window width', () => {
    // Simulate a mobile OS environment.
    ;(platformUtils.isMobileOS as any).mockReturnValue(true)

    // Set window width to any value (here, 1024).
    window.innerWidth = 1024

    const { result } = renderHook(() => useIsMobile())

    // Since isMobileOS returns true, the hook should return true.
    expect(result.current).toBe(true)
  })

  test('returns false if isMobileOS returns false and window width is above breakpoint', () => {
    ;(platformUtils.isMobileOS as any).mockReturnValue(false)
    window.innerWidth = 1024 // Greater than default breakpoint of 768

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  test('returns true if isMobileOS returns false and window width is below (or equal to) breakpoint', () => {
    ;(platformUtils.isMobileOS as any).mockReturnValue(false)
    window.innerWidth = 600 // Less than default breakpoint

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  test('updates isMobile state on window resize', () => {
    ;(platformUtils.isMobileOS as any).mockReturnValue(false)

    // Start with a width greater than the default breakpoint.
    window.innerWidth = 1024
    const { result } = renderHook(() => useIsMobile())

    // Initially, it should be false.
    expect(result.current).toBe(false)

    // Simulate a window resize to a smaller width.
    act(() => {
      window.innerWidth = 500
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current).toBe(true)

    // Simulate a resize back to a larger width.
    act(() => {
      window.innerWidth = 1024
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current).toBe(false)
  })

  test('respects a custom breakpoint', () => {
    ;(platformUtils.isMobileOS as any).mockReturnValue(false)
    // Use a custom breakpoint of 1200.
    window.innerWidth = 1100 // Below custom breakpoint
    const { result } = renderHook(() => useIsMobile(1200))
    expect(result.current).toBe(true)
  })

  test('removes event listener on unmount', () => {
    ;(platformUtils.isMobileOS as any).mockReturnValue(false)

    // Spy on addEventListener and removeEventListener.
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useIsMobile())

    // Verify that the resize event listener was added.
    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))

    // Unmount the hook and check that the event listener was removed.
    unmount()
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
  })
})
