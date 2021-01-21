import { getColorMode } from '../../colorMode'
import { WalletInfo } from '../../events'
import { replaceInTemplate } from '../../utils/replace-in-template'
import { generateGUID } from '../../utils/generate-uuid'
import { toastTemplates } from './toast-templates'

export interface ToastAction {
  text: string
  actionText?: string
  actionCallback?(): Promise<void>
}

export interface ToastConfig {
  body: string
  timer?: number
  forceNew?: boolean
  walletInfo?: WalletInfo
  state?: 'loading' | 'finished'
  actions?: ToastAction[]
}

let document: Document
if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
  document = window.document
}

const EXPAND_AFTER: number = 5 * 1000

let timeout: number | undefined
let expandTimeout: number | undefined
let globalToastConfig: ToastConfig | undefined

const createActionItem = async (toastAction: ToastAction): Promise<HTMLElement> => {
  const { text, actionText, actionCallback } = toastAction

  const id = await generateGUID()
  const wrapper = document.createElement('div')
  wrapper.classList.add('beacon-toast__action__item')

  if (actionCallback) {
    wrapper.innerHTML = `<p>${text}</p>
  <a id="${id}" href="#">${actionText}</a>`
  } else if (actionText) {
    wrapper.innerHTML = `<p class="beacon-toast__action__item__subtitle">${text}</p><p>${actionText}</p>`
  } else {
    wrapper.innerHTML = `<p>${text}</p>`
  }

  if (actionCallback) {
    wrapper.addEventListener('click', actionCallback)
  }

  return wrapper
}

const removeAllChildNodes = (parent: HTMLElement): void => {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild)
  }
}

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

const showElement = (id: string): void => {
  const el = document.getElementById(id)

  if (el) {
    el.classList.remove('hide')
  }
}

const hideElement = (id: string): void => {
  const el = document.getElementById(id)

  if (el) {
    el.classList.add('hide')
  }
}

// const showLoader = (): void => {
//   showElement('beacon-toast-loader')
// }

const hideLoader = (): void => {
  hideElement('beacon-toast-loader')
}

// const showToggle = (): void => {
//   showElement('beacon-toast-button-expand')
//   hideElement('beacon-toast-button-close')
// }

const showClose = (): void => {
  showElement('beacon-toast-button-close')
  hideElement('beacon-toast-button-expand')
}

const collapseList = (): void => {
  const expandButton = document.getElementById('beacon-toast-button-expand')
  const list = document.getElementById('beacon-toast-list')

  if (expandButton && list) {
    expandButton.classList.remove('beacon-toast__upside_down')
    list.classList.add('hide')
    list.classList.remove('show')
  }
}

const expandList = (): void => {
  const expandButton = document.getElementById('beacon-toast-button-expand')
  const list = document.getElementById('beacon-toast-list')

  if (expandButton && list) {
    expandButton.classList.add('beacon-toast__upside_down')
    list.classList.remove('hide')
    list.classList.add('show')
  }
}

const expandOrCollapseList = (): void => {
  const expandButton = document.getElementById('beacon-toast-button-expand')
  const list = document.getElementById('beacon-toast-list')
  if (expandButton && list) {
    if (expandButton.classList.contains('beacon-toast__upside_down')) {
      collapseList()
    } else {
      expandList()
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

  const list = document.getElementById('beacon-toast-list')

  const actions = toastConfig.actions
  if (list) {
    if (actions && actions.length > 0) {
      const actionPromises = actions.map(async (action) => {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        return createActionItem(action)
      })

      const actionItems = await Promise.all(actionPromises)

      actionItems.forEach((item) => list.appendChild(item))
    } else {
      showClose()
      collapseList()
    }
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
    closeButton.classList.add('hide')
  }
  registerClick('beacon-toast-button-expand', async () => {
    console.log('CLICK')
    expandOrCollapseList()
  })
}

const updateToast = async (toastConfig: ToastConfig): Promise<void> => {
  globalToastConfig = { ...globalToastConfig, ...toastConfig }
  console.log('UPDATE, global', globalToastConfig)
  const timer = toastConfig.timer

  const list = document.getElementById('beacon-toast-list')

  if (list) {
    removeAllChildNodes(list)

    const actions = toastConfig.actions
    if (actions && actions.length > 0) {
      const actionPromises = actions.map(async (action) => {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        return createActionItem(action)
      })

      const actionItems = await Promise.all(actionPromises)

      actionItems.forEach((item) => list.appendChild(item))
    } else {
      console.log('NO ACTIONS')
      showClose()
      collapseList()
    }
  }

  // if (globalToastConfig.state === 'loading') {
  //   console.log('loading', globalToastConfig)
  //   showLoader()
  //   showToggle()
  //   collapseList()
  // }

  if (globalToastConfig.state === 'finished') {
    console.log('finished', globalToastConfig)
    hideLoader()
    showClose()
    expandList()
  }

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
