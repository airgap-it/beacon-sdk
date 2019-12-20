type Callback = (message: unknown) => void

const cbs: Callback[] = [(_: unknown): void => undefined]

let myWindow = {
  postMessage: (message: string, _target?: string): void => {
    console.log('GOT POST MESSAGE', message)
    cbs.forEach((callbackElement: Callback) => {
      callbackElement({ data: message })
    })
  },
  addEventListener: (name: string, eventCallback: Callback): void => {
    console.log('addEventListener', name)
    cbs.push(eventCallback)
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
