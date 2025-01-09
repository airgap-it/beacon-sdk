import React, { useState, useEffect } from 'react'
import { Box, Typography, Button } from '@mui/material'
import QR from '../qr'
import { PairOtherProps } from 'src/ui/alert/common'

const PairOther: React.FC<PairOtherProps> = (props: PairOtherProps) => {
  const [uiState, setUiState] = useState<'selection' | 'p2p' | 'walletconnect'>('selection')
  const [hasBeacon, setHasBeacon] = useState<boolean>(false)
  const [hasWalletConnect, setHasWalletConnect] = useState<boolean>(false)
  const [qrData, setQrData] = useState<string>('')

  useEffect(() => {
    // Reset state whenever props change
    setUiState('selection')
    setQrData('')
    setHasBeacon(!!props.p2pPayload)
    setHasWalletConnect(!!props.wcPayload)
  }, [props.p2pPayload, props.wcPayload])

  const buttonClickHandler = (state: 'p2p' | 'walletconnect') => {
    setQrData(state === 'p2p' ? props.p2pPayload : props.wcPayload)
    setUiState(state)
  }

  return (
    <Box>
      {uiState === 'selection' && (
        <Box sx={{ padding: '5px' }}>
          <Typography variant="body1" gutterBottom>
            Select QR Type
          </Typography>
          {hasBeacon && (
            <Box sx={{ padding: '5px' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => buttonClickHandler('p2p')}
                sx={{ width: '100%' }}
              >
                Beacon
              </Button>
            </Box>
          )}
          {hasWalletConnect && (
            <Box sx={{ padding: '5px' }}>
              <Button
                variant="contained"
                color="primary"
                sx={{ width: '100%' }}
                onClick={() => buttonClickHandler('walletconnect')}
              >
                WalletConnect
              </Button>
            </Box>
          )}
        </Box>
      )}

      {uiState !== 'selection' && qrData && (
        <QR
          isWalletConnect={uiState === 'walletconnect'}
          isMobile
          walletName="AirGap"
          code={qrData}
          onClickLearnMore={props.onClickLearnMore}
        />
      )}
    </Box>
  )
}

export default PairOther
