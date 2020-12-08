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

export const isIOS = (win: Window): boolean => testUserAgent(win, /iPhone|iPod/i) || isIpad(win)

export const isAndroid = (win: Window): boolean => testUserAgent(win, /android|sink/i)

export const isDesktop = (win: Window): boolean => !isMobile(win)
