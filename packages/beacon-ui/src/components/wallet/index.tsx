import { Component, For } from 'solid-js'
import styles from './styles.css'

interface WalletProps {
  name: string
  image: string
  description?: string
  small?: boolean
  mobile?: boolean
  onClick: () => void
  tags?: string[]
  disabled?: boolean
}

const Wallet: Component<WalletProps> = (props: WalletProps) => {
  return (
    <div class={props.disabled ? 'wallet-disabled' : ''}>
      {!props.small && (
        <div
          class={`wallet-main ${props.mobile ? 'wallet-main-mobile' : ''}`}
          onClick={props.onClick}
        >
          <div class={`wallet-main-left ${props.mobile ? 'wallet-main-left-mobile' : ''}`}>
            <h3>{props.name}</h3>
            {props.description && <p>{props.description}</p>}
            {props.tags && props.tags.length > 0 && (
              <div class="wallet-main-tags">
                <For each={props.tags}>{(tag) => <span class="wallet-main-tag">{tag}</span>}</For>
              </div>
            )}
          </div>
          <div class="wallet-main-right">
            <img src={props.image} />
          </div>
        </div>
      )}
      {props.small && (
        <div class="wallet-small" onClick={props.onClick}>
          <img src={props.image} />
          <h3>{props.name}</h3>
        </div>
      )}
    </div>
  )
}

export { styles }
export default Wallet
