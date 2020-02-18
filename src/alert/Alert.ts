// Taken from https://github.com/WalletConnect/walletconnect-monorepo/blob/master/packages/qrcode-modal/src/browser.ts

export interface AlertConfig {
  title: string
  body?: string
  confirmButtonText?: string
  timer?: number
  successCallback?(): void
}

let document: Document
if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
  document = window.document
}

let timeout: NodeJS.Timeout | undefined

const formatQRCodeImage = (dataString: string): string => {
  if (typeof dataString === 'string') {
    return dataString.replace('<svg', `<svg class="beacon-qrcode__image"`)
  }

  return dataString
}

const formatQRCodeModal = (
  qrCodeImage: string,
  title: string,
  confirmButtonText: string = 'Ok'
): string => {
  const callToAction = title

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
  
  .beacon-qrcode__text {
    color: #7c828b;
    font-family: Roboto, sans-serif;
    font-size: 18px;
    text-align: center;
    margin: 0 auto;
    padding: 0 0 16px;
    display: flex;
    justify-content: center;
    align-items: center;
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
  
  </style>
    <div
      id="beacon-qrcode-modal"
      class="beacon-qrcode__base animated fadeIn"
    >
      <div class="beacon-modal__base">
        <div class="beacon-modal__header">
        <img src="assets/img/beacon_logoy_type_hor_padding.svg" />
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
            <p id="beacon-qrcode-text" class="beacon-qrcode__text">
              ${callToAction}
            </p>
            ${qrCodeImage}
            <!-- 
            <button id="beacon-qrcode-button-ok">${confirmButtonText}</button>
            -->
          </div>
        </div>
      </div>
    </div>
`
}

const closeAlert = (): Promise<void> =>
  new Promise(resolve => {
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
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const successCallback = alertConfig.successCallback

  await closeAlert()

  const wrapper = document.createElement('div')
  wrapper.setAttribute('id', 'beacon-wrapper')
  if (body) {
    const qrCodeImage = formatQRCodeImage(body)
    wrapper.innerHTML = formatQRCodeModal(qrCodeImage, title, confirmButtonText)
  }

  if (timer) {
    timeout = setTimeout(async () => {
      await closeAlert()
    }, timer)
  }

  document.body.appendChild(wrapper)
  const okButton = document.getElementById('beacon-qrcode-button-ok')
  const closeButton = document.getElementById('beacon-qrcode-close')

  if (okButton) {
    okButton.addEventListener('click', async () => {
      await closeAlert()
      if (successCallback) {
        successCallback()
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
