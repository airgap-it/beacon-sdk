// Taken from https://github.com/WalletConnect/walletconnect-monorepo/blob/master/packages/qrcode-modal/src/browser.ts

import { NetworkType, P2PPairingRequest, PostMessagePairingRequest } from '@airgap/beacon-types'
import { windowRef } from '@airgap/beacon-core'
import { generateGUID } from '@airgap/beacon-utils'
import { alertTemplates } from './alert-templates'
import { preparePairingAlert } from './PairingAlert'
import { getColorMode } from '../../utils/colorMode'
import { createSanitizedElement } from '../../utils/html-elements'
import { constructDefaultAlert, constructPairAlert } from '../../utils/templates'

export interface AlertButton {
  text: string
  style?: 'solid' | 'outline'
  actionCallback?(): Promise<void>
}

export interface AlertConfig {
  title: string
  body?: string
  data?: string
  timer?: number
  buttons?: AlertButton[]
  pairingPayload?: {
    p2pSyncCode: () => Promise<P2PPairingRequest>
    postmessageSyncCode: () => Promise<PostMessagePairingRequest>
    preferredNetwork: NetworkType
  }
  closeButtonCallback?(): void
  disclaimerText?: string
}

let lastFocusedElement: Element | undefined | null

let document: Document
if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
  document = window.document
}

const timeout: Record<string, number | undefined> = {}

const addQR = (dataString?: string): HTMLElement => {
  if (typeof dataString === 'string') {
    return createSanitizedElement(
      'div',
      [],
      [['id', 'beacon--qr__container']],
      [
        createSanitizedElement(
          'div',
          [],
          [['id', 'beacon--qr__copy__container']],
          [
            createSanitizedElement(
              'button',
              ['beacon-modal__button--outline'],
              [['id', 'beacon--qr__copy']],
              'Copy'
            )
          ]
        )
      ]
    )
  }

  return createSanitizedElement('span', [], [], '')
}

const formatAlert = (
  id: string,
  body: HTMLElement,
  title: string,
  buttons: AlertButton[],
  hasPairingPayload?: boolean
): {
  style: string
  html: HTMLElement
} => {
  const callToAction: string = title
  const buttonsHtml = buttons.map((button, index: number) =>
    createSanitizedElement(
      'button',
      [`beacon-modal__button${button.style === 'outline' ? '--outline' : ''}`],
      [['id', `beacon-alert-${id}-${index}`]],
      button.text
    )
  )

  let allStyles = alertTemplates.default.css

  if (hasPairingPayload) {
    allStyles += alertTemplates.pair.css
  }

  const callToActionEl = createSanitizedElement('span', [], [], callToAction)

  const alertEl = hasPairingPayload
    ? constructPairAlert(id, [callToActionEl], buttonsHtml, [body])
    : constructDefaultAlert(id, [callToActionEl], buttonsHtml, [body])

  return {
    style: allStyles,
    html: alertEl
  }
}

/**
 * Close an alert by ID
 *
 * @param id ID of alert
 */
const closeAlert = (id: string): Promise<void> => {
  windowRef.postMessage(`closeAlert-${id}`)

  return new Promise((resolve) => {
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
        const parent = wrapper.parentNode
        if (parent) {
          parent.removeChild(wrapper)
        }

        if (lastFocusedElement) {
          ;(lastFocusedElement as any).focus() // set focus back to last focussed element
        }
        resolve()
      }, animationDuration)
    } else {
      resolve()
    }
  })
}

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
  const data = alertConfig.data
  const title = alertConfig.title
  const timer = alertConfig.timer
  const pairingPayload = alertConfig.pairingPayload
  const disclaimer = alertConfig.disclaimerText
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

  let formattedBody = pairingPayload
    ? addQR(body)
    : createSanitizedElement('span', [], [], body ?? '')

  if (data) {
    formattedBody = createSanitizedElement(
      'span',
      [],
      [],
      [formattedBody, createSanitizedElement('pre', [], [['style', 'text-align: left']], data)]
    )
  }

  const { style, html } = formatAlert(
    id,
    formattedBody,
    title,
    buttons,
    !!pairingPayload?.p2pSyncCode
  )
  wrapper.appendChild(html)

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

  if (disclaimer) {
    const disclaimerContainer = shadowRoot.getElementById(`beacon--disclaimer`)
    if (disclaimerContainer) {
      disclaimerContainer.innerText = disclaimer
    }
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
    await preparePairingAlert(id, shadowRoot, pairingPayload)
  }

  return id
}

export { closeAlert, closeAlerts, openAlert }
