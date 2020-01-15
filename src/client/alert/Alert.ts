// Taken from https://github.com/WalletConnect/walletconnect-monorepo/blob/master/packages/qrcode-modal/src/browser.ts

let document: Document
if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
  document = window.document
}

function formatQRCodeImage(dataString: string) {
  let result = ''
  if (typeof dataString === 'string') {
    result = dataString.replace('<svg', `<svg class="beacon-qrcode__image"`)
  }
  return result
}

function formatQRCodeModal(qrCodeImage: string) {
  const callToAction = 'Scan QR code with a Beacon-compatible wallet'
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
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 12px 24px 0 rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 500px;
  }
  
  .beacon-modal__header {
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
    top: 15px;
    right: 15px;
    z-index: 10000;
  }
  
  .beacon-modal__close__icon {
    width: 25px;
    height: 25px;
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
    font-family: Avenir;
    font-size: 18px;
    text-align: center;
    margin: 0 auto;
    padding: 0 30px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .beacon-qrcode__image {
    width: 100%;
    padding: 30px;
    box-sizing: border-box;
  }
  
  </style>
    <div
      id="beacon-qrcode-modal"
      class="beacon-qrcode__base animated fadeIn"
    >
      <div class="beacon-modal__base">
        <div class="beacon-modal__header">
          <div class="beacon-modal__close__wrapper">
            <div
              
              class="beacon-modal__close__icon"
            >
              <div class="beacon-modal__close__line1""></div>
              <div class="beacon-modal__close__line2"></div>
            </div>
          </div>
        </div>
        <div>
          <div>
            <p id="beacon-qrcode-text" class="beacon-qrcode__text">
              ${callToAction}
            </p>
            ${qrCodeImage}
            <button onclick="closeAlert()" id="beacon-qrcode-close">OK</button>
          </div>
        </div>
      </div>
    </div>
`
}

function openAlert(uri: string, timeoutInterval: number, cb?: any) {
  const wrapper = document.createElement('div')
  wrapper.setAttribute('id', 'beacon-wrapper')
  const qrCodeImage = formatQRCodeImage(uri)

  wrapper.innerHTML = formatQRCodeModal(qrCodeImage)

  document.body.appendChild(wrapper)
  const closeButton = document.getElementById('beacon-qrcode-close')
  setTimeout(() => {
    closeAlert()
  }, timeoutInterval)

  if (closeButton) {
    closeButton.addEventListener('click', () => {
      closeAlert()
      if (cb) {
        cb()
      }
    })
  }
}

function closeAlert() {
  const elm = document.getElementById('beacon-qrcode-modal')
  if (elm) {
    const animationDuration = 300

    elm.className = elm.className.replace('fadeIn', 'fadeOut')
    setTimeout(() => {
      const wrapper = document.getElementById('beacon-wrapper')
      if (wrapper) {
        document.body.removeChild(wrapper)
      }
    }, animationDuration)
  }
}

export { closeAlert, openAlert }
