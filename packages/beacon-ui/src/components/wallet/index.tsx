import { Component } from 'solid-js'
import styles from './styles.css'

interface WalletProps {
  name: string
  image: string
  description?: string
  small?: boolean
  mobile?: boolean
  onClick: () => void
}

const Wallet: Component<WalletProps> = (props: WalletProps) => {
  return (
    <>
      {!props.small && (
        <div
          class={`wallet-main ${props.mobile ? 'wallet-main-mobile' : ''}`}
          onClick={props.onClick}
        >
          <div class={`wallet-main-left ${props.mobile ? 'wallet-main-left-mobile' : ''}`}>
            <h3>{props.name}</h3>
            {props.description && <p>{props.description}</p>}
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
    </>
  )
}

export { styles }
export default Wallet
