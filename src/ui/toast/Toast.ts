import { getColorMode } from '../../colorMode'
import { WalletInfo } from '../../events'
import { replaceInTemplate } from '../../utils/replace-in-template'
import { toastTemplates } from './toast-templates'

export interface ToastConfig {
  body: string
  timer?: number
  forceNew?: boolean
  walletInfo?: WalletInfo
}

let document: Document
if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
  document = window.document
}

const EXPAND_AFTER: number = 5 * 1000

let timeout: number | undefined
let expandTimeout: number | undefined
let globalToastConfig: ToastConfig | undefined

const formatToastText = (html: string): string => {
  const walletIcon = globalToastConfig?.walletInfo?.walletIcon
  const walletName = globalToastConfig?.walletInfo?.walletName

  let wallet = ''
  if (walletIcon) {
    wallet += `<img class="beacon-toast__content__img" src="${walletIcon}">`
  }
  if (walletName) {
    wallet += `<strong>${walletName}</strong>`
  } else {
    wallet += `wallet`
  }

  return replaceInTemplate(html, 'wallet', wallet)
}

const getToastHTML = (config: ToastConfig): string => {
  const text = config.body

  let html = `<style>${toastTemplates.default.css}</style>${toastTemplates.default.html}`
  html = replaceInTemplate(html, 'text', text)
  html = formatToastText(html)

  return html
}

/**
 * Close a toast
 */
const closeToast = (): Promise<void> =>
  new Promise((resolve) => {
    globalToastConfig = undefined
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

const registerClick = (
  id: string,
  callback: (el: HTMLElement) => Promise<void>
): HTMLElement | null => {
  const button = document.getElementById(id)

  if (button) {
    button.addEventListener('click', async () => {
      await callback(button)
    })
  }

  return button
}

const expandOrCollapseList = () => {
  const expandButton = document.getElementById('beacon-toast-button-expand')
  const list = document.getElementById('beacon-toast-list')
  if (expandButton && list) {
    if (expandButton.classList.contains('beacon-toast__upside_down')) {
      expandButton.classList.remove('beacon-toast__upside_down')
      list.classList.add('collapsed')
      list.classList.remove('expanded')
    } else {
      expandButton.classList.add('beacon-toast__upside_down')
      list.classList.remove('collapsed')
      list.classList.add('expanded')
    }
  }
}

const createNewToast = async (toastConfig: ToastConfig): Promise<void> => {
  globalToastConfig = toastConfig
  const timer = toastConfig.timer

  const wrapper = document.createElement('div')
  wrapper.setAttribute('id', 'beacon-toast-wrapper')
  wrapper.innerHTML = getToastHTML(toastConfig)

  if (timer) {
    timeout = window.setTimeout(async () => {
      await closeToast()
    }, timer)
  }

  document.body.appendChild(wrapper)

  const colorMode = getColorMode()
  const elm = document.getElementById(`beacon-toast`)
  if (elm) {
    elm.classList.add(`theme__${colorMode}`)
  }

  expandTimeout = window.setTimeout(async () => {
    const expandButton = document.getElementById('beacon-toast-button-expand')
    if (expandButton && !expandButton.classList.contains('beacon-toast__upside_down')) {
      expandOrCollapseList()
    }
  }, EXPAND_AFTER)

  registerClick('beacon-toast-button-done', async () => {
    await closeToast()
  })
  const closeButton = registerClick('beacon-toast-button-close', async () => {
    await closeToast()
  })
  if (closeButton) {
    closeButton.classList.add('collapsed')
  }
  registerClick('beacon-toast-button-expand', async () => {
    console.log('CLICK')
    expandOrCollapseList()
  })
  registerClick('cancel-request', async () => {
    await closeToast()
  })
  registerClick('reset-connection', async () => {
    console.log('reset connection')
    await closeToast()
  })
}

const updateToast = async (toastConfig: ToastConfig): Promise<void> => {
  globalToastConfig = { ...globalToastConfig, ...toastConfig }
  console.log('UPDATE, global', globalToastConfig)
  const timer = toastConfig.timer

  const toastTextEl = document.getElementById('beacon-text')
  if (toastTextEl) {
    toastTextEl.innerHTML = formatToastText(toastConfig.body)
  }

  if (timer) {
    timeout = window.setTimeout(async () => {
      await closeToast()
    }, timer)
  }

  const doneButton = document.getElementById('beacon-toast-button-done')

  if (doneButton) {
    doneButton.addEventListener('click', async () => {
      await closeToast()
    })
  }
}

/**
 * Create a new toast
 *
 * @param toastConfig Configuration of the toast
 */
const openToast = async (toastConfig: ToastConfig): Promise<void> => {
  if (expandTimeout) {
    clearTimeout(expandTimeout)
  }

  const wrapper = document.getElementById('beacon-toast-wrapper')
  if (wrapper) {
    if (toastConfig.forceNew) {
      await closeToast()
    } else {
      return updateToast(toastConfig)
    }
  }

  return createNewToast(toastConfig)
}

export { closeToast, openToast }
