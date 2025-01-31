import { useState, useEffect } from 'react'
import { isMobileOS } from 'src/utils/platform'

const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= breakpoint)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= breakpoint)
    }

    window.addEventListener('resize', handleResize)

    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [breakpoint])

  return isMobileOS(window) || isMobile
}

export default useIsMobile
