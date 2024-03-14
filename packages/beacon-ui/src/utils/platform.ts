// Helper functions from https://github.com/ionic-team/ionic-framework/blob/master/core/src/utils/platform.ts

export const testUserAgent = (win: Window, expr: RegExp): boolean =>
  expr.test(win.navigator.userAgent)

const matchMedia = (win: Window, query: string): boolean => win.matchMedia(query).matches

export const isMobile = (win: Window): boolean => matchMedia(win, '(any-pointer:coarse)')

// const isCordova = (win: any): boolean => Boolean(win.cordova || win.phonegap || win.PhoneGap)

// const isCapacitorNative = (win: any): boolean => {
//   const capacitor = win.Capacitor

//   return Boolean(capacitor && capacitor.isNative)
// }

// const isHybrid = (win: Window): boolean => isCordova(win) || isCapacitorNative(win)

// const isMobileWeb = (win: Window): boolean => isMobile(win) && !isHybrid(win)

const isIpad = (win: Window): boolean => {
  // iOS 12 and below
  if (testUserAgent(win, /iPad/i)) {
    return true
  }

  // iOS 13+
  if (testUserAgent(win, /Macintosh/i) && isMobile(win)) {
    return true
  }

  return false
}

export const isBrowser = (win: Window): boolean =>
  testUserAgent(
    win,
    /(?:Mozilla)(?=.*\b(?:Gecko|AppleWebKit))(?=.*\b(?:Chrome|Safari|Firefox|Opera|Edge|Brave|DuckDuckGo)).*/i
  )

export const isPrivacyBrowser = (win: Window): boolean => testUserAgent(win, /Mobile DuckDuckGo/i)

export const isIOS = (win: Window): boolean =>
  isPrivacyBrowser(win) || testUserAgent(win, /iPhone|iPod|Mobile DuckDuckGo/i) || isIpad(win)

export const isAndroid = (win: Window): boolean =>
  !isPrivacyBrowser(win) && testUserAgent(win, /android|sink/i)

export const isTwBrowser = (win: Window): boolean => win && (win as any).ethereum?.isTrust == true

export const isDesktop = (win: Window): boolean => !isMobile(win)

export const isMobileOS = (win: Window): boolean =>
  testUserAgent(
    win,
    /(Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet|Windows Phone|SymbianOS|Kindle)/i
  )

export const currentOS = () => {
  var ua = navigator.userAgent
  var osMap = new Map([
    ['Windows', 'Windows'],
    ['Mac', 'Mac OS'],
    ['Linux', 'Linux'],
    ['iPhone', 'iOS'],
    ['iPad', 'iOS'],
    ['Android', 'Android']
  ])

  for (let [key, value] of osMap) {
    if (ua.indexOf(key) !== -1) {
      return value
    }
  }
  return 'UNKOWN'
}

export const currentBrowser = () => {
  var ua = navigator.userAgent
  var browserMap = new Map([
    ['Firefox', 'Firefox'],
    ['Opera', 'Opera'],
    ['OPR', 'Opera'],
    ['Trident', 'Internet Explorer'],
    ['Edge', 'Edge'],
    ['Chrome', 'Chrome'],
    ['Safari', 'Safari']
  ])

  for (let [key, value] of browserMap) {
    if (ua.indexOf(key) !== -1) {
      return value
    }
  }
  return 'UNKOWN'
}
