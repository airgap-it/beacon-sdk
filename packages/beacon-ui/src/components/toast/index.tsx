import { Component, For } from 'solid-js'
import { CloseIcon } from '../icons'
import Loader from '../loader'

export interface ToastProps {
  label: string
  open: boolean
  onClickClose: () => void
  actions?: { text: string; isBold?: boolean; actionText?: string; actionCallback?: () => void }[]
}

const Toast: Component<ToastProps> = (props: ToastProps) => {
  return (
    <div class={props.open ? 'toast-wrapper-show' : 'toast-wrapper-hide'}>
      <div class="toast-header">
        <Loader />
        <p class="toast-label">{props.label}</p>
        <div class="toast-button-icon" onClick={props.onClickClose}>
          <CloseIcon />
        </div>
      </div>
      {props.actions && (
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
