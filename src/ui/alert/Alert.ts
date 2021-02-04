// Taken from https://github.com/WalletConnect/walletconnect-monorepo/blob/master/packages/qrcode-modal/src/browser.ts

import { NetworkType } from '../..'
import { getColorMode } from '../../colorMode'
import { generateGUID } from '../../utils/generate-uuid'
import { getTzip10Link } from '../../utils/get-tzip10-link'
import { getQrData } from '../../utils/qr'
import { replaceInTemplate } from '../../utils/replace-in-template'
import { alertTemplates } from './alert-templates'
import { preparePairingAlert } from './PairingAlert'

export interface AlertButton {
  text: string
  style?: 'solid' | 'outline'
  actionCallback?(): Promise<void>
}

export interface AlertConfig {
  title: string
  body?: string
  timer?: number
  buttons?: AlertButton[]
  pairingPayload?: {
    p2pSyncCode: string
    postmessageSyncCode: string
    preferredNetwork: NetworkType
  }
  closeButtonCallback?(): void
}

let lastFocusedElement: Element | undefined | null

let document: Document
if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
  document = window.document
}

const timeout: Record<string, number | undefined> = {}

const formatQR = (dataString: string, pairingPayload: string): string => {
  if (typeof dataString === 'string') {
    const uri = getTzip10Link('tezos://', pairingPayload)
    const qr = getQrData(uri, 'svg')
    const qrString = qr.replace('<svg', `<svg class="beacon-alert__image"`)

    return `<div id="beacon--qr__container">${qrString}<div id="beacon--qr__copy__container"><button class="beacon-modal__button--outline" id="beacon--qr__copy">Copy</button></div></div>${dataString}`
  }

  return dataString
}

const formatAlert = (
  id: string,
  body: string,
  title: string,
  buttons: AlertButton[],
  pairingPayload?: string
): {
  style: string
  html: string
} => {
  const callToAction: string = title
  const buttonsHtml = buttons.map(
    (button, index: number) =>
      `<button id="beacon-alert-${id}-${index}" class="beacon-modal__button${
        button.style === 'outline' ? '--outline' : ''
      }">${button.text}</button>`
  )

  let allStyles = alertTemplates.default.css

  if (pairingPayload) {
    allStyles += alertTemplates.pair.css
  }

  let alertContainer = alertTemplates.container

  alertContainer = replaceInTemplate(
    alertContainer,
    'main',
    pairingPayload ? alertTemplates.pair.html : alertTemplates.default.html
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

  return {
    style: allStyles,
    html: alertContainer
  }
}

/**
 * Close an alert by ID
 *
 * @param id ID of alert
 */
const closeAlert = (id: string): Promise<void> =>
  new Promise((resolve) => {
    const wrapper = document.getElementById(`beacon-alert-wrapper-${id}`)
    if (!wrapper) {
      return resolve()
    }

    const elm = wrapper.shadowRoot?.getElementById(`beacon-alert-modal-${id}`)
    if (elm) {
      const animationDuration = 300

      const localTimeout = timeout[id]
      if (localTimeout) {
        clearTimeout(localTimeout)
        timeout[id] = undefined
      }

      elm.className = elm.className.replace('fadeIn', 'fadeOut')
      window.setTimeout(() => {
        document.body.removeChild(wrapper)
        if (lastFocusedElement) {
          ;(lastFocusedElement as any).focus() // set focus back to last focussed element
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
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const closeButtonCallback = alertConfig.closeButtonCallback

  await closeAlerts()

  const id = (await generateGUID()).split('-').join('')

  const shadowRootEl = document.createElement('div')
  shadowRootEl.setAttribute('id', `beacon-alert-wrapper-${id}`)
  const shadowRoot = shadowRootEl.attachShadow({ mode: 'open' })

  const wrapper = document.createElement('div')
  wrapper.setAttribute('tabindex', `0`) // Make modal focussable

  shadowRoot.appendChild(wrapper)

  const buttons: AlertButton[] = [
    ...(alertConfig.buttons?.map((button) => ({
      text: button.text,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      actionCallback: button.actionCallback ?? (() => Promise.resolve()),
      style: button.style ?? 'outline'
    })) ?? [])
  ]

  const formattedBody =
    body && pairingPayload ? formatQR(body, pairingPayload?.p2pSyncCode) : body ?? ''

  const { style, html } = formatAlert(
    id,
    formattedBody,
    title,
    buttons,
    pairingPayload?.p2pSyncCode
  )
  wrapper.innerHTML = html

  const styleEl = document.createElement('style')

  styleEl.textContent = style
  shadowRoot.appendChild(styleEl)

  if (timer) {
    timeout[id] = window.setTimeout(async () => {
      await closeAlert(id)
    }, timer)
  }

  document.body.prepend(shadowRootEl)

  const closeButton = shadowRoot.getElementById(`beacon-alert-${id}-close`)

  const closeButtonClick = async (): Promise<void> => {
    if (closeButtonCallback) {
      closeButtonCallback()
    }
    await closeAlert(id)
  }

  const colorMode = getColorMode()
  const elm = shadowRoot.getElementById(`beacon-alert-modal-${id}`)
  if (elm) {
    elm.classList.add(`theme__${colorMode}`)
    elm.addEventListener('click', closeButtonClick) // Backdrop click dismisses alert
  }

  const modal = shadowRoot.querySelectorAll('.beacon-modal__wrapper')
  if (modal.length > 0) {
    modal[0].addEventListener('click', (event) => {
      event.stopPropagation()
    })
  }

  lastFocusedElement = document.activeElement // Store which element has been focussed before the alert is shown
  wrapper.focus() // Focus alert for accessibility

  buttons.forEach((button: AlertButton, index) => {
    const buttonElement = shadowRoot.getElementById(`beacon-alert-${id}-${index}`)
    if (buttonElement) {
      buttonElement.addEventListener('click', async () => {
        await closeAlert(id)
        if (button.actionCallback) {
          await button.actionCallback()
        }
      })
    }
  })

  if (closeButton) {
    closeButton.addEventListener('click', async () => {
      await closeButtonClick()
    })
  }

  window.addEventListener('keydown', async (event) => {
    if (event.key === 'Escape') {
      await closeButtonClick()
    }
  })

  if (pairingPayload) {
    await preparePairingAlert(shadowRoot, pairingPayload)
  }

  return id
}

export { closeAlert, closeAlerts, openAlert }
