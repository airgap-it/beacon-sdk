import { Component, For, createEffect, createSignal } from 'solid-js'
import { CloseIcon } from '../icons'
import Loader from '../loader'
import { isMobileOS } from '../../utils/platform'

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

  const offset = { x: isMobileOS(window) ? 12 : window.innerWidth - 460, y: 12 }
  const [divPosition, setDivPosition] = createSignal(offset)
  const [isDragging, setIsDragging] = createSignal(false)

  const onMouseDownHandler = (event: MouseEvent) => {
    event.preventDefault() // prevents inner text highlighting
    const target = event.target as HTMLElement

    if (target.className !== 'toast-header' && target.parentElement?.className !== 'toast-header') {
      return
    }

    const boundinRect = target.getBoundingClientRect()
    offset.x = event.clientX - boundinRect.x
    offset.y = event.clientY - boundinRect.y
    setIsDragging(true)
  }

  const onMouseMoveHandler = (event: MouseEvent) => {
    if (isDragging() && event.buttons === 1) {
      const newX = Math.min(Math.max(event.clientX - offset.x, 0), window.innerWidth - 460)
      const newY = Math.min(Math.max(event.clientY - offset.y, 0), window.innerHeight - 12)

      setDivPosition({
        x: newX,
        y: newY
      })
    }
  }

  const onMouseUpHandler = () => {
    setIsDragging(false)
  }

  const onClickHandler = () => {
    setIsDragging(false)
  }

  // when the mouse is out of the div boundaries but it is still pressed, keep moving the toast
  createEffect(() => {
    if (isDragging()) {
      window.addEventListener('mousemove', onMouseMoveHandler)
      window.addEventListener('mouseup', onMouseUpHandler)
    } else {
      window.removeEventListener('mousemove', onMouseMoveHandler)
      window.removeEventListener('mouseup', onMouseUpHandler)
    }
  })

  if (isRequestSentToast) {
    setShowMoreInfo(false)
    setTimeout(() => {
      setShowMoreInfo(true)
    }, 3000)
  }

  return (
    <div
      style={{ left: `${divPosition().x}px`, top: `${divPosition().y}px` }}
      class={props.open ? 'toast-wrapper-show' : 'toast-wrapper-hide'}
      onMouseDown={onMouseDownHandler}
      onClick={onClickHandler}
      onDblClick={onClickHandler}
    >
      <div class="toast-header">
        <Loader />
        {hasWalletObject && props.walletInfo && <>{parseWallet(props.label, props.walletInfo)}</>}
        {!hasWalletObject && <p class="toast-label">props.label</p>}
        {!isMobileOS(window) && props.openWalletAction && (
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
