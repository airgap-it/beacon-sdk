import { Component, For } from 'solid-js'
import { MergedWallet } from '../../utils/wallets'
import Wallet from '../wallet'
import styles from './styles.css'

interface WalletProps {
  wallets: MergedWallet[]
  onClickWallet: (id: string) => void
  onClickOther: () => void
  isMobile: boolean
  small?: boolean
  disabled?: boolean
}

const Wallets: Component<WalletProps> = (props: WalletProps) => {
  return (
    <div class="wallets-list-main-wrapper">
      <div class="wallets-list-wrapper">
        <For each={props.wallets}>
          {(wallet) => (
            <Wallet
              disabled={props.disabled}
              name={wallet.name}
              description={wallet.descriptions.join(' & ')}
              image={wallet.image}
              small={props.small}
              onClick={() => {
                if (props.onClickWallet) {
                  props.onClickWallet(wallet.id)
                }
              }}
            />
          )}
        </For>
      </div>
      <button class="wallets-button" onClick={() => props.onClickOther()}>
        {props.isMobile ? 'Pair wallet on another device' : 'Show QR code'}
      </button>
    </div>
  )
}

export { styles }
export default Wallets
