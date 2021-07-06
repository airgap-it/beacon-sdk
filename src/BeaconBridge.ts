const createBeaconBridge = (url: string, recipient: string) => {
  var ifrm = document.createElement('iframe')
  ifrm.setAttribute(
    'src',
    `${url}/bridge.html?parent=${encodeURIComponent(
      window.location.origin
    )}&recipient=${encodeURIComponent(recipient)}`
  )
  ifrm.setAttribute('style', 'position: absolute; width:0; height:0; border:0;')
  document.body.appendChild(ifrm)

  return ifrm
}

const tryParse = (data: string) => {
  try {
    return JSON.parse(data)
  } catch (e) {
    return {}
  }
}

export class BeaconBridge {
  public readonly ready: Promise<void>

  private readonly iFrame: HTMLIFrameElement

  private readonly listeners: ((message: string) => void)[] = []

  private readonly bridgeUrl: string = 'http://localhost:8081'

  constructor(public readonly recipient: string) {
    this.iFrame = createBeaconBridge(this.bridgeUrl, recipient)
    this.ready = new Promise((resolve) => {
      window.addEventListener('message', (evt) => {
        if (evt.source !== this.iFrame.contentWindow) {
          return
        }

        const data = tryParse(evt.data)

        if (data.type === 'ready') {
          return resolve()
        } else if (data.type === 'message') {
          this.listeners.forEach((listener) => {
            listener(data.payload)
          })
        }
      })
    })
  }

  addListener(listener: (message: string) => void) {
    this.listeners.push(listener)
  }

  async send(message: string) {
    await this.ready

    const contentWindow = this.iFrame.contentWindow
    if (contentWindow) {
      contentWindow.postMessage(message, this.bridgeUrl)
    }
  }
}
