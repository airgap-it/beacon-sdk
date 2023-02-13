import { Component, createSignal } from 'solid-js'
import { CloseIcon, LeftIcon, LogoIcon } from '../icons'

export interface AlertProps {
  content: any
  open: boolean
  extraContent?: any
  onCloseClick: () => void
  onBackClick?: () => void
}

const Alert: Component<AlertProps> = (props: AlertProps) => {
  const [showMore, setShowMore] = createSignal<boolean>(false)
  return (
    <div class={props.open ? 'alert-wrapper-show' : 'alert-wrapper-hide'}>
      <div class={props.open ? 'alert-modal-show' : 'alert-modal-hide'}>
        <div class="alert-header">
          {props.onBackClick && (
            <div class="alert-button-icon" onClick={props.onBackClick}>
              <LeftIcon />
            </div>
          )}
          <div class="alert-logo">
            <LogoIcon />
          </div>
          <div class="alert-button-icon" onClick={props.onCloseClick}>
            <CloseIcon />
          </div>
        </div>
        <div class="alert-body" style={{ 'margin-bottom': props.extraContent ? '' : '1.8em' }}>
          {props.content}
          <div class={showMore() ? 'alert-body-extra-show' : 'alert-body-extra-hide'}>
            <div class="alert-divider"></div>
            {props.extraContent}
          </div>
        </div>
        {props.extraContent && (
          <div class="alert-footer" onClick={() => setShowMore(!showMore())}>
            {showMore() ? 'Show less' : 'Show more'}
          </div>
        )}
      </div>
    </div>
  )
}

export default Alert
