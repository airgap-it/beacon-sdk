type Callback = (message: unknown) => void

const cbs: Callback[] = [(_: unknown): void => undefined]

let myWindow = {
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
  }
}

try {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    myWindow = window as any
  }
} catch (windowError) {
  console.log(`not defined: ${windowError}`)
}

const clearMockWindowState: () => void = (): void => {
  cbs.length = 0
}

export { myWindow, clearMockWindowState }
