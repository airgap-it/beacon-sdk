// Taken from https://github.com/WalletConnect/walletconnect-monorepo/blob/master/packages/qrcode-modal/src/browser.ts

import { generateGUID } from '../utils/generate-uuid'
import { isAndroid, isIOS } from '../utils/platform'
import { replaceInTemplate } from '../utils/replace-in-template'
import { alertTemplates } from './alert-templates'

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

const timeout: Record<string, number | undefined> = {}

const formatBody = (dataString: string): string => {
  if (typeof dataString === 'string') {
    return dataString.replace('<svg', `<svg class="beacon-alert__image"`)
  }

  return dataString
}

const formatAlert = (
  id: string,
  body: string,
  title: string,
  type: 'default' | 'pair',
  confirmButtonText?: string,
  actionButtonText?: string
): string => {
  const callToAction: string = title
  const confirmButton: string = confirmButtonText
    ? `<button id="beacon-alert-${id}-button-ok" class="beacon-modal__button">${confirmButtonText}</button>`
    : ''
  const actionButton: string = actionButtonText
    ? `<button id="beacon-alert-${id}-button-action" class="beacon-modal__button--outline">${actionButtonText}</button>`
    : ''

  let allStyles = alertTemplates.default.css

  if (type === 'pair') {
    allStyles += alertTemplates.pair.css
  }

  let alertContainer = `<style>${allStyles}</style>${alertTemplates.container}`

  alertContainer = replaceInTemplate(
    alertContainer,
    'main',
    type === 'pair' ? alertTemplates.pair.html : alertTemplates.default.html
  )

  alertContainer = replaceInTemplate(alertContainer, 'callToAction', callToAction)
  alertContainer = replaceInTemplate(alertContainer, 'actionButton', actionButton)
  alertContainer = replaceInTemplate(alertContainer, 'confirmButton', confirmButton)

  alertContainer = replaceInTemplate(alertContainer, 'body', body)
  alertContainer = replaceInTemplate(alertContainer, 'id', id)

  if (alertContainer.indexOf('{{') >= 0) {
    console.error(
      'Not all placeholders replaced!',
      alertContainer.substr(alertContainer.indexOf('{{'), 20)
    )
    throw new Error('Not all placeholders replaced!')
  }

  return alertContainer
}

/**
 * Close an alert by ID
 *
 * @param id ID of alert
 */
const closeAlert = (id: string): Promise<void> =>
  new Promise((resolve) => {
    const elm = document.getElementById(`beacon-alert-modal-${id}`)
    if (elm) {
      const animationDuration = 300

      const localTimeout = timeout[id]
      if (localTimeout) {
        clearTimeout(localTimeout)
        timeout[id] = undefined
      }

      elm.className = elm.className.replace('fadeIn', 'fadeOut')
      window.setTimeout(() => {
        const wrapper = document.getElementById(`beacon-alert-wrapper-${id}`)
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
 * Close all alerts
 */
const closeAlerts = async (): Promise<void> =>
  new Promise(async (resolve) => {
    const openAlertElements = document.querySelectorAll('[id^="beacon-alert-wrapper-"]')
    if (openAlertElements.length > 0) {
      const alertIds: string[] = []
      openAlertElements.forEach(async (element) => {
        alertIds.push(element.id.split('-')[3])
      })
      await Promise.all(alertIds.map(closeAlert))
      resolve()
    } else {
      resolve()
    }
  })

/**
 * Show an alert
 *
 * @param alertConfig The configuration of the alert
 */
const openAlert = async (alertConfig: AlertConfig): Promise<string> => {
  const body = alertConfig.body
  const title = alertConfig.title
  const timer = alertConfig.timer
  const confirmButtonText = alertConfig.confirmButtonText
  const actionButtonText = alertConfig.actionButtonText
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const confirmCallback = alertConfig.confirmCallback
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const actionCallback = alertConfig.actionCallback

  await closeAlerts()

  const id = (await generateGUID()).split('-').join('')

  const wrapper = document.createElement('div')
  wrapper.setAttribute('id', `beacon-alert-wrapper-${id}`)

  const formattedBody = body ? formatBody(body) : ''
  wrapper.innerHTML = formatAlert(
    id,
    formattedBody,
    title,
    'pair',
    confirmButtonText,
    actionButtonText
  )

  if (timer) {
    timeout[id] = window.setTimeout(async () => {
      await closeAlert(id)
    }, timer)
  }

  document.body.appendChild(wrapper)
  const okButton = document.getElementById(`beacon-alert-${id}-button-ok`)
  const actionButton = document.getElementById(`beacon-alert-${id}-button-action`)
  const closeButton = document.getElementById(`beacon-alert-${id}-close`)

  if (okButton) {
    okButton.addEventListener('click', async () => {
      await closeAlert(id)
      if (confirmCallback) {
        confirmCallback()
      }
    })
  }

  if (actionButton) {
    actionButton.addEventListener('click', async () => {
      await closeAlert(id)
      if (actionCallback) {
        actionCallback()
      }
    })
  }

  if (closeButton) {
    closeButton.addEventListener('click', async () => {
      await closeAlert(id)
    })
  }

  const platform = isAndroid(window) ? 'android' : isIOS(window) ? 'ios' : 'desktop'

  const mainText: HTMLElement | null = document.getElementById(`beacon-main-text`)
  const iosList: HTMLElement | null = document.getElementById(`beacon-ios-list`)
  const androidList: HTMLElement | null = document.getElementById(`beacon-android-list`)
  const desktopList: HTMLElement | null = document.getElementById(`beacon-desktop-list`)

  if (mainText && iosList && androidList && desktopList) {
    const showPlatform = (type: 'ios' | 'android' | 'desktop' | 'none'): void => {
      mainText.style.display = 'none'
      iosList.style.display = 'none'
      androidList.style.display = 'none'
      desktopList.style.display = 'none'

      switch (type) {
        case 'ios':
          iosList.style.display = 'initial'
          break
        case 'android':
          androidList.style.display = 'initial'
          break
        case 'desktop':
          desktopList.style.display = 'initial'
          break
        default:
          mainText.style.display = 'initial'
      }
    }

    let showQr = platform === 'desktop'

    const switchPlatform = (): void => {
      showPlatform(showQr ? 'none' : platform)
      showQr = !showQr
    }

    switchPlatform()

    const platformSwitch: HTMLElement | null = document.getElementById(`beacon-switch`)
    if (platformSwitch) {
      platformSwitch.addEventListener('click', switchPlatform)
    }
  }

  return id
}

export { closeAlert, closeAlerts, openAlert }
