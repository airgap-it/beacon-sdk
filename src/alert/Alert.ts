// Taken from https://github.com/WalletConnect/walletconnect-monorepo/blob/master/packages/qrcode-modal/src/browser.ts

import { generateGUID } from '../utils/generate-uuid'
import { isAndroid, isIOS } from '../utils/platform'
import { replaceInTemplate } from '../utils/replace-in-template'
import { alertTemplates } from './alert-templates'
export interface AlertButton {
  text: string
  style: 'solid' | 'outline'
  actionCallback(): Promise<void>
}

export interface AlertConfig {
  title: string
  body?: string
  timer?: number
  buttons?: AlertButton[]
  pairingPayload?: string
  confirmButtonText?: string // TODO: Remove before v2
  actionButtonText?: string // TODO: Remove before v2
  confirmCallback?(): void // TODO: Remove before v2
  actionCallback?(): void // TODO: Remove before v2
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
  buttons: AlertButton[],
  pairingPayload?: string
): string => {
  const callToAction: string = title
  const buttonsHtml = buttons.map(
    (button, index: number) =>
      `<button id="beacon-alert-${id}-${index}" class="beacon-modal__button${
        button.style === 'outline' ? '--outline' : ''
      }">${button.text}</button>`
  )

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
  alertContainer = replaceInTemplate(alertContainer, 'buttons', buttonsHtml.join(' '))

  alertContainer = replaceInTemplate(alertContainer, 'body', body)
  alertContainer = replaceInTemplate(alertContainer, 'id', id)

  alertContainer = replaceInTemplate(alertContainer, 'payload', pairingPayload ?? '')

  if (alertContainer.indexOf('{{') >= 0) {
    const start = alertContainer.indexOf('{{')
    const end = alertContainer.indexOf('}}')
    console.error('Not all placeholders replaced!', alertContainer.substr(start, end - start))
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
// eslint-disable-next-line complexity
const openAlert = async (alertConfig: AlertConfig): Promise<string> => {
  const body = alertConfig.body
  const title = alertConfig.title
  const timer = alertConfig.timer
  const pairingPayload = alertConfig.pairingPayload
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

  const buttons: AlertButton[] = [...(alertConfig.buttons ?? [])]

  if (actionButtonText || actionCallback) {
    buttons.push({
      text: actionButtonText ?? 'click',
      actionCallback: (actionCallback as any) ?? (() => Promise.resolve()),
      style: 'outline'
    })
  }

  if (confirmButtonText || confirmCallback) {
    buttons.push({
      text: confirmButtonText ?? 'click',
      actionCallback: (confirmCallback as any) ?? (() => Promise.resolve()),
      style: 'solid'
    })
  }

  const formattedBody = body ? formatBody(body) : ''
  wrapper.innerHTML = formatAlert(id, formattedBody, title, 'pair', buttons, pairingPayload)

  if (timer) {
    timeout[id] = window.setTimeout(async () => {
      await closeAlert(id)
    }, timer)
  }

  document.body.appendChild(wrapper)

  buttons.forEach((button: AlertButton, index) => {
    const buttonElement = document.getElementById(`beacon-alert-${id}-${index}`)
    if (buttonElement) {
      buttonElement.addEventListener('click', async () => {
        await closeAlert(id)
        if (button.actionCallback) {
          await button.actionCallback()
        }
      })
    }
  })

  const closeButton = document.getElementById(`beacon-alert-${id}-close`)

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
  const webList: HTMLElement | null = document.getElementById(`beacon-web-list`)

  if (mainText && iosList && androidList && desktopList && webList) {
    const showPlatform = (type: 'ios' | 'android' | 'desktop' | 'none'): void => {
      const platformSwitch: HTMLElement | null = document.getElementById(`beacon-switch`)
      if (platformSwitch) {
        platformSwitch.innerHTML =
          type === 'none' ? 'Pair Wallet on same device' : 'Pair Wallet on different device'
      }

      mainText.style.display = 'none'
      iosList.style.display = 'none'
      androidList.style.display = 'none'
      desktopList.style.display = 'none'
      webList.style.display = 'none'

      switch (type) {
        case 'ios':
          iosList.style.display = 'initial'
          break
        case 'android':
          androidList.style.display = 'initial'
          break
        case 'desktop':
          desktopList.style.display = 'initial'
          webList.style.display = 'initial'
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

    {
      const platformSwitch: HTMLElement | null = document.getElementById(`beacon-switch`)
      if (platformSwitch) {
        platformSwitch.addEventListener('click', switchPlatform)
      }
    }
  }

  return id
}

export { closeAlert, closeAlerts, openAlert }
