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

let timeout: number | undefined

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
      top: 16px;
      right: 16px;
      z-index: 2147483000;
      background: #fff;
      margin: 0 auto;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 12px 24px 0 rgba(0, 0, 0, 0.1);
      flex-direction: column;
    }

    a {
      text-decoration: none;
    }

    .beacon-toast__content {
      justify-content: space-between;
    }

    .beacon-toast__content p, .beacon-toast__action__item {
      align-items: center;
    }

    .beacon-toast__content, .beacon-toast__base, .beacon-toast__action__item, .beacon-toast__content p  {
      display: flex;
    }

    .beacon-toast__content, .beacon-toast__action__item  {
      padding: 0 16px;
      font-family: Roboto, Helvetica, sans-serif;
    }

    .beacon-toast__action__item {
      font-size: 14px;
    }

    .beacon-toast__action__item p {
      margin-right: 8px;
      align-items: center;
    }

    .beacon-toast__content__img {
      width: 24px;
      height: 24px;
      margin: 0 4px 0 6px;
    }

    .beacon-toast__more {
      width: 14px;
      padding-left: 24px;
    }

    .beacon-toast__more--action {
      margin: 8px 0;
    }

    .progress-line, .progress-line:before {
      height: 3px;
      width: 100%;
      margin: 0;
    }
    .progress-line {
      background-color: #a7c4f7;
      display: -webkit-flex;
      display: flex;
    }
    .progress-line:before {
      background-color: #3880ff;
      content: '';
      -webkit-animation: running-progress 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      animation: running-progress 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }
    @-webkit-keyframes running-progress {
      0% { margin-left: 0px; margin-right: 100%; }
      50% { margin-left: 25%; margin-right: 0%; }
      100% { margin-left: 100%; margin-right: 0; }
    }
    @keyframes running-progress {
      0% { margin-left: 0px; margin-right: 100%; }
      50% { margin-left: 25%; margin-right: 0%; }
      100% { margin-left: 100%; margin-right: 0; }
    }
  </style>
  
  <div id="beacon-toast" class="beacon-toast__base animated fadeIn">
    <div class="beacon-toast__content">
      <p>${text}</p>
      <svg class="beacon-toast__more" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="angle-down" class="svg-inline--fa fa-angle-down fa-w-10" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="currentColor" d="M143 352.3L7 216.3c-9.4-9.4-9.4-24.6 0-33.9l22.6-22.6c9.4-9.4 24.6-9.4 33.9 0l96.4 96.4 96.4-96.4c9.4-9.4 24.6-9.4 33.9 0l22.6 22.6c9.4 9.4 9.4 24.6 0 33.9l-136 136c-9.2 9.4-24.4 9.4-33.8 0z"></path></svg>
    </div>
    <div class="progress-line"></div>
    <div class="beacon-toast__more--action">
    <div class="beacon-toast__action__item">
    <p>Did you make a mistake?</p><a href="#">Cancel Request</a>
    </div>
    <div class="beacon-toast__action__item">
    <p>Wallet not receiving request?</p><a href="#">Reset Connection</a>
    </div>
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
      window.setTimeout(() => {
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
    timeout = window.setTimeout(async () => {
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
