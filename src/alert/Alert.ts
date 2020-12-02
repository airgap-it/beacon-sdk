// Taken from https://github.com/WalletConnect/walletconnect-monorepo/blob/master/packages/qrcode-modal/src/browser.ts

import { generateGUID } from '../utils/generate-uuid'
import { getTzip10Link } from '../utils/get-tzip10-link'
import { isAndroid, isIOS } from '../utils/platform'
import { getQrData } from '../utils/qr'
import { replaceInTemplate } from '../utils/replace-in-template'
import { Pairing } from './Pairing'

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

  let allStyles = `:root {
		--animation-duration: 300ms;
	}
	
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	
	@keyframes fadeOut {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}
	
	.animated {
		animation-duration: var(--animation-duration);
		animation-fill-mode: both;
	}
	
	.fadeIn {
		animation-name: fadeIn;
	}
	
	.fadeOut {
		animation-name: fadeOut;
	}
	
	.beacon-modal__wrapper {
		position: relative;
		transform: translateY(-50%);
		top: 50%;
		display: inline-block;
		z-index: 2147483000;
		max-width: 500px;
		width: 100%;
		padding: 24px;
	}
	
	.beacon-modal__base,
	.beacon-modal__close__wrapper {
		background: #fff;
		box-shadow: 0 12px 24px 0 rgba(0, 0, 0, 0.1);
	}
	
	.beacon-modal__base {
		margin: 0 auto;
		border-radius: 32px;
		overflow: hidden;
	}
	
	.beacon-modal__header {
		padding: 16px 0;
		width: 100%;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}
	
	.beacon-modal__headerLogo {
		width: 100%;
		max-width: 320px;
		margin: 20px auto;
		height: 100%;
	}
	
	.beacon-alert__text,
	.beacon-alert__title,
	.beacon-selection__name,
	p,
	button {
		font-family: Roboto, Helvetica, sans-serif;
	}
	
	a,
	button {
		cursor: pointer;
	}
	
	.beacon-modal__close__wrapper {
		position: absolute;
		top: 44px;
		right: 24px;
		z-index: 10000;
		cursor: pointer;
		border-radius: 100%;
	}
	
	.beacon-modal__close__icon {
		width: 16px;
		height: 16px;
		position: relative;
		top: 0;
		right: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		transform: rotate(45deg);
		margin: 8px;
	}
	
	.beacon-modal__close__line1 {
		position: absolute;
		width: 90%;
		border: 1px solid #000;
	}
	
	.beacon-modal__close__line2 {
		position: absolute;
		width: 90%;
		border: 1px solid #000;
		transform: rotate(90deg);
	}
	
	.beacon-alert__base {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 2147482999;
		background-color: rgb(17 17 17 / 0.84);
		text-align: center;
	}
	
	.beacon-alert__title {
		text-align: center;
	}
	
	.beacon-alert__text,
	.beacon-alert__title {
		margin: 0 auto;
		padding: 0 0 16px;
	}
	
	.margin__bottom {
		margin-bottom: 16px;
	}
	
	.beacon-alert__title {
		color: #7c828b;
		font-size: 18px;
	}
	
	.beacon-alert__text {
		color: #000;
		font-size: 14px;
	}
	
	.beacon-modal__button,
	.beacon-modal__button--outline {
		height: 36px;
		font-size: 14px;
		letter-spacing: 0.84px;
		margin-bottom: 4px;
		margin-inline-end: 2px;
		margin-inline-start: 2px;
		margin-left: 2px;
		margin-right: 2px;
		margin-top: 4px;
		padding-inline-end: 15.4px;
		padding-inline-start: 15.4px;
		padding-left: 15.4px;
		padding-right: 15.4px;
		overflow-wrap: break-word;
		pointer-events: auto;
		text-align: center;
		border: 2px solid #3880ff;
		border-radius: 4px;
	}
	
	.beacon-modal__button {
		background: #3880ff;
		color: #fff;
	}
	
	.beacon-modal__button--outline {
		background: #fff;
		color: #3880ff;
	}
	
	.beacon-alert__image {
		width: 200px;
		height: 200px;
		box-sizing: border-box;
		box-shadow: 0 10px 20px 0 rgba(17, 17, 17, 0.12);
		border: 1px solid rgba(17, 17, 17, 0.04);
		border-radius: 16px;
	}
	
	.beacon-modal__content {
		padding: 24px;
	}
	
	#beacon-switch {
		margin-top: 24px;
	}
	
	#beacon-title {
		margin-bottom: 24px;
	}
	
	a {
		text-decoration: none;
	}
	`

  if (pairingPayload) {
    allStyles += `#beacon-main-text {
			display: initial;
		}
		.beacon-selection__container {
			padding: 16px 16px 0;
		}
		.beacon-selection__list {
			display: flex;
			flex-direction: row;
			justify-content: space-between;
			text-decoration: none;
			padding-bottom: 12px;
			align-items: center;
		}
		
		.beacon-list__title {
			text-align: left;
			color: #7c828b;
			font-size: 12px;
		}
		.beacon-selection__name {
			font-size: 1rem;
			font-weight: 600;
			color: #3b3d40;
		}
		.beacon-selection__img {
			width: 48px;
			height: 48px;
			box-shadow: 0 4px 12px 0 rgba(17, 17, 17, 0.24);
			border-radius: 16px;
		}
		#beacon--qr__copy__container {
			height: 0;
		}
		#beacon--qr__copy {
			display: none;
			position: relative;
			top: -190px;
			left: 138px;
			margin: 0;
		}
		#beacon--qr__container:hover #beacon--qr__copy {
			display: block;
		}
		.disabled {
			cursor: initial;
		}
		.disabled span,
		.disabled img {
			opacity: 0.48;
		}
		.disabled p {
			text-align: left;
			margin: 0;
			font-size: 10px;
			font-weight: 300;
		}
		.disabled img {
			-webkit-filter: grayscale(100%);
			-moz-filter: grayscale(100%);
			-ms-filter: grayscale(100%);
			-o-filter: grayscale(100%);
			filter: grayscale(100%);
			filter: gray;
		}
		`
  }

  let alertContainer = `<style>${allStyles}</style><div id="beacon-alert-modal-{{id}}" class="beacon-alert__base animated fadeIn">
  <div class="beacon-modal__wrapper">
    <div class="beacon-modal__header">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        id="Guides"
        x="0"
        y="0"
        version="1.1"
        viewBox="0 0 179.2 43"
        xml:space="preserve"
        width="140"
        height="40"
      >
        <style>
          .st0 {
            fill: #3880ff;
          }
          .st1 {
            fill: #fff;
          }
        </style>
        <path
          d="M45 19v.9c0 .3-.2 7.5-3.4 13.2-3.3 5.6-9.4 9.3-9.7 9.5l-.8.4-1.3-.8-7.6-4.4c-.5-.3-.9-.6-1.4-.9-.4-.3-.7-.5-1.1-.8-.8-.7-1.5-1.4-2.1-2.2-.9-1.1-1.6-2.4-2.1-3.7-.9-2.3-1.3-4.8-1.2-7.5.8-.4 1.6-.6 2.4-.6h.6c-.2 2.4.1 4.6.8 6.6 1 2.8 2.9 5.1 5.5 6.6l7.4 4.3c.2-.1.4-.2.6-.4 1.9-1.3 5.3-4.1 7.3-7.6 2.2-3.9 2.8-8.9 3-10.8L38.8 19c.3-1 .4-2.1.5-3.2L45 19z"
          class="st0"
        />
        <path
          d="M36.3 4.1v10.3c0 .5 0 1.1-.1 1.6s-.1.9-.2 1.3c-.2 1-.5 2-.9 3-.5 1.3-1.3 2.6-2.2 3.7-1.5 1.9-3.5 3.6-5.9 4.8-.9-.6-1.6-1.3-2-2.4 2.1-1 3.9-2.3 5.2-4 1.9-2.3 3-5.1 3-8.1V5.9l-.6-.3c-2-1-6.1-2.6-10.1-2.6-4.5 0-9.1 2-10.9 2.9v3.6c-1 .3-2 .7-3 1.1V4.1l.8-.4C9.7 3.5 16 0 22.5 0s12.8 3.5 13.1 3.6l.7.5z"
          class="st0"
        />
        <path
          d="M10.5 16.5l-7.4 4.3v.7c.2 2.1.9 6.5 2.9 10 2.2 3.9 6.2 6.9 7.9 8l3.1-1.8c.8.7 1.6 1.4 2.5 2L13.8 43l-.8-.5c-.3-.2-6.4-3.9-9.7-9.5C.1 27.4 0 20.2 0 19.9V19l1.3-.8L9 13.9c.5-.3.9-.5 1.4-.7.4-.2.8-.4 1.3-.5 1-.4 2-.6 3-.7 1.4-.2 2.9-.2 4.3 0 2.4.3 4.8 1.2 7.1 2.7 0 1-.4 2-1 2.9-1.9-1.3-4-2.2-6-2.5-3.1-.6-6-.1-8.6 1.4z"
          class="st0"
        />
        <g>
          <path
            d="M73.9 23c.9 1 1.3 2.3 1.3 3.7 0 1.9-.6 3.4-1.9 4.5-1.3 1.1-3.1 1.7-5.5 1.7h-8.6v-23h8.4c2.3 0 4.1.5 5.3 1.5 1.2 1 1.8 2.4 1.8 4.2 0 1.5-.4 2.7-1.2 3.6-.8.9-1.8 1.5-3.1 1.8 1.5.3 2.6 1 3.5 2zm-11.7-3h5c1.5 0 2.6-.3 3.4-1 .8-.7 1.2-1.6 1.2-2.8 0-1.2-.4-2.1-1.1-2.8-.8-.7-1.9-1-3.5-1h-4.8V20zm8.7 9.4c.9-.7 1.3-1.7 1.3-3s-.4-2.3-1.3-3c-.9-.7-2.1-1.1-3.7-1.1h-5v8.2h5c1.6-.1 2.8-.4 3.7-1.1zM95.3 24.6H81c.1 2.1.6 3.6 1.7 4.6s2.4 1.5 4 1.5c1.4 0 2.6-.4 3.6-1.1 1-.7 1.6-1.7 1.8-2.9h3.2c-.2 1.2-.7 2.4-1.5 3.3-.8 1-1.7 1.7-2.9 2.3-1.2.5-2.6.8-4.1.8-1.7 0-3.2-.4-4.6-1.1-1.3-.7-2.4-1.8-3.1-3.2-.8-1.4-1.1-3-1.1-4.9 0-1.9.4-3.5 1.1-4.9.8-1.4 1.8-2.5 3.1-3.2 1.3-.7 2.9-1.1 4.6-1.1 1.7 0 3.3.4 4.6 1.1 1.3.7 2.3 1.7 3 3 .7 1.2 1 2.6 1 4.1.1.7 0 1.2-.1 1.7zm-3.5-4.8c-.5-.9-1.2-1.6-2.1-2-.9-.4-1.8-.7-2.8-.7-1.6 0-3 .5-4.1 1.5-1.1 1-1.7 2.5-1.8 4.5h11.5c0-1.3-.2-2.4-.7-3.3zM111.2 16c1.2.9 2.1 2 2.5 3.5V15h3v18h-3v-4.6c-.5 1.5-1.3 2.6-2.5 3.5-1.2.9-2.7 1.3-4.4 1.3-1.6 0-3-.4-4.3-1.1-1.2-.7-2.2-1.8-2.9-3.2-.7-1.4-1.1-3-1.1-4.9 0-1.9.4-3.5 1.1-4.9.7-1.4 1.7-2.5 2.9-3.2 1.2-.7 2.7-1.1 4.3-1.1 1.7-.1 3.1.4 4.4 1.2zm-8 3.1c-1.1 1.2-1.7 2.8-1.7 4.8 0 2.1.5 3.7 1.7 4.8 1.1 1.2 2.6 1.8 4.4 1.8 1.2 0 2.2-.3 3.2-.8.9-.5 1.7-1.3 2.2-2.3.5-1 .8-2.1.8-3.5 0-1.3-.3-2.5-.8-3.5s-1.2-1.8-2.2-2.3c-.9-.5-2-.8-3.2-.8-1.9.1-3.3.7-4.4 1.8zM135 16.6c1.5 1.2 2.4 2.9 2.8 4.9h-3.1c-.2-1.3-.8-2.3-1.8-3-1-.7-2.2-1.1-3.6-1.1-1 0-2 .2-2.9.7-.9.5-1.6 1.2-2.1 2.2-.5 1-.8 2.2-.8 3.7s.3 2.7.8 3.7 1.2 1.7 2.1 2.2c.9.5 1.8.7 2.9.7 1.4 0 2.6-.4 3.6-1.1 1-.7 1.6-1.8 1.8-3h3.1c-.3 2.1-1.3 3.7-2.8 4.9-1.5 1.2-3.4 1.8-5.7 1.8-1.7 0-3.2-.4-4.6-1.1-1.3-.7-2.4-1.8-3.1-3.2-.8-1.4-1.1-3-1.1-4.9 0-1.9.4-3.5 1.1-4.9.8-1.4 1.8-2.5 3.1-3.2 1.3-.7 2.9-1.1 4.6-1.1 2.3-.1 4.2.6 5.7 1.8zM154.5 15.9c1.4.7 2.4 1.8 3.2 3.2.8 1.4 1.2 3 1.2 4.9 0 1.9-.4 3.5-1.2 4.9-.8 1.4-1.8 2.4-3.2 3.2-1.4.7-2.9 1.1-4.6 1.1-1.7 0-3.3-.4-4.6-1.1-1.4-.7-2.4-1.8-3.2-3.2-.8-1.4-1.2-3-1.2-4.9 0-1.9.4-3.5 1.2-4.9.8-1.4 1.9-2.5 3.2-3.2 1.4-.7 2.9-1.1 4.6-1.1 1.7-.1 3.2.3 4.6 1.1zm-7.6 2.2c-.9.5-1.6 1.2-2.2 2.2-.6 1-.8 2.2-.8 3.7 0 1.4.3 2.7.8 3.6.6 1 1.3 1.7 2.2 2.2.9.5 1.9.7 3 .7s2.1-.2 3-.7c.9-.5 1.6-1.2 2.2-2.2.6-1 .8-2.2.8-3.6 0-1.5-.3-2.7-.8-3.7-.6-1-1.3-1.7-2.2-2.2-.9-.5-1.9-.7-3-.7s-2.1.2-3 .7zM177.3 16.7c1.3 1.3 1.9 3.3 1.9 5.8v10.4h-3V22.8c0-1.8-.5-3.2-1.4-4.1-.9-1-2.2-1.4-3.7-1.4-1.6 0-2.9.5-3.9 1.6s-1.5 2.6-1.5 4.6V33h-3V15h3v4.3c.5-1.5 1.3-2.6 2.4-3.4 1.2-.8 2.5-1.2 4-1.2 2.2 0 3.9.6 5.2 2z"
            class="st1"
          />
        </g>
      </svg>
      <div class="beacon-modal__close__wrapper">
        <div id="beacon-alert-{{id}}-close" class="beacon-modal__close__icon">
          <div class="beacon-modal__close__line1"></div>
          <div class="beacon-modal__close__line2"></div>
        </div>
      </div>
    </div>
    <div class="beacon-modal__base">
      <div class="beacon-modal__content">
        <div>
          <p class="beacon-alert__title">
            {{callToAction}}
          </p>

          {{main}}

          <div class="beacon-action__container">
            {{buttons}}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
`

  alertContainer = replaceInTemplate(
    alertContainer,
    'main',
    pairingPayload
      ? `
			<span id="pairing-container"></span>
	
	<div id="beacon-main-text" class="beacon-alert__text">
		<p id="beacon-title" class="beacon-list__title">
			Scan QR code with Beacon-compatible wallet.
			<a href="https://docs.walletbeacon.io/supported-wallets.html" target="_blank">Learn more</a>
		</p>
		{{body}}
	</div>
	
	<div id="beacon--switch__container">
		<button id="beacon-switch" class="beacon-modal__button--outline"></button>
	</div>
	`
      : `<div id="beacon-main-text" class="beacon-alert__text">
  {{body}}
</div>
`
  )

  alertContainer = replaceInTemplate(alertContainer, 'callToAction', callToAction)
  alertContainer = replaceInTemplate(alertContainer, 'buttons', buttonsHtml.join(' '))

  alertContainer = replaceInTemplate(alertContainer, 'body', body)
  alertContainer = replaceInTemplate(alertContainer, 'id', id)

  alertContainer = replaceInTemplate(alertContainer, 'payload', pairingPayload ?? '')

  // if (alertContainer.indexOf('{{') >= 0) {
  //   const start = alertContainer.indexOf('{{')
  //   const end = alertContainer.indexOf('}}')
  //   console.error('Not all placeholders replaced!', alertContainer.substr(start, end - start))
  //   throw new Error('Not all placeholders replaced!')
  // }

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

  if (pairingPayload) {
    const info = await Pairing.getPairingInfo(pairingPayload)

    const container = document.getElementById(`pairing-container`)
    if (!container) {
      throw new Error('container not found')
    }

    const buttonListWrapper = document.createElement('span')
    container.appendChild(buttonListWrapper)

    info.buttons.forEach(async (button) => {
      const randomId = await generateGUID()

      const x = `
			<button class="beacon-modal__button">${button.text}</button>
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
      } else {
        console.log('NO BUTTON')
      }
    })

    info.walletLists.map((list) => {
      const listWrapperEl = document.createElement('div')
      container.appendChild(listWrapperEl)

      const listTitleEl = document.createElement('div')
      listTitleEl.classList.add('beacon-list__title')
      listTitleEl.innerHTML = list.title
      listWrapperEl.appendChild(listTitleEl)

      const listEl = document.createElement('span')
      listWrapperEl.appendChild(listEl)

      console.log(`constructing ${list.type}, ${list.wallets.length} wallets`)

      list.wallets.forEach(async (wallet) => {
        const altTag = `Open in ${wallet.name}`
        const randomId = await generateGUID()
        const x = `
				<a alt="${altTag}" id="wallet_${randomId}"
				 target="_blank" class="beacon-selection__list${wallet.enabled ? '' : ' disabled'}">
				 <div class="beacon-selection__name">${wallet.name}</div>
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
        }
      })
    })
  }

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
  const walletList: HTMLElement | null = document.getElementById(`pairing-container`)

  const switchButton: HTMLElement | null = document.getElementById(`beacon--switch__container`)

  console.log('mainText', mainText)
  console.log('walletList', walletList)
  console.log('qr', qr)
  console.log('copyButton', copyButton)
  console.log('titleEl', titleEl)
  console.log('switchButton', switchButton)

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

  return id
}

export { closeAlert, closeAlerts, openAlert }
