import Info from '../../../../../../components/info'
import { AlertState } from '../../../../../common'
import { isIOS } from '../../../../../../utils/platform'
import suffixMap from './utils/suffix-map'

const MobilePairing: React.FC<any> = ({
  wallet,
  handleUpdateState,
  handleDeepLinking,
  wcPayload,
  p2pPayload,
  isMobile,
  handleUpdateQRCode,
  handleDisplayQRExtra,
  onClose
}) => {
  const isAcurast = wallet?.name.toLowerCase().includes('acurast')

  return (
    <Info
      border
      title={`Connect with ${wallet?.name} ${suffixMap.get(wallet?.id) ?? ''}`}
      description={''}
      buttons={[
        {
          label: isAcurast ? 'Show QR code' : 'Use App',
          type: 'primary',
          onClick: async () => {
            if (!wallet) {
              return
            }

            if (isAcurast) {
              handleUpdateQRCode(await p2pPayload)
              handleUpdateState(AlertState.QR)
              handleDisplayQRExtra(true)
              return
            }

            handleDeepLinking(wallet)
          }
        }
      ]}
      downloadLink={
        wallet?.name.toLowerCase().includes('kukai') && isIOS(window)
          ? {
              label: 'Get Kukai Mobile >',
              url: 'https://ios.kukai.app'
            }
          : undefined
      }
      onShowQRCodeClick={async () => {
        const syncCode = await (wallet?.supportedInteractionStandards?.includes('wallet_connect')
          ? wcPayload
          : p2pPayload)

        if (!syncCode.length) {
          onClose()
          return
        }

        if (
          isMobile &&
          wallet &&
          wallet.types.includes('ios') &&
          !isAcurast &&
          wallet.types.length === 1
        ) {
          handleDeepLinking(wallet)
          return
        }

        handleUpdateQRCode(syncCode)
        handleUpdateState(AlertState.QR)
        handleDisplayQRExtra(true)
      }}
    />
  )
}

export default MobilePairing
