import React, { useState } from 'react'
import { QRCodeIcon, ClipboardIcon } from '../icons'
import { InfoProps } from '../../ui/common'

const Info: React.FC<InfoProps> = (props: InfoProps) => {
  const [copySuccess, setCopySuccess] = useState(false)

  const handleCopyError = async () => {
    if (!props.errorContext) return

    try {
      const errorReport = JSON.stringify(props.errorContext, null, 2)
      await navigator.clipboard.writeText(errorReport)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 1000)
    } catch (error) {
      console.error('Failed to copy error report:', error)
    }
  }

  return (
    <div className={`info-wrapper ${props.border ? 'info-border' : ''}`}>
      {props.icon && (
        <div
          className={`info-icon ${props.iconBadge ? 'info-badge' : ''}`}
          style={props.bigIcon ? { fontSize: '3.4em' } : {}}
        >
          {props.icon}
        </div>
      )}
      <h3 className="info-title">{props.title}</h3>
      {props.description && <div className="info-description">{props.description}</div>}

      {/* Error Code Badge - Always visible if error context exists */}
      {props.errorContext && (
        <div className="error-code-container">
          <span className="error-code-badge">
            Error Code: {props.errorContext.errorCode}
          </span>
        </div>
      )}

      {/* Original data display */}
      {props.data && <pre className="info-data">{props.data}</pre>}

      {/* Error Diagnostics - Always visible, not collapsible */}
      {props.errorContext && (
        <div className="error-diagnostics-section">
          <div className="error-diagnostics-header">Technical Details</div>
          <div className="error-diagnostics-content">
            <div className="diagnostic-item">
              <div className="diagnostic-item-header">
                <strong>Technical Message:</strong>
                <button
                  className={`copy-error-button ${copySuccess ? 'copied' : ''}`}
                  onClick={handleCopyError}
                  title="Copy error report to clipboard"
                >
                  <ClipboardIcon style={{ fontSize: '14px' }} />
                </button>
              </div>
              {props.errorContext.technicalDetails && (
                <p>{props.errorContext.technicalDetails}</p>
              )}
            </div>
            <div className="diagnostic-item">
              <strong>SDK Version:</strong>
              <p>{props.errorContext.diagnostics.sdkVersion}</p>
            </div>
            {props.errorContext.diagnostics.transport && (
              <div className="diagnostic-item">
                <strong>Transport:</strong>
                <p>{props.errorContext.diagnostics.transport}</p>
              </div>
            )}
            {props.errorContext.diagnostics.activeAccount && (
              <div className="diagnostic-item">
                <strong>Active Account:</strong>
                <p>{props.errorContext.diagnostics.activeAccount}</p>
              </div>
            )}
            <div className="diagnostic-item">
              <strong>Timestamp:</strong>
              <p>{new Date(props.errorContext.timestamp).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      <div className="info-buttons">
        {props.buttons?.map((button, index) => (
          <button
            key={index}
            className={button.type !== 'secondary' ? 'info-button' : 'info-button-secondary'}
            onClick={button.onClick}
          >
            {button.label}
          </button>
        ))}
      </div>
      {props.downloadLink && (
        <a className="downloadLink" href={props.downloadLink.url}>
          {props.downloadLink.label}
        </a>
      )}
      {props.onShowQRCodeClick && (
        <button id="qr-code-icon" onClick={props.onShowQRCodeClick}>
          <QRCodeIcon />
        </button>
      )}
    </div>
  )
}

export default Info
