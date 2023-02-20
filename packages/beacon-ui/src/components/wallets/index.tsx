import { Component, For } from 'solid-js'
import Wallet from '../wallet'
import styles from './styles.css'

interface WalletProps {
  wallets: {
    id: string
    name: string
    description?: string
    image: string
    supportedInteractionStandards?: string[]
  }[]
  onClickWallet: (id: string | undefined) => void
  small?: boolean
}

const Wallets: Component<WalletProps> = (props: WalletProps) => {
  return (
    <div class="wallets-list-main-wrapper">
      <div class="wallets-list-wrapper">
        <For each={props.wallets}>
          {(wallet) => (
            <Wallet
              name={wallet.name}
              description={wallet.description}
              image={wallet.image}
              small={props.small}
              onClick={() => {
                if (wallet && wallet.supportedInteractionStandards) {
                  props.onClickWallet(wallet?.supportedInteractionStandards[0])
                } else {
                  props.onClickWallet(undefined)
                }
              }}
            />
          )}
        </For>
      </div>
      <button class="wallets-button">Pair wallet on another device</button>
    </div>
  )
}

export { styles }
export default Wallets