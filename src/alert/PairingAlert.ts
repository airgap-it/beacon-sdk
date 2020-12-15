import { NetworkType } from '..'
import { generateGUID } from '../utils/generate-uuid'
import { isAndroid, isIOS } from '../utils/platform'
import { closeAlerts } from './Alert'
import { Pairing } from './Pairing'

export const preparePairingAlert = async (pairingPayload: {
  p2pSyncCode: string
  postmessageSyncCode: string
  preferredNetwork: NetworkType
}): Promise<void> => {
  const info = await Pairing.getPairingInfo(pairingPayload, async () => {
    await closeAlerts()
  })

  const container = document.getElementById(`pairing-container`)
  if (!container) {
    throw new Error('container not found')
  }

  const buttonListWrapper = document.createElement('span')
  container.appendChild(buttonListWrapper)

  info.buttons.forEach(async (button) => {
    const randomId = await generateGUID()

    const x = `
    <div class="beacon-list__title">${button.title}</div>
		<button class="beacon-modal__button connect__btn">${button.text}</button>
		 `

    const el = document.createElement('a')
    el.id = `button_${randomId}`
    el.innerHTML = x

    buttonListWrapper.appendChild(el)

    const buttonEl = document.getElementById(el.id)

    if (buttonEl) {
      buttonEl.addEventListener('click', async () => {
        button.clickHandler()
      })
    }
  })

  info.walletLists.forEach((list) => {
    const listWrapperEl = document.createElement('div')
    container.appendChild(listWrapperEl)

    const listTitleEl = document.createElement('div')
    listTitleEl.classList.add('beacon-list__title')
    listTitleEl.innerHTML = list.title
    listWrapperEl.appendChild(listTitleEl)

    const listEl = document.createElement('span')
    listWrapperEl.appendChild(listEl)

    list.wallets.forEach(async (wallet) => {
      const altTag = `Open in ${wallet.name}`
      const randomId = await generateGUID()
      const x = `
			<a tabindex="0" alt="${altTag}" id="wallet_${randomId}"
			 target="_blank" class="beacon-selection__list${wallet.enabled ? '' : ' disabled'}">
			 <div class="beacon-selection__name">${wallet.name}
			 ${wallet.enabled ? '' : '<p>Not installed</p>'}
			 </div>
			 ${
         wallet.logo
           ? `<div>
			 <img class="beacon-selection__img" src="${wallet.logo}"/>
			 </div>`
           : '<svg class="beacon-selection__img" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="wallet" class="svg-inline--fa fa-wallet fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve"><path d="M376.2,181H152.9c-5.2,0-9.4-4.2-9.4-9.4s4.2-9.4,9.4-9.4h225c5.2,0,9.4-4.2,9.4-9.4c0-15.5-12.6-28.1-28.1-28.1H143.5c-20.7,0-37.5,16.8-37.5,37.5v187.5c0,20.7,16.8,37.5,37.5,37.5h232.7c16.4,0,29.8-12.6,29.8-28.1v-150C406,193.6,392.7,181,376.2,181z M349.8,302.9c-10.4,0-18.8-8.4-18.8-18.8s8.4-18.8,18.8-18.8s18.8,8.4,18.8,18.8S360.1,302.9,349.8,302.9z"/></svg>'
       }
			</a>
			 `

      const el = document.createElement('span')
      el.innerHTML = x

      listEl.appendChild(el)

      const walletEl = document.getElementById(`wallet_${randomId}`)

      if (walletEl) {
        walletEl.addEventListener('click', async () => {
          wallet.clickHandler()
        })
        walletEl.addEventListener('keydown', async (event) => {
          if (event.key === 'Enter') {
            wallet.clickHandler()
          }
        })
      }
    })
  })

  const qr: HTMLElement | null = document.getElementById(`beacon--qr__container`)
  const copyButton: HTMLElement | null = document.getElementById(`beacon--qr__copy`)
  const titleEl: HTMLElement | null = document.getElementById(`beacon-title`)

  const platform = isAndroid(window) ? 'android' : isIOS(window) ? 'ios' : 'desktop'

  const mainText: HTMLElement | null = document.getElementById(`beacon-main-text`)
  const walletList: HTMLElement | null = document.getElementById(`pairing-container`)

  const switchButton: HTMLElement | null = document.getElementById(`beacon--switch__container`)

  if (mainText && walletList && switchButton && copyButton && qr && titleEl) {
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
}
