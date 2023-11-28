import { Component, For } from 'solid-js'
import { MergedWallet } from '../../utils/wallets'
import Wallet from '../wallet'
import styles from './styles.css'

interface TopWalletsProps {
  wallets: MergedWallet[]
  onClickWallet: (id: string) => void
  onClickLearnMore: () => void
  otherWallets?: { images: string[]; onClick: () => void }
  disabled?: boolean
  isMobile: boolean
}

const TopWallets: Component<TopWalletsProps> = (props: TopWalletsProps) => {
  return (
    <div class="top-wallets-wrapper">
      <div class="top-wallets-info">
        <h3>Connect Wallet</h3>
        <span>
          If you don't have a wallet, you can select a provider and create one now.{' '}
          <span class="top-wallets-learn-more" onClick={() => props.onClickLearnMore()}>
            Learn more
          </span>
        </span>
      </div>
      <div class="top-wallets-wallets-main">
        <For each={props.wallets}>
          {(wallet) => (
            <Wallet
              disabled={props.disabled}
              mobile={props.isMobile}
              name={wallet.name}
              description={wallet.descriptions.join(' & ')}
              image={wallet.image}
              onClick={() => props.onClickWallet(wallet.id)}
              tags={wallet.tags}
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
      <div class="top-wallets-info">
        <span>
          Do you wish to report a bug? Open an issue on our{' '}
          <span class="top-wallets-learn-more">
            <a href="https://github.com/airgap-it/beacon-sdk/issues/new?labels=bug&template=bug_report.md">
              GitHub
            </a>
          </span>
        </span>
      </div>
    </div>
  )
}

export { styles }
export default TopWallets
