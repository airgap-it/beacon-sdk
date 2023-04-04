import { Component, onCleanup, onMount } from 'solid-js'
import { CloseIcon, LeftIcon, LogoIcon } from '../icons'
import Loader from '../loader'

export interface AlertProps {
  content: any
  open: boolean
  showMore?: boolean
  extraContent?: any
  loading?: boolean
  onCloseClick: () => void
  onClickShowMore?: () => void
  onBackClick?: () => void
}

const Alert: Component<AlertProps> = (props: AlertProps) => {
  let prevBodyOverflow: any = null
  onMount(() => {
    prevBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  })

  onCleanup(() => {
    document.body.style.overflow = prevBodyOverflow
  })

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
        <div
          class="alert-modal-loading-wrapper"
          style={
            props.loading
              ? {
                  opacity: 1,
                  transition: 'all ease 0.3s',
                  height: '14px',
                  overflow: 'unset',
                  width: 'unset'
                }
              : { opacity: 0, transition: 'all ease 0.3s', height: 0, overflow: 'hidden', width: 0 }
          }
        >
          <Loader />
        </div>
        <div class="alert-body" style={{ 'margin-bottom': props.extraContent ? '' : '1.8em' }}>
          {props.content}
          {!isMobile && (
            <div class={props.showMore ? 'alert-body-extra-show' : 'alert-body-extra-hide'}>
              {props.extraContent && <div class="alert-divider"></div>}
              {props.extraContent}
            </div>
          )}
        </div>
        {!isMobile && props.extraContent && (
          <div
            class="alert-footer"
            onClick={() => {
              if (props.onClickShowMore) props.onClickShowMore()
            }}
          >
            {props.showMore ? 'Show less' : 'Show more'}
          </div>
        )}
      </div>
    </div>
  )
}

export default Alert
