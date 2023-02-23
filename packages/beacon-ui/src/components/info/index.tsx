import { Component, For } from 'solid-js'
import styles from './styles.css'

interface InfoProps {
  title: string
  description?: string
  icon?: any
  border?: boolean
  iconBadge?: boolean
  bigIcon?: boolean
  buttons?: { label: string; type: 'primary' | 'secondary'; onClick: () => void }[]
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
      <div class="info-buttons">
        <For each={props.buttons}>
          {(button) => (
            <button
              class={button.type !== 'secondary' ? 'info-button' : 'info-button-secondary'}
              onClick={button.onClick}
            >
              {button.label}
            </button>
          )}
        </For>
      </div>
    </div>
  )
}

export { styles }
export default Info
