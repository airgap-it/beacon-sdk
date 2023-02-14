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

  const isMobile = window.innerWidth <= 800

  return (
    <div
      class={props.open ? 'alert-wrapper-show' : 'alert-wrapper-hide'}
      onClick={() => {
        props.onCloseClick()
      }}
    >
      <div
        class={props.open ? 'alert-modal-show' : 'alert-modal-hide'}
        onClick={(e: any) => {
          e.stopPropagation()
        }}
      >
        <div class="alert-header">
          {props.onBackClick && (
            <div class="alert-button-icon" onClick={props.onBackClick}>
              <LeftIcon />
            </div>
          )}
          {!props.onBackClick && <div class="alert-button-icon-empty"></div>}
          <div class="alert-logo">
            <LogoIcon />
          </div>
          <div class="alert-button-icon" onClick={props.onCloseClick}>
            <CloseIcon />
          </div>
        </div>
        <div class="alert-body" style={{ 'margin-bottom': props.extraContent ? '' : '1.8em' }}>
          {props.content}
          {!isMobile && (
            <div class={showMore() ? 'alert-body-extra-show' : 'alert-body-extra-hide'}>
              {props.extraContent && <div class="alert-divider"></div>}
              {props.extraContent}
            </div>
          )}
        </div>
        {!isMobile && props.extraContent && (
          <div class="alert-footer" onClick={() => setShowMore(!showMore())}>
            {showMore() ? 'Show less' : 'Show more'}
          </div>
        )}
      </div>
    </div>
  )
}

export default Alert
