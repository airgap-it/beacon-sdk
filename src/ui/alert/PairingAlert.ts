import { Serializer } from '../../Serializer'
import { NetworkType, P2PPairingRequest, PostMessagePairingRequest } from '../..'
import { generateGUID } from '../../utils/generate-uuid'
import { Logger } from '../../utils/Logger'
import { isAndroid, isIOS } from '../../utils/platform'
import { getQrData } from '../../utils/qr'
import { getTzip10Link } from '../../utils/get-tzip10-link'
import { windowRef } from '../../MockWindow'
import { closeAlerts } from './Alert'
import {
  Pairing,
  PairingAlertInfo,
  PairingAlertList,
  PairingAlertWallet,
  WalletType
} from './Pairing'
import { createSanitizedElement, createUnsafeElementFromString } from '../../utils/html-elements'

const logger = new Logger('Alert')

const serializer = new Serializer()

export const preparePairingAlert = async (
  id: string,
  shadowRoot: ShadowRoot,
  pairingPayload: {
    p2pSyncCode: () => Promise<P2PPairingRequest>
    postmessageSyncCode: () => Promise<PostMessagePairingRequest>
    preferredNetwork: NetworkType
  }
): Promise<void> => {
  const getInfo = async (): Promise<PairingAlertInfo> => {
    return Pairing.getPairingInfo(
      pairingPayload,
      async (_walletType, _wallet, keepOpen) => {
        if (keepOpen) {
          return
        }
        await closeAlerts()
      },
      async () => {
        switchPlatform()
      }
    )
  }

  const info = await getInfo()

  const container = shadowRoot.getElementById(`pairing-container`)
  if (!container) {
    throw new Error('container not found')
  }

  const buttonListWrapper = document.createElement('span')
  container.appendChild(buttonListWrapper)

  info.buttons.forEach(async (button) => {
    const randomId = await generateGUID()

    const titleEl = createSanitizedElement('div', ['beacon-list__title'], [], button.title)
    const buttonEl = createSanitizedElement(
      'button',
      ['beacon-modal__button connect__btn'],
      [],
      button.text
    )

    const linkEl = document.createElement('a')
    linkEl.id = `button_${randomId}`

    linkEl.appendChild(titleEl)
    linkEl.appendChild(buttonEl)

    buttonListWrapper.appendChild(linkEl)

    const shadowButtonEl = shadowRoot.getElementById(linkEl.id)

    if (shadowButtonEl) {
      shadowButtonEl.addEventListener('click', async () => {
        button.clickHandler()
      })
    }
  })

  const showWallet = (listEl: HTMLElement, type: WalletType, wallet: PairingAlertWallet) => {
    const altTag = `Open in ${wallet.name}`
    const walletKey = wallet.key

    const logoEl = wallet.logo
      ? createSanitizedElement(
          'div',
          [],
          [],
          [createSanitizedElement('img', ['beacon-selection__img'], [['src', wallet.logo]], '')]
        )
      : createUnsafeElementFromString(
          '<svg class="beacon-selection__img" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="wallet" class="svg-inline--fa fa-wallet fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve"><path d="M376.2,181H152.9c-5.2,0-9.4-4.2-9.4-9.4s4.2-9.4,9.4-9.4h225c5.2,0,9.4-4.2,9.4-9.4c0-15.5-12.6-28.1-28.1-28.1H143.5c-20.7,0-37.5,16.8-37.5,37.5v187.5c0,20.7,16.8,37.5,37.5,37.5h232.7c16.4,0,29.8-12.6,29.8-28.1v-150C406,193.6,392.7,181,376.2,181z M349.8,302.9c-10.4,0-18.8-8.4-18.8-18.8s8.4-18.8,18.8-18.8s18.8,8.4,18.8,18.8S360.1,302.9,349.8,302.9z"/></svg>'
        )

    const nameEl = createSanitizedElement(
      'div',
      ['beacon-selection__name'],
      [],
      [
        createSanitizedElement('span', [], [], wallet.name),
        wallet.enabled ? undefined : createSanitizedElement('p', [], [], 'Not installed')
      ]
    )

    const linkEl = createSanitizedElement(
      'a',
      ['beacon-selection__list', wallet.enabled ? '' : ' disabled'],
      [
        ['tabindex', '0'],
        ['id', `wallet_${walletKey}`],
        ['alt', altTag],
        ['target', '_blank']
      ],
      [nameEl, logoEl]
    )

    const el = document.createElement('span')
    el.appendChild(linkEl)

    listEl.appendChild(el)

    const walletEl = shadowRoot.getElementById(`wallet_${walletKey}`)

    const completeHandler = async (event?: KeyboardEvent) => {
      if (event && event.key !== 'Enter') {
        return
      }

      wallet.clickHandler()
      const modalEl: HTMLElement | null = shadowRoot.getElementById('beacon-modal__content')
      if (modalEl && type !== WalletType.EXTENSION && type !== WalletType.IOS) {
        modalEl.innerHTML = ''
        modalEl.appendChild(
          createSanitizedElement('p', ['beacon-alert__title'], [], 'Establishing Connection..')
        )
        modalEl.appendChild(
          createSanitizedElement('div', ['progress-line'], [['id', 'beacon-toast-loader']], '')
        )
        modalEl.appendChild(
          createSanitizedElement(
            'div',
            ['beacon--selected__container'],
            [],
            [
              ...(wallet.logo
                ? [
                    createSanitizedElement(
                      'img',
                      ['beacon-selection__img'],
                      [['src', wallet.logo]],
                      ''
                    ),
                    createSanitizedElement('img', ['beacon--selection__name__lg'], [], wallet.name)
                  ]
                : [undefined])
            ]
          )
        )
      }
    }

    if (walletEl) {
      walletEl.addEventListener('click', () => completeHandler())
      walletEl.addEventListener('keydown', completeHandler)
    }
  }

  const listContainer = document.createElement('span')
  container.appendChild(listContainer)
  const showWalletLists = (walletLists: PairingAlertList[]): void => {
    listContainer.innerHTML = ''
    walletLists.forEach((list) => {
      const listWrapperEl = document.createElement('div')
      listWrapperEl.classList.add('beacon-list__wrapper')

      listContainer.appendChild(listWrapperEl)

      const listTitleEl = document.createElement('div')
      listTitleEl.classList.add('beacon-list__title')
      listTitleEl.innerHTML = list.title
      listWrapperEl.appendChild(listTitleEl)

      const listEl = document.createElement('span')
      listWrapperEl.appendChild(listEl)

      list.wallets.forEach(async (wallet) => {
        showWallet(listEl, list.type, wallet)
      })
    })
  }

  showWalletLists(info.walletLists)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messageFn = async (event: any): Promise<void> => {
    if (event.data === 'extensionsUpdated') {
      const newInfo = await getInfo()
      showWalletLists(newInfo.walletLists)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let closeFn: (event: any) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  closeFn = (event: any): void => {
    if (event.data === `closeAlert-${id}`) {
      windowRef.removeEventListener('message', messageFn)
      windowRef.removeEventListener('message', closeFn)
    }
  }

  windowRef.addEventListener('message', messageFn)
  windowRef.addEventListener('message', closeFn)

  const qr: HTMLElement | null = shadowRoot.getElementById(`beacon--qr__container`)
  const copyButton: HTMLElement | null = shadowRoot.getElementById(`beacon--qr__copy`)
  const titleEl: HTMLElement | null = shadowRoot.getElementById(`beacon-title`)

  const platform = isAndroid(window) ? 'android' : isIOS(window) ? 'ios' : 'desktop'

  const mainText: HTMLElement | null = shadowRoot.getElementById(`beacon-main-text`)
  const walletList: HTMLElement | null = shadowRoot.getElementById(`pairing-container`)

  const switchButton: HTMLElement | null = shadowRoot.getElementById(`beacon--switch__container`)

  // if (mainText && walletList && switchButton && copyButton && qr && titleEl) {
  const clipboardFn = async () => {
    const code = pairingPayload
      ? await serializer.serialize(await pairingPayload.p2pSyncCode())
      : ''
    navigator.clipboard.writeText(code).then(
      () => {
        if (copyButton) {
          copyButton.innerText = 'Copied'
        }
        logger.log('Copying to clipboard was successful!')
      },
      (err) => {
        logger.error('Could not copy text to clipboard: ', err)
      }
    )
  }

  let qrShown = false

  const showPlatform = async (type: 'ios' | 'android' | 'desktop' | 'none'): Promise<void> => {
    const platformSwitch: HTMLElement | null = shadowRoot.getElementById(`beacon-switch`)
    if (platformSwitch) {
      platformSwitch.innerHTML =
        type === 'none' ? 'Pair wallet on same device' : 'Pair wallet on another device'
    }

    if (mainText && walletList && switchButton && copyButton && qr && titleEl) {
      mainText.style.display = 'none'
      titleEl.style.textAlign = 'center'
      walletList.style.display = 'none'
      switchButton.style.display = 'initial'

      switch (type) {
        case 'ios':
          walletList.style.display = 'initial'
          break
        case 'android':
          walletList.style.display = 'initial'
          break
        case 'desktop':
          walletList.style.display = 'initial'
          titleEl.style.textAlign = 'left'
          mainText.style.display = 'none'
          switchButton.style.display = 'initial'
          break
        default:
          if (!qrShown) {
            const code = await serializer.serialize(await pairingPayload.p2pSyncCode())
            const uri = getTzip10Link('tezos://', code)
            const qrSVG = getQrData(uri, 'svg')
            const qrString = qrSVG.replace('<svg', `<svg class="beacon-alert__image"`)
            qr.insertAdjacentHTML('afterbegin', qrString)
            if (copyButton) {
              copyButton.addEventListener('click', clipboardFn)
            }
            if (qr) {
              qr.addEventListener('click', clipboardFn)
            }
            qrShown = true
          }

          // QR code
          mainText.style.display = 'initial'
      }
    }
  }

  let showQr = false

  const switchPlatform = (): void => {
    showPlatform(showQr ? 'none' : platform)
    showQr = !showQr
  }

  switchPlatform()

  {
    const platformSwitch: HTMLElement | null = shadowRoot.getElementById(`beacon-switch`)
    if (platformSwitch) {
      platformSwitch.addEventListener('click', switchPlatform)
    }
  }
}
