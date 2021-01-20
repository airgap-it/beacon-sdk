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
      margin: 0 auto;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 12px 24px 0 rgba(0, 0, 0, 0.1);
      flex-direction: column;
    }

    .theme__light.beacon-toast__base {
      background: #fff;
    }

    .theme__dark.beacon-toast__base {
      background: #27334c;
    }

    .theme__dark p {
      color: #6183ff;
    }

    a {
      text-decoration: none;
      color: #3880ff;
    }

    a svg {
      width: 12px;
      margin-left: 2px;
    }

    a:visited {
      color: #3880ff;
    }

    hr {
      height: 1px;
      color: rgba(0,0,0,0.12);
      background-color: rgba(0,0,0,0.12);
      border: none;
      width: 100%;
      margin: 0;
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

    .beacon-toast__action__item__subtitle {
      min-width: 88px;
      color: rgba(0,0,0,0.54);
    }

    .beacon-toast__content__img {
      width: 24px;
      height: 24px;
      margin: 0 4px 0 6px;
    }

    .beacon-toast__more {
      width: 14px;
      padding-left: 32px;
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
  
  <div id="beacon-toast" class="beacon-toast__base theme__dark animated fadeIn">
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

  <!-- TODO: permission request
  <div id="beacon-toast" class="beacon-toast__base animated fadeIn">
  <div class="beacon-toast__content">
    <p>${text}</p>
    <svg class="beacon-toast__more" aria-hidden="true" focusable="false" data-prefix="fal" data-icon="times" class="svg-inline--fa fa-times fa-w-10" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="currentColor" d="M193.94 256L296.5 153.44l21.15-21.15c3.12-3.12 3.12-8.19 0-11.31l-22.63-22.63c-3.12-3.12-8.19-3.12-11.31 0L160 222.06 36.29 98.34c-3.12-3.12-8.19-3.12-11.31 0L2.34 120.97c-3.12 3.12-3.12 8.19 0 11.31L126.06 256 2.34 379.71c-3.12 3.12-3.12 8.19 0 11.31l22.63 22.63c3.12 3.12 8.19 3.12 11.31 0L160 289.94 262.56 392.5l21.15 21.15c3.12 3.12 8.19 3.12 11.31 0l22.63-22.63c3.12-3.12 3.12-8.19 0-11.31L193.94 256z"></path></svg>
  </div>
  <hr />
  <div class="beacon-toast__more--action">
    <div class="beacon-toast__action__item">
      <p><strong>tz1Mj7..SUAdtT</strong></p>
      </div>
      <div class="beacon-toast__action__item">
        <p class="beacon-toast__action__item__subtitle">Network</p><p>mainnet</p>
      </div>
      <div class="beacon-toast__action__item">
        <p class="beacon-toast__action__item__subtitle">Permissions</p> <p>operation_request,sign</p>
      </div>
    </div>
  </div>
  ${config.showDoneButton ? '<div id="beacon-toast-button-done"></div>' : ''}
  </div>
  -->

  <!-- TODO: operation broadcasted
  <div id="beacon-toast" class="beacon-toast__base animated fadeIn">
    <div class="beacon-toast__content">
      <p>${text}</p>
      <svg class="beacon-toast__more" aria-hidden="true" focusable="false" data-prefix="fal" data-icon="times" class="svg-inline--fa fa-times fa-w-10" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="currentColor" d="M193.94 256L296.5 153.44l21.15-21.15c3.12-3.12 3.12-8.19 0-11.31l-22.63-22.63c-3.12-3.12-8.19-3.12-11.31 0L160 222.06 36.29 98.34c-3.12-3.12-8.19-3.12-11.31 0L2.34 120.97c-3.12 3.12-3.12 8.19 0 11.31L126.06 256 2.34 379.71c-3.12 3.12-3.12 8.19 0 11.31l22.63 22.63c3.12 3.12 8.19 3.12 11.31 0L160 289.94 262.56 392.5l21.15 21.15c3.12 3.12 8.19 3.12 11.31 0l22.63-22.63c3.12-3.12 3.12-8.19 0-11.31L193.94 256z"></path></svg>
    </div>
    <hr />
    <div class="beacon-toast__more--action">
      <div class="beacon-toast__action__item">
        <p><strong>ooR5Md..WwBDkYLes</strong></p><a href="#">Open Blockexplorer <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="external-link-alt" class="svg-inline--fa fa-external-link-alt fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M432,320H400a16,16,0,0,0-16,16V448H64V128H208a16,16,0,0,0,16-16V80a16,16,0,0,0-16-16H48A48,48,0,0,0,0,112V464a48,48,0,0,0,48,48H400a48,48,0,0,0,48-48V336A16,16,0,0,0,432,320ZM488,0h-128c-21.37,0-32.05,25.91-17,41l35.73,35.73L135,320.37a24,24,0,0,0,0,34L157.67,377a24,24,0,0,0,34,0L435.28,133.32,471,169c15,15,41,4.5,41-17V24A24,24,0,0,0,488,0Z"></path></svg></a>
        </div>
      </div>
    </div>
    ${config.showDoneButton ? '<div id="beacon-toast-button-done"></div>' : ''}
  </div>
  -->
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
