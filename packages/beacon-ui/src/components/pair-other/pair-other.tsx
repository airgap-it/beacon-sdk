import { Component, createSignal, onMount } from 'solid-js'
import QR from '../qr'
import { MergedWallet } from '../../utils/wallets'
import { P2PPairingRequest, WalletConnectPairingRequest } from '@airgap/beacon-types'
import styles from './styles.css'
import { Serializer } from '@airgap/beacon-core'

export interface PairOtherProps {
  walletList: MergedWallet[]
  p2pPayload: P2PPairingRequest | undefined
  wcPayload: WalletConnectPairingRequest | undefined
  onClickLearnMore: () => void
}

const [uiState, setUiState] = createSignal<'selection' | 'p2p' | 'walletconnect'>('selection')
const [hasBeacon, setHasBeacon] = createSignal<boolean>(false)
const [hasWalletConnect, setHasWalletConnect] = createSignal<boolean>(false)
const [qrData, setQrData] = createSignal<string>('')

const PairOther: Component<PairOtherProps> = (props: PairOtherProps) => {
  onMount(() => {
    setUiState('selection')
    setQrData('')
  })

  setHasBeacon(!!props.p2pPayload)
  setHasWalletConnect(!!props.wcPayload)

  const buttonClickHandler = (state: 'p2p' | 'walletconnect') => {
    if (state === 'p2p' && !!props.p2pPayload) {
      const serializer = new Serializer()
      serializer
        .serialize(props.p2pPayload)
        .then((codeQR) => setQrData(codeQR))
        .catch((err) => console.error(err.message))
    } else if (state === 'walletconnect' && !!props.wcPayload) {
      setQrData(props.wcPayload.uri)
    }
    setUiState(state)
  }

  return (
    <>
      {uiState() === 'selection' && (
        <div>
          <span class="pair-other-info">Select QR Type</span>
          <br />
          {hasBeacon() && (
            <button
              class="wallets-button"
              onClick={() => {
                buttonClickHandler('p2p')
              }}
            >
              Beacon
            </button>
          )}
          {hasWalletConnect() && (
            <button
              class="wallets-button"
              onClick={() => {
                buttonClickHandler('walletconnect')
              }}
            >
              WalletConnect
            </button>
          )}
        </div>
      )}
      {uiState() !== 'selection' && !!qrData() && (
        <QR
          isWalletConnect={uiState() === 'walletconnect'}
          isMobile={true}
          walletName={'AirGap'}
          code={qrData()}
          onClickLearnMore={props.onClickLearnMore}
        />
      )}
    </>
  )
}

export { styles }
export default PairOther
