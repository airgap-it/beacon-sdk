// Taken from https://github.com/WalletConnect/walletconnect-monorepo/blob/master/packages/qrcode-modal/src/browser.ts

import { availableTransports, ExtensionMessage, ExtensionMessageTarget } from '..'
import { myWindow } from '../MockWindow'
import { generateGUID } from '../utils/generate-uuid'
import { getTzip10Link } from '../utils/get-tzip10-link'
import { isAndroid, isIOS } from '../utils/platform'
import { getQrData } from '../utils/qr'
import { replaceInTemplate } from '../utils/replace-in-template'
import { alertTemplates } from './alert-templates'

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
  pairingPayload?: { p2pSyncCode: string; postmessageSyncCode: string }
}

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
): string => {
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

  let alertContainer = `<style>${allStyles}</style>${alertTemplates.container}`

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

  await closeAlerts()

  const id = (await generateGUID()).split('-').join('')

  const wrapper = document.createElement('div')
  wrapper.setAttribute('id', `beacon-alert-wrapper-${id}`)

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
  wrapper.innerHTML = formatAlert(id, formattedBody, title, buttons, pairingPayload?.p2pSyncCode)

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

  const extensions = await availableTransports.availableExtensions

  const defaultExtensions = [
    'ookjlbkiijinhpmnjffcofjonbfbgaoc', // Thanos
    'gpfndedineagiepkpinficbcbbgjoenn' // Beacon
  ]

  defaultExtensions.map((extId) => {
    if (!extensions.some((ext) => ext.id === extId)) {
      const extEl = document.getElementById(`ext_${extId}`)
      if (extEl) {
        extEl.classList.add('disabled')

        const el = document.createElement('p')
        el.innerHTML = 'Not installed'

        const nameEl = extEl.querySelector('.beacon-selection__name')
        if (nameEl) {
          nameEl.appendChild(el)
        }
      }
    }
  })

  const extensionList = document.getElementById(`beacon-extension-list`)
  extensions.map((extension) => {
    let extEl = document.getElementById(`ext_${extension.id}`)
    if (!extEl) {
      const altTag = `Open in ${extension.name}`
      const x = `
      <a alt="${altTag}" id="ext_${extension.id}"
       target="_blank" class="beacon-selection__list">
       <div class="beacon-selection__name">${extension.name}</div>
       ${
         extension.iconUrl
           ? `<div>
       <img class="beacon-selection__img" src="${extension.iconUrl}"/>
       </div>`
           : '<svg class="beacon-selection__img" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="wallet" class="svg-inline--fa fa-wallet fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve"><path d="M376.2,181H152.9c-5.2,0-9.4-4.2-9.4-9.4s4.2-9.4,9.4-9.4h225c5.2,0,9.4-4.2,9.4-9.4c0-15.5-12.6-28.1-28.1-28.1H143.5c-20.7,0-37.5,16.8-37.5,37.5v187.5c0,20.7,16.8,37.5,37.5,37.5h232.7c16.4,0,29.8-12.6,29.8-28.1v-150C406,193.6,392.7,181,376.2,181z M349.8,302.9c-10.4,0-18.8-8.4-18.8-18.8s8.4-18.8,18.8-18.8s18.8,8.4,18.8,18.8S360.1,302.9,349.8,302.9z"/></svg>'
       }
      </a>
       `

      const el = document.createElement('span')
      el.innerHTML = x

      if (extensionList) {
        extensionList.prepend(el)
      }
    }

    extEl = document.getElementById(`ext_${extension.id}`)

    if (extEl) {
      extEl.addEventListener('click', async () => {
        const postmessageSyncCode = pairingPayload?.postmessageSyncCode
        if (postmessageSyncCode) {
          const message: ExtensionMessage<string> = {
            target: ExtensionMessageTarget.EXTENSION,
            payload: postmessageSyncCode,
            targetId: extension.id
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          myWindow.postMessage(message as any, window.location.origin)
        }
      })
    } else {
      console.log('not adding listener', extension)
    }
  })

  const closeButton = document.getElementById(`beacon-alert-${id}-close`)

  if (closeButton) {
    closeButton.addEventListener('click', async () => {
      await closeAlert(id)
    })
  }

  const qr: HTMLElement | null = document.getElementById(`beacon--qr__container`)
  const copyButton: HTMLElement | null = document.getElementById(`beacon--qr__copy`)
  const titleEl: HTMLElement | null = document.getElementById(`beacon-title`)

  const platform = isAndroid(window) ? 'android' : isIOS(window) ? 'ios' : 'desktop'

  const mainText: HTMLElement | null = document.getElementById(`beacon-main-text`)
  const iosList: HTMLElement | null = document.getElementById(`beacon-ios-list`)
  const androidList: HTMLElement | null = document.getElementById(`beacon-android-list`)
  const desktopList: HTMLElement | null = document.getElementById(`beacon-desktop-list`)
  const webList: HTMLElement | null = document.getElementById(`beacon-web-list`)

  const switchButton: HTMLElement | null = document.getElementById(`beacon--switch__container`)

  if (
    mainText &&
    iosList &&
    androidList &&
    desktopList &&
    webList &&
    switchButton &&
    copyButton &&
    qr &&
    titleEl
  ) {
    const fn = () => {
      navigator.clipboard.writeText(pairingPayload ? pairingPayload.p2pSyncCode : '').then(
        () => {
          copyButton.innerText = 'Copied'
          console.log('Copying to clipboard was successful!')
        },
        (err) => {
          console.error('Could not copy text to clipboard: ', err)
        }
      )
    }
    copyButton.addEventListener('click', fn)
    qr.addEventListener('click', fn)

    const showPlatform = (type: 'ios' | 'android' | 'desktop' | 'none'): void => {
      const platformSwitch: HTMLElement | null = document.getElementById(`beacon-switch`)
      if (platformSwitch) {
        platformSwitch.innerHTML =
          type === 'none' ? 'Pair Wallet on same device' : 'Pair Wallet on different device'
      }

      mainText.style.display = 'none'
      titleEl.style.textAlign = 'center'
      iosList.style.display = 'none'
      androidList.style.display = 'none'
      desktopList.style.display = 'none'
      webList.style.display = 'none'
      switchButton.style.display = 'initial'

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
          titleEl.style.textAlign = 'left'
          mainText.style.display = 'initial'
          switchButton.style.display = 'none'
          break
        default:
          // QR code
          mainText.style.display = 'initial'
      }
    }

    let showQr = false

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
