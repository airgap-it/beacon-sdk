// Taken from https://github.com/WalletConnect/walletconnect-monorepo/blob/master/packages/qrcode-modal/src/browser.ts

const beaconLogo: string = `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="40" viewBox="0 0 140 40"><title>beacon_logo</title><path d="M36.82,18.16v.66a23,23,0,0,1-2.53,9.78,22.73,22.73,0,0,1-7.21,7.07l-.56.33-1-.57-5.66-3.27a9.65,9.65,0,0,1-1-.65h0a6.92,6.92,0,0,1-.8-.63,10.76,10.76,0,0,1-1.58-1.66,11.33,11.33,0,0,1-1.57-2.78A13.17,13.17,0,0,1,14,20.88a3.78,3.78,0,0,1,1.81-.46l.46,0a11.2,11.2,0,0,0,.62,4.88A9.33,9.33,0,0,0,21,30.23l5.5,3.17.42-.29a19.61,19.61,0,0,0,5.46-5.63,20.09,20.09,0,0,0,2.19-8l-2.33-1.35a14.15,14.15,0,0,0,.37-2.36Z" style="fill:#3880ff"/><path d="M30.38,7V14.7a11.71,11.71,0,0,1-.06,1.19h0c0,.34-.08.68-.14,1a11.77,11.77,0,0,1-.66,2.19,11.32,11.32,0,0,1-1.61,2.77,13.13,13.13,0,0,1-4.35,3.57,3.73,3.73,0,0,1-1.5-1.75,11.08,11.08,0,0,0,3.88-3h0a9.33,9.33,0,0,0,2.21-6V8.36l-.46-.22a19.58,19.58,0,0,0-7.61-1.91A19.9,19.9,0,0,0,12,8.36v2.69a14.39,14.39,0,0,0-2.23.85V7l.56-.32A22.86,22.86,0,0,1,20.08,4a22.75,22.75,0,0,1,9.73,2.7Z" style="fill:#3880ff"/><path d="M11.13,16.24l-5.5,3.17c0,.14,0,.31,0,.49a19.33,19.33,0,0,0,2.15,7.56,20.05,20.05,0,0,0,5.86,5.94L16,32.05a14.35,14.35,0,0,0,1.86,1.5L13.64,36l-.57-.33a22.83,22.83,0,0,1-7.19-7.08A22.84,22.84,0,0,1,3.36,18.8v-.65l1-.58L10,14.31a11.75,11.75,0,0,1,1.06-.54c.31-.14.63-.27.95-.38a10.8,10.8,0,0,1,2.23-.53,12.24,12.24,0,0,1,3.2,0,13.34,13.34,0,0,1,5.26,2A3.9,3.9,0,0,1,22,17a11.22,11.22,0,0,0-4.5-1.89A9.36,9.36,0,0,0,11.13,16.24Z" style="fill:#3880ff"/><path d="M58.32,21.12a4.11,4.11,0,0,1,1,2.75,4.32,4.32,0,0,1-1.42,3.36,6.05,6.05,0,0,1-4.13,1.26H47.39V11.34h6.27a5.9,5.9,0,0,1,3.92,1.14,3.92,3.92,0,0,1,1.34,3.14,3.83,3.83,0,0,1-3.16,4A4.48,4.48,0,0,1,58.32,21.12ZM49.6,18.86h3.7a3.62,3.62,0,0,0,2.49-.76A2.64,2.64,0,0,0,56.66,16a2.61,2.61,0,0,0-.86-2.07,3.83,3.83,0,0,0-2.6-.76H49.6Zm6.46,7a2.79,2.79,0,0,0,1-2.26,2.77,2.77,0,0,0-1-2.25,4.15,4.15,0,0,0-2.74-.82H49.6v6.13h3.75A4.13,4.13,0,0,0,56.06,25.84Z"/><path d="M74.27,22.29H63.59a4.7,4.7,0,0,0,1.3,3.43,4.26,4.26,0,0,0,3,1.14,4.33,4.33,0,0,0,2.68-.81,3.35,3.35,0,0,0,1.33-2.18h2.36A5.55,5.55,0,0,1,71,28.05a7.15,7.15,0,0,1-3,.61,6.88,6.88,0,0,1-3.4-.83,5.85,5.85,0,0,1-2.33-2.37,7.5,7.5,0,0,1-.84-3.64,7.53,7.53,0,0,1,.84-3.64,5.83,5.83,0,0,1,2.33-2.39A6.88,6.88,0,0,1,68,15a6.77,6.77,0,0,1,3.4.83A5.68,5.68,0,0,1,73.6,18a6.21,6.21,0,0,1,.77,3.06A7.06,7.06,0,0,1,74.27,22.29Zm-2.63-3.56a3.58,3.58,0,0,0-1.53-1.48A4.72,4.72,0,0,0,68,16.76a4.36,4.36,0,0,0-3.06,1.14,4.52,4.52,0,0,0-1.34,3.32h8.54A4.51,4.51,0,0,0,71.64,18.73Z"/><path d="M86,15.94a5.08,5.08,0,0,1,1.89,2.6V15.13h2.21V28.49H87.92V25.08A5.11,5.11,0,0,1,86,27.69a5.47,5.47,0,0,1-3.29,1,6.09,6.09,0,0,1-3.17-.83,5.67,5.67,0,0,1-2.17-2.37,7.85,7.85,0,0,1-.8-3.64,7.88,7.88,0,0,1,.8-3.64,5.67,5.67,0,0,1,2.17-2.39A6.09,6.09,0,0,1,82.74,15,5.48,5.48,0,0,1,86,15.94Zm-5.93,2.3a5,5,0,0,0-1.23,3.58,5,5,0,0,0,1.23,3.59,4.29,4.29,0,0,0,3.27,1.31,4.62,4.62,0,0,0,2.35-.61,4.24,4.24,0,0,0,1.61-1.72,5.89,5.89,0,0,0,0-5.14,4.12,4.12,0,0,0-1.61-1.72,4.62,4.62,0,0,0-2.35-.6A4.29,4.29,0,0,0,80.1,18.24Z"/><path d="M103.8,16.33A5.74,5.74,0,0,1,105.87,20h-2.33a3.44,3.44,0,0,0-1.33-2.25,4.66,4.66,0,0,0-4.82-.28,3.83,3.83,0,0,0-1.54,1.64,5.8,5.8,0,0,0-.58,2.73,5.82,5.82,0,0,0,.58,2.74,3.83,3.83,0,0,0,1.54,1.64,4.64,4.64,0,0,0,4.82-.29,3.49,3.49,0,0,0,1.33-2.26h2.33a5.74,5.74,0,0,1-2.07,3.66,6.54,6.54,0,0,1-4.23,1.35,6.92,6.92,0,0,1-3.41-.83,5.88,5.88,0,0,1-2.32-2.37A7.5,7.5,0,0,1,93,21.82a7.53,7.53,0,0,1,.84-3.64,5.87,5.87,0,0,1,2.32-2.39A6.92,6.92,0,0,1,99.57,15,6.49,6.49,0,0,1,103.8,16.33Z"/><path d="M118.27,15.79a5.89,5.89,0,0,1,2.38,2.39,7.32,7.32,0,0,1,.87,3.64,7.29,7.29,0,0,1-.87,3.64,5.9,5.9,0,0,1-2.38,2.37,7.56,7.56,0,0,1-6.89,0A6,6,0,0,1,109,25.46a7.19,7.19,0,0,1-.88-3.64,7.21,7.21,0,0,1,.88-3.64,6,6,0,0,1,2.39-2.39,7.56,7.56,0,0,1,6.89,0Zm-5.65,1.66A4,4,0,0,0,111,19.09a5.57,5.57,0,0,0-.62,2.73,5.53,5.53,0,0,0,.62,2.72,4.08,4.08,0,0,0,1.63,1.64,4.77,4.77,0,0,0,4.41,0,4.08,4.08,0,0,0,1.63-1.64,5.53,5.53,0,0,0,.62-2.72,5.57,5.57,0,0,0-.62-2.73A4,4,0,0,0,117,17.45a4.77,4.77,0,0,0-4.41,0Z"/><path d="M135.21,16.41a6,6,0,0,1,1.44,4.32v7.76h-2.22V20.93a4.26,4.26,0,0,0-1-3.07,3.65,3.65,0,0,0-2.77-1.07A3.78,3.78,0,0,0,127.72,18a4.88,4.88,0,0,0-1.1,3.44v7.08h-2.21V15.13h2.21V18.3a4.53,4.53,0,0,1,1.82-2.51,5.26,5.26,0,0,1,3-.87A5,5,0,0,1,135.21,16.41Z"/></svg>`

