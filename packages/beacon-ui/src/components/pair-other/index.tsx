import React, { useState, useEffect } from 'react'
import QR from '../qr'

import { PairOtherProps } from '../../ui/common'

const PairOther: React.FC<PairOtherProps> = (props: PairOtherProps) => {
  const [uiState, setUiState] = useState<'selection' | 'p2p' | 'walletconnect' | 'unified'>('selection')
  const [hasBeacon, setHasBeacon] = useState<boolean>(false)
  const [hasWalletConnect, setHasWalletConnect] = useState<boolean>(false)
  const [hasUnified, setHasUnified] = useState<boolean>(false)
  const [qrData, setQrData] = useState<string>('')

  useEffect(() => {
    const init = async () => {
      const p2p = await props.p2pPayload
      const wc = await props.wcPayload
      const unified = props.unifiedPayload ? await props.unifiedPayload : ''

      setHasBeacon(p2p && p2p.length > 0 ? true : false)
      setHasWalletConnect(wc && wc.length > 0 ? true : false)
      setHasUnified(unified && unified.length > 0 ? true : false)
    }
    init()
    setUiState('selection')
    setQrData('')
  }, [])

  const buttonClickHandler = async (state: 'p2p' | 'walletconnect' | 'unified') => {
    if (state === 'p2p') {
      setQrData(await props.p2pPayload)
    } else if (state === 'walletconnect') {
      setQrData(await props.wcPayload)
    } else if (state === 'unified' && props.unifiedPayload) {
      setQrData(await props.unifiedPayload)
    }
    setUiState(state)
  }

  return (
    <>
      {uiState === 'selection' && (
        <div>
          <span className="pair-other-info">Select QR Type</span>
          <br />
          {hasUnified && (
            <button className="wallets-button" onClick={() => buttonClickHandler('unified')}>
              Unified (PoC)
            </button>
          )}
          {hasBeacon && (
            <button className="wallets-button" onClick={() => buttonClickHandler('p2p')}>
              Beacon
            </button>
          )}
          {hasWalletConnect && (
            <button className="wallets-button" onClick={() => buttonClickHandler('walletconnect')}>
              WalletConnect
            </button>
          )}
        </div>
      )}
      {uiState !== 'selection' && qrData && (
        <QR
          isWalletConnect={uiState === 'walletconnect' || uiState === 'unified'}
          isMobile={true}
          walletName={'AirGap'}
          code={qrData}
          onClickLearnMore={props.onClickLearnMore}
        />
      )}
      {uiState !== 'selection' && !qrData && (
        <span style={{ color: '#FF4136' }} className="pair-other-info">
          Not connected.
        </span>
      )}
    </>
  )
}

export default PairOther
