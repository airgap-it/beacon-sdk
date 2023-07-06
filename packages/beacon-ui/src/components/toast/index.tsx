import { Component, For, createSignal } from 'solid-js'
import { CloseIcon } from '../icons'
import Loader from '../loader'

function parseWallet(
  inputString: string,
  walletInfo: {
    deeplink?: string
    icon?: string
    name: string
    type?: string
  }
) {
  const regex = /({{\s*wallet\s*}})/g
  const parts = inputString.split(regex)

  return parts.map((part) => {
    if (part.match(regex)) {
      return (
        <>
          <img src={walletInfo.icon}></img>
          <h3>{walletInfo.name}</h3>
        </>
      )
    } else {
      return <p class="toast-label">{part}</p>
    }
  })
}

export interface ToastProps {
  label: string
  open: boolean
  onClickClose: () => void
  actions?: { text: string; isBold?: boolean; actionText?: string; actionCallback?: () => void }[]
  walletInfo?: {
    deeplink?: string
    icon?: string
    name: string
    type?: string
  }
  openWalletAction?: () => void
}

const [showMoreInfo, setShowMoreInfo] = createSignal<boolean>(true)

const Toast: Component<ToastProps> = (props: ToastProps) => {
  const hasWalletObject = props.label.includes('{{wallet}}') && props.walletInfo
  const isRequestSentToast = props.label.includes('Request sent to')

  if (isRequestSentToast) {
    setShowMoreInfo(false)
    setTimeout(() => {
      setShowMoreInfo(true)
    }, 3000)
  }

  return (
    <div class={props.open ? 'toast-wrapper-show' : 'toast-wrapper-hide'}>
      <div class="toast-header">
        <Loader />
        {hasWalletObject && props.walletInfo && <>{parseWallet(props.label, props.walletInfo)}</>}
        {!hasWalletObject && <p class="toast-label">props.label</p>}
        {props.openWalletAction && (
          <div
            class="toast-action-button"
            onClick={() => {
              if (props && props.openWalletAction) {
                props?.openWalletAction()
              }
            }}
          >
            Open Wallet
          </div>
        )}
        <div class="toast-button-icon" onClick={props.onClickClose}>
          <CloseIcon />
        </div>
      </div>
      {props.actions && showMoreInfo() && (
        <div class="toast-body">
          <For each={props.actions}>
            {(action) => (
              <div class="toast-action-wrapper">
                <p class={`toast-action-label ${action.isBold ? 'toast-action-bold' : ''}`}>
                  {action.text}
                </p>
                {action.actionText && (
                  <div
                    class="toast-action-button"
                    onClick={() => {
                      if (action.actionCallback) action.actionCallback()
                    }}
                  >
                    {action.actionText}
                  </div>
                )}
              </div>
            )}
          </For>
        </div>
      )}
    </div>
  )
}

export default Toast
