import { Component, For, createEffect, createSignal, onCleanup } from 'solid-js'
import { MergedWallet } from 'src/utils/wallets'
import Wallet from '../wallet'
import styles from './styles.css'

interface TopWalletsProps {
  wallets: MergedWallet[]
  onClickWallet: (id: string) => void
  onClickLearnMore: () => void
  otherWallets?: { images: string[]; onClick: () => void }
  disabled?: boolean
}

const TopWallets: Component<TopWalletsProps> = (props: TopWalletsProps) => {
  const checkOS =
    /(Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet|Windows Phone|SymbianOS|Kindle)/i.test(
      navigator.userAgent
    )
  const [isMobile, setIsMobile] = createSignal(checkOS)
  const [windowWidth, setWindowWidth] = createSignal(window.innerWidth)

  const updateIsMobile = (isMobileWidth: boolean) => {
    // to avoid unwanted side effects (because of the OR condition), I always reset the value without checking the previous state
    setIsMobile(isMobileWidth || checkOS)
  }

  createEffect(() => {
    updateIsMobile(windowWidth() <= 800)
  })

  // Update the windowWidth signal when the window resizes
  createEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)

    // Unsubscribe from the event when the component unmounts
    onCleanup(() => {
      window.removeEventListener('resize', handleResize)
    })
  })

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
              mobile={isMobile()}
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
    </div>
  )
}

export { styles }
export default TopWallets
