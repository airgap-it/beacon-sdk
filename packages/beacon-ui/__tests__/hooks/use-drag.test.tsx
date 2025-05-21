import { render, fireEvent } from '@testing-library/react'
import useDrag from '../../src/components/toast/hooks/useDrag'

describe('useDrag hook', () => {
  test('handles dragging events correctly', () => {
    const handler = jest.fn()

    const TestComponent = () => {
      const bindDrag = useDrag(handler)
      return <div data-testid="drag-element" {...bindDrag()} />
    }

    const { getByTestId } = render(<TestComponent />)
    const dragElement = getByTestId('drag-element')

    // Simulate mouse down event to start dragging
    fireEvent.mouseDown(dragElement, { clientX: 100, clientY: 100 })
    expect(handler).not.toHaveBeenCalled()

    // Simulate mouse move event
    fireEvent.mouseMove(document, { clientX: 150, clientY: 160 })
    expect(handler).toHaveBeenCalledWith({ offset: [50, 60] })

    // Simulate additional mouse move event
    fireEvent.mouseMove(document, { clientX: 200, clientY: 220 })
    expect(handler).toHaveBeenCalledWith({ offset: [100, 120] })

    // Simulate mouse up event to stop dragging
    fireEvent.mouseUp(document)

    // Verify no further calls occur after dragging has stopped
    fireEvent.mouseMove(document, { clientX: 300, clientY: 320 })
    expect(handler).toHaveBeenCalledTimes(2)
  })

  test('ignores mousemove events when not dragging', () => {
    const handler = jest.fn()

    const TestComponent = () => {
      const bindDrag = useDrag(handler)
      return <div data-testid="drag-element" {...bindDrag()} />
    }

    render(<TestComponent />)

    // Mousemove without mousedown should not call handler
    fireEvent.mouseMove(document, { clientX: 150, clientY: 160 })
    expect(handler).not.toHaveBeenCalled()
  })
})
