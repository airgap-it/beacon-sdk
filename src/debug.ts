// eslint-disable-next-line @typescript-eslint/no-explicit-any
let debug: boolean = (window as any).beaconSdkDebugEnabled ? true : false
if (debug) {
  // eslint-disable-next-line no-console
  console.log(
    '[BEACON]: Debug mode is ON (turned on either by the developer or a browser extension)'
  )
}

export const setDebugEnabled = (enabled: boolean): void => {
  debug = enabled
}

export const getDebugEnabled = (): boolean => debug
