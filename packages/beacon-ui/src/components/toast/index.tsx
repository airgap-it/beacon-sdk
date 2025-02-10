import React, { useState, useEffect } from 'react'
import { useDrag } from '@use-gesture/react'
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
          <img draggable={false} src={walletInfo.icon} alt={`${walletInfo.name} icon`} />
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
  const hasWalletObject = props.label.includes('{{wallet}}') && props.walletInfo
  const isRequestSentToast = props.label.includes('Request sent to')

  // Track the toast position (x, y)
  const [[x, y], setPosition] = useState<[number, number]>([0, 0])

  const bindDrag = useDrag(({ offset: [mx, my] }) => {
    // Update x, y whenever offset changes
    setPosition([mx, my])
  })

  const isMobile = isMobileOS(window)

  useEffect(() => {
    if (isRequestSentToast) {
      setShowMoreInfo(false)
      setTimeout(() => {
        setShowMoreInfo(true)
      }, 3000)
    }
  }, [isRequestSentToast])

  return (
    <div
      style={{
        position: 'absolute',
        transform: `translate3d(${x}px, ${y}px, 0)`,
        // Required
        touchAction: 'none',
        minWidth: !isMobile ? 460 : undefined
      }}
      className={props.open ? 'toast-wrapper-show' : 'toast-wrapper-hide'}
      {...bindDrag()}
    >
      <div className="toast-header">
        <Loader />
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
