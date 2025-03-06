import { QRCodeProps } from '../../../../../common'
import QR from '../../../../../../components/qr'
import WCInitError from '../wc-init-error'

const QRCode: React.FC<QRCodeProps> = ({
  wallet,
  isWCWorking,
  isMobile,
  qrCode,
  handleUpdateState
}) => {
  const isConnected =
    !wallet?.supportedInteractionStandards?.includes('wallet_connect') || isWCWorking
  return (
    <>
      {isConnected ? (
        <QR
          isWalletConnect={
            wallet?.supportedInteractionStandards?.includes('wallet_connect') || false
          }
          isMobile={isMobile}
          walletName={wallet?.name || 'AirGap'}
          code={qrCode ?? ''}
          onClickLearnMore={() => {}}
          onClickQrCode={() => {}}
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
