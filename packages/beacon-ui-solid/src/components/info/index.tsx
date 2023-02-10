import { Component, For } from 'solid-js'
import styles from './styles.css'

interface InfoProps {
  title: string
  description?: string
  icon?: any
  buttons?: { label: string; type: 'primary' | 'scondary'; onClick: () => void }[]
}

const Info: Component<InfoProps> = (props: InfoProps) => {
  return (
    <div class="info-wrapper">
      {props.icon && <div class="info-icon">{props.icon}</div>}
      <h3 class="info-title">{props.title}</h3>
      {props.description && <div class="info-description">{props.description}</div>}
      <div class="info-buttons">
        <For each={props.buttons}>
          {(button) => (
            <button class="info-button" onClick={button.onClick}>
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
