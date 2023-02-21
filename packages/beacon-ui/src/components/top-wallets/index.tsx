import { Component, For } from 'solid-js'
import { MergedWallet } from 'src/utils/wallets'
import Wallet from '../wallet'
import styles from './styles.css'

interface TopWalletsProps {
  wallets: MergedWallet[]
  onClickWallet: (id: string) => void
  otherWallets?: { images: string[]; onClick: () => void }
}

const TopWallets: Component<TopWalletsProps> = (props: TopWalletsProps) => {
  const isMobile = window.innerWidth <= 800

  return (
    <div class="top-wallets-wrapper">
      <div class="top-wallets-info">
        <h3>Connect Wallet</h3>
        <p>If you don't have a wallet, you can select a provider and create one now. Learn more</p>
      </div>
      <div class="top-wallets-wallets-main">
        <For each={props.wallets}>
          {(wallet) => (
            <Wallet
              mobile={isMobile}
              name={wallet.name}
              description={wallet.descriptions.join(' & ')}
              image={wallet.image}
              onClick={() => props.onClickWallet(wallet.id)}
            />
          )}
        </For>
        {props.otherWallets && (
          <div
            class="top-wallets-other-wallets"
            onClick={() => {
              if (props.otherWallets) props.otherWallets.onClick()
            }}
          >
            <div class="top-wallets-other-wallets-left">
              <h3>Other Wallets</h3>
              <p>See other wallets you can use to connect</p>
            </div>
            <div class="top-wallets-other-wallets-right">
              <img src={props.otherWallets.images[0]} />
              <img
                class="top-wallets-other-wallets-center-wallet"
                src={props.otherWallets.images[1]}
              />
              <img src={props.otherWallets.images[2]} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export { styles }
export default TopWallets
