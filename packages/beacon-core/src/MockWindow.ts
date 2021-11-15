type Callback = (message: unknown) => void

const cbs: Callback[] = [(_: unknown): void => undefined]

/**
 * A mock for postmessage if run in node.js environment
 */
let windowRef = {
  postMessage: (message: string | Record<string, unknown>, _target?: string): void => {
    console.log('GOT MOCK POST MESSAGE', message)
    cbs.forEach((callbackElement: Callback) => {
      callbackElement({ data: message })
    })
  },
  addEventListener: (_name: string, eventCallback: Callback): void => {
    cbs.push(eventCallback)
  },
  removeEventListener: (_name: string, eventCallback: Callback): void => {
    cbs.splice(
      cbs.indexOf((element) => element === eventCallback),
      1
    )
  },
  location: {
    origin: '*'
  }
}

try {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    windowRef = window as any
  }
} catch (windowError) {
  console.log(`not defined: ${windowError}`)
}

const clearMockWindowState: () => void = (): void => {
  cbs.length = 0
}

export { windowRef, clearMockWindowState }
