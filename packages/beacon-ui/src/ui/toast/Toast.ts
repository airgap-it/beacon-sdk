import { generateGUID } from '@airgap/beacon-utils'
import { WalletInfo } from '@airgap/beacon-types'
import { toastTemplates } from './toast-templates'
import { getColorMode } from '../../utils/colorMode'
import { createIconSVGExternal, createSanitizedElement } from '../../utils/html-elements'
import { constructPoweredByBeacon, constructToastContainer } from '../../utils/templates'

export interface ToastAction {
  text: string
  isBold?: boolean
  actionText?: string
  actionLogo?: 'external'
  actionCallback?(): Promise<void>
}

export interface ToastConfig {
  body: string
  timer?: number
  forceNew?: boolean
  state: 'prepare' | 'loading' | 'acknowledge' | 'finished'
  actions?: ToastAction[]
  walletInfo?: WalletInfo
  openWalletAction?(): Promise<void>
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
  const { text, isBold, actionText, actionLogo, actionCallback } = toastAction

  const id = await generateGUID()
  const wrapper = document.createElement('div')
  wrapper.classList.add('beacon-toast__action__item')

  removeAllChildNodes(wrapper)

  const wrapBold = (element: string | HTMLElement[]) => {
    return createSanitizedElement('strong', [], [], element)
  }

