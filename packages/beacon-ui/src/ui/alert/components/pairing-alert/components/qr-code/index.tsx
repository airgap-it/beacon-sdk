import { QRCodeProps } from '../../../../../common'
import QR from '../../../../../../components/qr'
import WCInitError from '../wc-init-error'
import { useEffect, useState } from 'react'

const QRCode: React.FC<QRCodeProps> = ({
  wallet,
  isWCWorking,
  isMobile,
  qrCode,
  defaultPairing,
  handleUpdateState,
  handleIsLoading
}) => {
  const isConnected =
    !wallet?.supportedInteractionStandards?.includes('wallet_connect') || isWCWorking
  const [codeQr, setCodeQr] = useState(qrCode)

  useEffect(() => {
    const pair = async () => {
      if (codeQr) {
        return
      }

      setCodeQr(await defaultPairing)
      handleIsLoading(false)
    }

    pair()
  }, [codeQr])

  if (!codeQr || codeQr.length === 0) {
    return <></>
  }

  return (
    <>
      {isConnected ? (
        <QR
          isWalletConnect={
            wallet?.supportedInteractionStandards?.includes('wallet_connect') || false
          }
          isMobile={isMobile}
          walletName={wallet?.name || 'AirGap'}
          code={codeQr}
          onClickLearnMore={() => {}}
          onClickQrCode={() => {}}
          isDeprecated={wallet?.deprecated || false}
        />
      ) : (
        <WCInitError
          title={`Connect with ${wallet?.name} Mobile`}
          handleUpdateState={handleUpdateState}
        />
      )}
    </>
  )
}

export default QRCode
