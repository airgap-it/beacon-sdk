import { Component, createSignal, onMount } from 'solid-js'
import QR from '../qr'
import { MergedWallet } from '../../utils/wallets'
import { P2PPairingRequest } from '@airgap/beacon-types'
import styles from './styles.css'
import { Serializer } from '@airgap/beacon-core'

export interface PairOtherProps {
  walletList: MergedWallet[]
  p2pPayload: Promise<P2PPairingRequest> | undefined
  onClickLearnMore: () => void
}

const [uiState, setUiState] = createSignal<'selection' | 'p2p' | 'walletconnect'>('selection')
const [hasBeacon, setHasBeacon] = createSignal<boolean>(false)
const [qrData, setQrData] = createSignal<string>('')

const PairOther: Component<PairOtherProps> = (props: PairOtherProps) => {
  onMount(() => {
    setUiState('p2p')
    props.p2pPayload!.then(async (payload) => {
      const serializer = new Serializer()
      const codeQR = await serializer.serialize(payload)
      setQrData(codeQR)
    })
  })

  setHasBeacon(!!props.p2pPayload)

  const buttonClickHandler = (state: 'p2p' | 'walletconnect') => {
    if (state === 'p2p' && !!props.p2pPayload) {
      props.p2pPayload.then(async (payload) => {
        const serializer = new Serializer()
        const codeQR = await serializer.serialize(payload)
        setQrData(codeQR)
      })
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
        </div>
      )}
      {uiState() !== 'selection' && !!qrData() && (
        <QR
          isWalletConnect={false}
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