  if (actionCallback) {
    if (text.length > 0) {
      wrapper.appendChild(createSanitizedElement('p', [], [], text))
    }
    const textEl = createSanitizedElement(
      'span',
      [],
      [],
      [
        createSanitizedElement('span', [], [], actionText),
        actionLogo && actionLogo === 'external' ? createIconSVGExternal() : undefined
      ]
    )
    wrapper.appendChild(
      createSanitizedElement(
        'p',
        [],
        [],
        [createSanitizedElement('a', [], [['id', id]], [isBold ? wrapBold([textEl]) : textEl])]
      )
    )
  } else if (actionText) {
    if (text.length > 0) {
      wrapper.appendChild(
        createSanitizedElement('p', ['beacon-toast__action__item__subtitle'], [], text)
      )
    }
    const textEl = createSanitizedElement('span', [], [], actionText)
    wrapper.appendChild(createSanitizedElement('p', [], [], [isBold ? wrapBold([textEl]) : textEl]))
  } else {
    const textEl = createSanitizedElement('p', [], [], text)
    wrapper.appendChild(isBold ? wrapBold([textEl]) : textEl)
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

const formatToastText = (html: string): HTMLElement[] => {
  const walletIcon = globalToastConfig?.walletInfo?.icon
  const walletName = globalToastConfig?.walletInfo?.name

  let walletEl: HTMLElement | undefined

  const walletNameEl = createSanitizedElement('strong', [], [], walletName ?? 'Wallet')

  if (walletIcon) {
    walletEl = createSanitizedElement(
      'span',
      ['beacon-toast__wallet__container'],
      [],
      [
        createSanitizedElement('img', ['beacon-toast__content__img'], [['src', walletIcon]], ''),
        walletNameEl
      ]
    )
  } else {
    walletEl = walletNameEl
  }

  const splits = html.split(`{{wallet}}`)

  if (splits.length === 1) {
    return [createSanitizedElement('span', [], [], html)]
  } else {
    const out: HTMLElement[] = []
    for (let x = 0; x < splits.length; x++) {
      out.push(createSanitizedElement('span', [], [], splits[x]))
      if (x < splits.length - 1) {
        out.push(walletEl)
      }
    }

    return out
  }
}

const getToastHTML = (
  config: ToastConfig
): {
  style: string
  html: HTMLElement
} => {
  const text = config.body

  const elements = formatToastText(text)

  const outerEl = createSanitizedElement('span', ['beacon-toast__wallet__outer'], [], elements)

  const toastContainerEl = constructToastContainer([outerEl])

  return {
    style: toastTemplates.default.css,
    html: toastContainerEl
  }
}

/**
 * Close a toast
 */
const closeToast = (): Promise<void> =>
  new Promise((resolve) => {
    globalToastConfig = undefined

    const wrapper = document.getElementById('beacon-toast-wrapper')
    if (!wrapper) {
      return resolve()
    }

    const elm = wrapper.shadowRoot?.getElementById('beacon-toast')
    if (elm) {
      const animationDuration = 300

      if (timeout) {
        clearTimeout(timeout)
        timeout = undefined
      }

      elm.className = elm.className.replace('fadeIn', 'fadeOut')
      window.setTimeout(() => {
        const parent = wrapper.parentNode
        if (parent) {
          parent.removeChild(wrapper)
        }
        resolve()
      }, animationDuration)
    } else {
      resolve()
    }
  })

const registerClick = (
  shadowRoot: ShadowRoot,
  id: string,
  callback: (el: HTMLElement) => Promise<void>
): HTMLElement | null => {
  const button = shadowRoot.getElementById(id)

  if (button) {
    button.addEventListener('click', async () => {
      await callback(button)
    })
  }

  return button
}

const showElement = (shadowRoot: ShadowRoot, id: string): void => {
  const el = shadowRoot.getElementById(id)

  if (el) {
    el.classList.remove('hide')
    el.classList.add('show')
  }
}

const hideElement = (shadowRoot: ShadowRoot, id: string): void => {
  const el = shadowRoot.getElementById(id)

  if (el) {
    el.classList.add('hide')
    el.classList.remove('show')
  }
}

// const showLoader = (): void => {
//   showElement('beacon-toast-loader')
// }

const hideLoader = (shadowRoot: ShadowRoot): void => {
  hideElement(shadowRoot, 'beacon-toast-loader')
  showElement(shadowRoot, 'beacon-toast-loader-placeholder')
}

const showExpand = (shadowRoot: ShadowRoot): void => {
  showElement(shadowRoot, 'beacon-toast-button-expand')
  hideElement(shadowRoot, 'beacon-toast-button-close')
}

const showClose = (shadowRoot: ShadowRoot): void => {
  showElement(shadowRoot, 'beacon-toast-button-close')
  hideElement(shadowRoot, 'beacon-toast-button-expand')
}

const collapseList = (shadowRoot: ShadowRoot): void => {
  const expandButton = shadowRoot.getElementById('beacon-toast-button-expand')
  const list = shadowRoot.getElementById('beacon-toast-list')

  if (expandButton && list) {
    expandButton.classList.remove('beacon-toast__upside_down')
    list.classList.add('hide')
    list.classList.remove('show')
  }
}

const expandList = (shadowRoot: ShadowRoot): void => {
  const expandButton = shadowRoot.getElementById('beacon-toast-button-expand')
  const list = shadowRoot.getElementById('beacon-toast-list')

  if (expandButton && list) {
    expandButton.classList.add('beacon-toast__upside_down')
    list.classList.remove('hide')
    list.classList.add('show')
  }
}

const expandOrCollapseList = (shadowRoot: ShadowRoot): void => {
  const expandButton = shadowRoot.getElementById('beacon-toast-button-expand')
  const list = shadowRoot.getElementById('beacon-toast-list')
  if (expandButton && list) {
    if (expandButton.classList.contains('beacon-toast__upside_down')) {
      collapseList(shadowRoot)
    } else {
      expandList(shadowRoot)
    }
  }
}

const addActionsToToast = async (
  shadowRoot: ShadowRoot,
  toastConfig: ToastConfig,
  list: HTMLElement
): Promise<void> => {
  const actions = toastConfig.actions
  if (actions && actions.length > 0) {
    const actionPromises = actions.map(async (action) => {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      return createActionItem(action)
    })

    const actionItems = await Promise.all(actionPromises)

    actionItems.forEach((item) => list.appendChild(item))

    const poweredByBeacon = document.createElement('small')
    poweredByBeacon.classList.add('beacon-toast__powered')
    poweredByBeacon.appendChild(constructPoweredByBeacon())

    list.appendChild(poweredByBeacon)
    showExpand(shadowRoot)
  } else {
    showClose(shadowRoot)
    collapseList(shadowRoot)
  }
}

const createNewToast = async (toastConfig: ToastConfig): Promise<void> => {
  globalToastConfig = toastConfig
  const timer = toastConfig.timer

  const shadowRootEl = document.createElement('div')
  shadowRootEl.setAttribute('id', 'beacon-toast-wrapper')
  const shadowRoot = shadowRootEl.attachShadow({ mode: 'open' })

  const wrapper = document.createElement('div')
  const { style, html } = getToastHTML(toastConfig)
  wrapper.appendChild(html)

  const styleEl = document.createElement('style')

  styleEl.textContent = style

  shadowRoot.appendChild(wrapper)
  shadowRoot.appendChild(styleEl)

  if (timer) {
    timeout = window.setTimeout(async () => {
      await closeToast()
    }, timer)
  }

  document.body.prepend(shadowRootEl)

  const colorMode = getColorMode()
  const elm = shadowRoot.getElementById(`beacon-toast`)
  if (elm) {
    elm.classList.add(`theme__${colorMode}`)
  }

  const list = shadowRoot.getElementById('beacon-toast-list')

  if (list) {
    await addActionsToToast(shadowRoot, toastConfig, list)
  }

  const openWalletButtonEl = shadowRoot.getElementById('beacon-open-wallet')
  if (openWalletButtonEl) {
    if (toastConfig.openWalletAction) {
      openWalletButtonEl.addEventListener('click', () => {
        if (toastConfig.openWalletAction) {
          toastConfig.openWalletAction()
        }
      })
    } else {
      openWalletButtonEl.classList.add('hide')
    }
  }

  if (globalToastConfig.state === 'loading') {
    expandTimeout = window.setTimeout(async () => {
      const expandButton = shadowRoot.getElementById('beacon-toast-button-expand')
      if (expandButton && !expandButton.classList.contains('beacon-toast__upside_down')) {
        expandOrCollapseList(shadowRoot)
      }
    }, EXPAND_AFTER)
  }

  registerClick(shadowRoot, 'beacon-toast-button-done', async () => {
    await closeToast()
  })
  const closeButton = registerClick(shadowRoot, 'beacon-toast-button-close', async () => {
    await closeToast()
  })
  if (closeButton && globalToastConfig.state === 'loading') {
    closeButton.classList.add('hide')
  }
  registerClick(shadowRoot, 'beacon-toast-button-expand', async () => {
    expandOrCollapseList(shadowRoot)
  })
}

const updateToast = async (toastConfig: ToastConfig): Promise<void> => {
  globalToastConfig = { ...globalToastConfig, ...toastConfig }

  const timer = toastConfig.timer

  const wrapper = document.getElementById('beacon-toast-wrapper')
  if (!wrapper) {
    return
  }
  const shadowRoot = wrapper.shadowRoot
  if (!shadowRoot) {
    return
  }

  const list = shadowRoot.getElementById('beacon-toast-list')

  if (list) {
    removeAllChildNodes(list)

    await addActionsToToast(shadowRoot, toastConfig, list)
  }

  if (globalToastConfig.state === 'loading') {
    expandTimeout = window.setTimeout(async () => {
      const expandButton = shadowRoot.getElementById('beacon-toast-button-expand')
      if (expandButton && !expandButton.classList.contains('beacon-toast__upside_down')) {
        expandOrCollapseList(shadowRoot)
      }
    }, EXPAND_AFTER)
  }

  const toastTextEl = shadowRoot.getElementById('beacon-text-content')
  if (toastTextEl) {
    removeAllChildNodes(toastTextEl)
    toastTextEl.appendChild(
      createSanitizedElement(
        'span',
        ['beacon-toast__wallet__outer'],
        [],
        formatToastText(toastConfig.body)
      )
    )
  }

  const openWalletButtonEl = shadowRoot.getElementById('beacon-open-wallet')
  if (openWalletButtonEl) {
    if (toastConfig.openWalletAction) {
      openWalletButtonEl.classList.remove('hide')
      openWalletButtonEl.addEventListener('click', () => {
        if (toastConfig.openWalletAction) {
          toastConfig.openWalletAction()
        }
      })
    } else {
      openWalletButtonEl.classList.add('hide')
    }
  }

  if (timer) {
    timeout = window.setTimeout(async () => {
      await closeToast()
    }, timer)
  }

  const doneButton = shadowRoot.getElementById('beacon-toast-button-done')

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
      await createNewToast(toastConfig)
    } else {
      await updateToast(toastConfig)
    }
  } else {
    await createNewToast(toastConfig)
  }

  if (globalToastConfig && globalToastConfig.state === 'finished') {
    const shadowRoot = document.getElementById('beacon-toast-wrapper')?.shadowRoot

    if (shadowRoot) {
      hideLoader(shadowRoot)
      showClose(shadowRoot)
      expandList(shadowRoot)
    }
  }

  return
}

export { closeToast, openToast }
