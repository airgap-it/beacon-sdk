export { openAlert, closeAlert, closeAlerts } from './ui/alert'
export type { AlertButton, AlertConfig, ToastAction } from './ui/common'

export {
  Pairing,
  setDesktopList,
  setExtensionList,
  setWebList,
  setiOSList,
  getDesktopList,
  getExtensionList,
  getWebList,
  getiOSList
} from './components/pairing'

export { closeToast, openToast } from './ui/toast'

export { getColorMode, setColorMode } from './utils/colorMode'

export {
  isMobile,
  isMobileOS,
  isBrowser,
  isDesktop,
  isAndroid,
  isIOS,
  currentBrowser,
  currentOS
} from './utils/platform'
