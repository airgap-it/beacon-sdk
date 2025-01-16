import React, { useState, useEffect } from 'react'
import { CloseIcon } from '../icons'
import Loader from '../loader'
import { isMobileOS } from '../../utils/platform'
import { ToastProps } from '../../ui/common'

import './styles.css'

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

  return parts.map((part, index) => {
    if (part.match(regex)) {
      return (
        <React.Fragment key={index}>
          <img src={walletInfo.icon} alt={`${walletInfo.name} icon`} />
          <h3>{walletInfo.name}</h3>
        </React.Fragment>
      )
    } else {
      return (
        <p key={index} className="toast-label">
          {part}
        </p>
      )
    }
  })
}

const Toast: React.FC<ToastProps> = (props: ToastProps) => {
  const [showMoreInfo, setShowMoreInfo] = useState<boolean>(true)
  const [divPosition, setDivPosition] = useState<{ x: number; y: number }>({
    x: isMobileOS(window) ? 12 : window.innerWidth - 460,
    y: 12
  })
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const offset = { x: 0, y: 0 }

  const hasWalletObject = props.label.includes('{{wallet}}') && props.walletInfo
  const isRequestSentToast = props.label.includes('Request sent to')

  useEffect(() => {
    if (isRequestSentToast) {
      setShowMoreInfo(false)
      setTimeout(() => {
        setShowMoreInfo(true)
      }, 3000)
    }
  }, [isRequestSentToast])

  const onMouseDownHandler = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault() // prevents inner text highlighting
    const target = event.target as HTMLElement

    if (target.className !== 'toast-header' && target.parentElement?.className !== 'toast-header') {
      return
    }

    const boundingRect = target.getBoundingClientRect()
    offset.x = event.clientX - boundingRect.x
    offset.y = event.clientY - boundingRect.y
    setIsDragging(true)
  }

  const onMouseMoveHandler = (event: MouseEvent) => {
    if (isDragging && event.buttons === 1) {
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

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMoveHandler)
      window.addEventListener('mouseup', onMouseUpHandler)
    } else {
      window.removeEventListener('mousemove', onMouseMoveHandler)
      window.removeEventListener('mouseup', onMouseUpHandler)
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMoveHandler)
      window.removeEventListener('mouseup', onMouseUpHandler)
    }
  }, [isDragging])

  return (
    <div
      style={{ left: `${divPosition.x}px`, top: `${divPosition.y}px` }}
      className={props.open ? 'toast-wrapper-show' : 'toast-wrapper-hide'}
      onMouseDown={onMouseDownHandler}
    >
      <div className="toast-header">
        {!isDragging && <Loader />}
        {hasWalletObject && props.walletInfo && <>{parseWallet(props.label, props.walletInfo)}</>}
        {!hasWalletObject && <p className="toast-label">{props.label}</p>}
        {!isMobileOS(window) && props.openWalletAction && (
          <div className="toast-action-button" onClick={props.openWalletAction}>
            Open Wallet
          </div>
        )}
        <div className="toast-button-icon" onClick={props.onClickClose}>
          <CloseIcon />
        </div>
      </div>
      {props.actions && showMoreInfo && (
        <div className="toast-body">
          {props.actions.map((action, index) => (
            <div key={index} className="toast-action-wrapper">
              <p className={`toast-action-label ${action.isBold ? 'toast-action-bold' : ''}`}>
                {action.text}
              </p>
              {action.actionText && (
                <div className="toast-action-button" onClick={action.actionCallback}>
                  {action.actionText}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Toast
