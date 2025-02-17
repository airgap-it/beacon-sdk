import { Component, For } from 'solid-js'
import styles from './styles.css'
import { QRCodeIcon } from '../icons'
import { AlertButton } from 'src/ui/alert'

interface InfoProps {
  title: string
  description?: string
  data?: string
  icon?: any
  border?: boolean
  iconBadge?: boolean
  bigIcon?: boolean
  buttons?: AlertButton[]
  downloadLink?: { url: string; label: string }
  onShowQRCodeClick?: (() => void) | (() => Promise<void>)
}

const Info: Component<InfoProps> = (props: InfoProps) => {
  return (
    <div class={`info-wrapper ${props.border ? 'info-border' : ''}`}>
      {props.icon && (
        <div
          class={`info-icon ${props.iconBadge ? 'info-badge' : ''}`}
          style={props.bigIcon ? { 'font-size': '3.4em' } : {}}
        >
          {props.icon}
        </div>
      )}
      <h3 class="info-title">{props.title}</h3>
      {props.description && <div class="info-description">{props.description}</div>}
      {props.data && <pre class="info-data">{props.data}</pre>}
      <div class="info-buttons">
        <For each={props.buttons}>
          {(button) => (
            <button
              style={(button as any).style ?? undefined}
              class={button.type !== 'secondary' ? 'info-button' : 'info-button-secondary'}
              onClick={button.onClick}
            >
              {button.label ?? (button as any).text ?? 'Close'}
            </button>
          )}
        </For>
      </div>
      {props.downloadLink && (
        <a class="downloadLink" href={props.downloadLink.url}>
          {props.downloadLink.label}
        </a>
      )}
      {props.onShowQRCodeClick && (
        <button
          id="qr-code-icon"
          onClick={() => props.onShowQRCodeClick && props.onShowQRCodeClick()}
        >
          <QRCodeIcon />
        </button>
      )}
    </div>
  )
}

export { styles }
export default Info
