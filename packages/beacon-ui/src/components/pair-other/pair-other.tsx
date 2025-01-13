import React, { useState, useEffect } from 'react'
import QR from '../qr'

import { PairOtherProps } from '../../ui/alert/common'

const PairOther: React.FC<PairOtherProps> = (props: PairOtherProps) => {
  const [uiState, setUiState] = useState<'selection' | 'p2p' | 'walletconnect'>('selection')
  const [hasBeacon, setHasBeacon] = useState<boolean>(false)
  const [hasWalletConnect, setHasWalletConnect] = useState<boolean>(false)
  const [qrData, setQrData] = useState<string>('')

  useEffect(() => {
    setUiState('selection')
    setQrData('')
    setHasBeacon(!!props.p2pPayload)
    setHasWalletConnect(!!props.wcPayload)
  }, [props.p2pPayload, props.wcPayload])

  const buttonClickHandler = (state: 'p2p' | 'walletconnect') => {
    state === 'p2p' ? setQrData(props.p2pPayload) : setQrData(props.wcPayload)
    setUiState(state)
  }

  return (
    <>
      {uiState === 'selection' && (
        <div>
          <span className="pair-other-info">Select QR Type</span>
          <br />
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
          isWalletConnect={uiState === 'walletconnect'}
          isMobile={true}
          walletName={'AirGap'}
          code={qrData}
          onClickLearnMore={props.onClickLearnMore}
        />
      )}
    </>
  )
}

export default PairOther
