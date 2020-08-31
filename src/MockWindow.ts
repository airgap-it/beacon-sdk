type Callback = (message: unknown) => void

const cbs: Callback[] = [(_: unknown): void => undefined]

/**
 * A mock for postmessage if run in node.js environment
 */
let myWindow = {
  postMessage: (message: string | Record<string, unknown>, _target?: string): void => {
    console.log('GOT POST MESSAGE', message)
    cbs.forEach((callbackElement: Callback) => {
      callbackElement({ data: message })
    })
  },
  addEventListener: (name: string, eventCallback: Callback): void => {
    console.log('addEventListener', name)
    cbs.push(eventCallback)
  },
  removeEventListener: (name: string, eventCallback: Callback): void => {
    console.log('addEventListener', name)
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

export { myWindow }
