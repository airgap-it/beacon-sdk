import { Component, For } from 'solid-js'
import Wallet from '../wallet'
import styles from './styles.css'

interface TopWalletsProps {
  wallets: { name: string; description: string; image: string }[]
}

const TopWallets: Component<TopWalletsProps> = (props: TopWalletsProps) => {
  return (
    <div class="top-wallets-wrapper">
      <div class="top-wallets-info">
        <h3>Connect Wallet</h3>
        <p>If you don't have a wallet, you can select a provider and create one now. Learn more</p>
      </div>
      <div class="top-wallets-wallets-main">
        <For each={props.wallets}>
          {(wallet) => (
            <Wallet name={wallet.name} description={wallet.description} image={wallet.image} />
          )}
        </For>
      </div>
    </div>
  )
}

export { styles }
export default TopWallets
