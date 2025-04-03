import { useRef } from 'react'

const useDrag = (handler: (state: { offset: [number, number] }) => void) => {
  const dragRef = useRef<{ startX: number; startY: number; isDragging: boolean }>({
    startX: 0,
    startY: 0,
    isDragging: false
  })
  const positionRef = useRef<[number, number]>([0, 0])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    dragRef.current.isDragging = true
    dragRef.current.startX = e.clientX - positionRef.current[0]
    dragRef.current.startY = e.clientY - positionRef.current[1]

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragRef.current.isDragging) return

    const newX = e.clientX - dragRef.current.startX
    const newY = e.clientY - dragRef.current.startY

    positionRef.current = [newX, newY]
    handler({ offset: [newX, newY] })
  }

  const handleMouseUp = () => {
    dragRef.current.isDragging = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  const bindDrag = () => ({ onMouseDown: handleMouseDown })

  return bindDrag
}

export default useDrag
