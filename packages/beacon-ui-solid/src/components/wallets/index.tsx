import { Component, For } from 'solid-js'
import Wallet from '../wallet'
import styles from './styles.css'

interface WalletProps {
  wallets: { name: string; description?: string; image: string }[]
}

const Wallets: Component<WalletProps> = (props: WalletProps) => {
  return (
    <div>
      <div class="wallets-list-wrapper">
        <For each={props.wallets}>
          {(wallet) => (
            <Wallet
              name={wallet.name}
              description={wallet.description}
              image={wallet.image}
              small
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
