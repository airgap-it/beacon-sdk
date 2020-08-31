export interface ToastConfig {
  body: string
  timer?: number
  showLoader?: boolean
  showDoneButton?: boolean
}

let document: Document
if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
  document = window.document
}

let timeout: NodeJS.Timeout | undefined

const getToastHTML = (config: ToastConfig): string => {
  const text = config.body

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

    .beacon-toast__base {
      position: absolute;
      bottom: 16px;
      right: 16px;
      padding: 16px;
      height: 64px;
      z-index: 2147483000;
      background: #fff;
      margin: 0 auto;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 12px 24px 0 rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
    }

    .beacon-toast__content {
      padding: 0 0 0 16px;
      font-family: Roboto, sans-serif;
    }
    .spinner .loader,
    .spinner .loader:after {
      border-radius: 50%;
      width: 32px;
      height: 32px;
    }
    .spinner .loader {
      position: relative;
      text-indent: -9999em;
      border-top: 4px solid rgba(56,128,255, 0.2);
      border-right: 4px solid rgba(56,128,255, 0.2);
      border-bottom: 4px solid rgba(56,128,255, 0.2);
      border-left: 4px solid #3880ff;
      -webkit-transform: translateZ(0);
      -ms-transform: translateZ(0);
      transform: translateZ(0);
      -webkit-animation: spinner 1.1s infinite linear;
      animation: spinner 1.1s infinite linear;
    }
    @-webkit-keyframes spinner {
      0% {
        -webkit-transform: rotate(0deg);
        transform: rotate(0deg);
      }
      100% {
        -webkit-transform: rotate(360deg);
        transform: rotate(360deg);
      }
    }
    @keyframes spinner {
      0% {
        -webkit-transform: rotate(0deg);
        transform: rotate(0deg);
      }
      100% {
        -webkit-transform: rotate(360deg);
        transform: rotate(360deg);
      }
    }
  </style>
  
  <div id="beacon-toast" class="beacon-toast__base animated fadeIn">
    <div class="load-container spinner">
      <div class="loader">Loading...</div>
    </div>
    <div class="beacon-toast__content">
      <p>${text}</p>
    </div>
    ${config.showDoneButton ? '<div id="beacon-toast-button-done"></div>' : ''}
  </div>
`
}

/**
 * Close a toast
 */
const closeToast = (): Promise<void> =>
  new Promise((resolve) => {
    const elm = document.getElementById('beacon-toast')
    if (elm) {
      const animationDuration = 300

      if (timeout) {
        clearTimeout(timeout)
        timeout = undefined
      }

      elm.className = elm.className.replace('fadeIn', 'fadeOut')
      setTimeout(() => {
        const wrapper = document.getElementById('beacon-toast-wrapper')
        if (wrapper) {
          document.body.removeChild(wrapper)
        }
        resolve()
      }, animationDuration)
    } else {
      resolve()
    }
  })

/**
 * Create a new toast
 *
 * @param toastConfig Configuration of the toast
 */
const openToast = async (toastConfig: ToastConfig): Promise<void> => {
  const timer = toastConfig.timer

  await closeToast()

  const wrapper = document.createElement('div')
  wrapper.setAttribute('id', 'beacon-toast-wrapper')
  wrapper.innerHTML = getToastHTML(toastConfig)

  if (timer) {
    timeout = setTimeout(async () => {
      await closeToast()
    }, timer)
  }

  document.body.appendChild(wrapper)
  const doneButton = document.getElementById('beacon-toast-button-done')

  if (doneButton) {
    doneButton.addEventListener('click', async () => {
      await closeToast()
    })
  }
}

export { closeToast, openToast }