export interface AlertConfig {
  title: string
  body?: string
  timer?: number
  confirmButtonText?: string
  actionButtonText?: string
  confirmCallback?(): void
  actionCallback?(): void
}

let document: Document
if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
  document = window.document
}

let timeout: NodeJS.Timeout | undefined

const formatBody = (dataString: string): string => {
  if (typeof dataString === 'string') {
    return dataString.replace('<svg', `<svg class="beacon-qrcode__image"`)
  }

  return dataString
}

const formatAlert = (
  body: string,
  title: string,
  confirmButtonText?: string,
  actionButtonText?: string
): string => {
  const callToAction: string = title
  const confirmButton: string = confirmButtonText
    ? `<button id="beacon-qrcode-button-ok" class="beacon-modal__button">${confirmButtonText}</button>`
    : ''
  const actionButton: string = actionButtonText
    ? `<button id="beacon-qrcode-button-action" class="beacon-modal__button--outline">${actionButtonText}</button>`
    : ''

  return `
  <style>
  :root {
    --animation-duration: 300ms;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
  
  .animated {
    animation-duration: var(--animation-duration);
    animation-fill-mode: both;
  }
  
  .fadeIn {
    animation-name: fadeIn;
  }
  
  .fadeOut {
    animation-name: fadeOut;
  }
  
  .beacon-modal__base {
    position: relative;
    top: 50%;
    display: inline-block;
    z-index: 2147483000;
    background: #fff;
    transform: translateY(-50%);
    margin: 0 auto;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 12px 24px 0 rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 500px;
  }
  
  .beacon-modal__header {
    padding-top: 16px;
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .beacon-modal__headerLogo {
    width: 100%;
    max-width: 320px;
    margin: 20px auto;
    height: 100%;
  }
  
  .beacon-modal__close__wrapper {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 10000;
    cursor: pointer;
  }
  
  .beacon-modal__close__icon {
    width: 24px;
    height: 24px;
    position: relative;
    top: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: rotate(45deg);
  }
  
  .beacon-modal__close__line1 {
    position: absolute;
    width: 90%;
    border: 1px solid #7c828b;
  }
  
  .beacon-modal__close__line2 {
    position: absolute;
    width: 90%;
    border: 1px solid #7c828b;
    transform: rotate(90deg);
  }
  
  .beacon-qrcode__base {
    position: fixed;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 2147482999;
    background-color: rgba(0, 0, 0, 0.5);
    text-align: center;
  }
  
  .beacon-qrcode__text, .beacon-qrcode__title {
    font-family: Roboto, sans-serif;
    text-align: center;
    margin: 0 auto;
    padding: 0 0 16px;
  }

  .margin__bottom {
    margin-bottom: 16px;
  }

  .beacon-qrcode__title {
    color: #7c828b;
    font-size: 18px;
  }
  
  .beacon-qrcode__text {
    color: #000;
    font-size: 14px;
  }

  .beacon-modal__button, .beacon-modal__button--outline {
    height: 36px;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.84px;
    margin-bottom: 4px;
    margin-inline-end: 2px;
    margin-inline-start: 2px;
    margin-left: 2px;
    margin-right: 2px;
    margin-top: 4px;
    padding-inline-end: 15.4px;
    padding-inline-start: 15.4px;
    padding-left: 15.4px;
    padding-right: 15.4px;
    overflow-wrap: break-word;
    pointer-events: auto;
    text-align: center;
    border: 2px solid #3880ff;
    border-radius: 4px;
  }

  .beacon-modal__button {
    background: #3880ff;
    color: #fff;
  }

  .beacon-modal__button--outline {
    background: #fff;
    color: #3880ff;
  }
  
  .beacon-qrcode__image {
    width: 300px;
    height: 300px;
    box-sizing: border-box;
    box-shadow: 0 10px 20px 0 rgba(49,27,88,.12);
    border: 1px solid rgba(0,232,204,.08);
  }

  .beacon-modal__content {
    padding: 24px;
  }

  .beacon-action__container {
    padding-top: 24px;
  }
  
  </style>
    <div
      id="beacon-qrcode-modal"
      class="beacon-qrcode__base animated fadeIn"
    >
      <div class="beacon-modal__base">
        <div class="beacon-modal__header">
        ${beaconLogo}
          <div class="beacon-modal__close__wrapper">
            <div
              id="beacon-qrcode-close"
              class="beacon-modal__close__icon"
            >
              <div class="beacon-modal__close__line1""></div>
              <div class="beacon-modal__close__line2"></div>
            </div>
          </div>
        </div>
        <div class="beacon-modal__content">
          <div>
            <p class="beacon-qrcode__title">
              ${callToAction}
            </p>
            <p class="beacon-qrcode__text">
            ${body}
            </p>
            <div class="beacon-action__container">
            ${actionButton}
            ${confirmButton}
            </div>
          </div>
        </div>
      </div>
    </div>
`
}

const closeAlert = (): Promise<void> =>
  new Promise((resolve) => {
    const elm = document.getElementById('beacon-qrcode-modal')
    if (elm) {
      const animationDuration = 300

      if (timeout) {
        clearTimeout(timeout)
        timeout = undefined
      }

      elm.className = elm.className.replace('fadeIn', 'fadeOut')
      setTimeout(() => {
        const wrapper = document.getElementById('beacon-wrapper')
        if (wrapper) {
          document.body.removeChild(wrapper)
        }
        resolve()
      }, animationDuration)
    } else {
      resolve()
    }
  })

const openAlert = async (alertConfig: AlertConfig): Promise<void> => {
  const body = alertConfig.body
  const title = alertConfig.title
  const timer = alertConfig.timer
  const confirmButtonText = alertConfig.confirmButtonText
  const actionButtonText = alertConfig.actionButtonText
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const confirmCallback = alertConfig.confirmCallback
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const actionCallback = alertConfig.actionCallback

  await closeAlert()

  const wrapper = document.createElement('div')
  wrapper.setAttribute('id', 'beacon-wrapper')
  if (body) {
    const formattedBody = formatBody(body)
    wrapper.innerHTML = formatAlert(formattedBody, title, confirmButtonText, actionButtonText)
  }

  if (timer) {
    timeout = setTimeout(async () => {
      await closeAlert()
    }, timer)
  }

  document.body.appendChild(wrapper)
  const okButton = document.getElementById('beacon-qrcode-button-ok')
  const actionButton = document.getElementById('beacon-qrcode-button-action')
  const closeButton = document.getElementById('beacon-qrcode-close')

  if (okButton) {
    okButton.addEventListener('click', async () => {
      await closeAlert()
      if (confirmCallback) {
        confirmCallback()
      }
    })
  }

  if (actionButton) {
    actionButton.addEventListener('click', async () => {
      await closeAlert()
      if (actionCallback) {
        actionCallback()
      }
    })
  }

  if (closeButton) {
    closeButton.addEventListener('click', async () => {
      await closeAlert()
    })
  }
}

export { closeAlert, openAlert }
