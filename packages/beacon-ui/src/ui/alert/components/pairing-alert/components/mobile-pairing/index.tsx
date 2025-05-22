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
  handleUpdateQRCode,
  handleDisplayQRExtra,
  onClose
}) => {
  return (
    <Info
      border
      title={`Connect with ${wallet?.name} ${suffixMap.get(wallet?.id) ?? ''}`}
      description={''}
      buttons={[
        {
          label: 'Use App',
          type: 'primary',
          onClick: () => {
            if (!wallet) {
              console.error('No wallet found.')
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

        handleUpdateQRCode(syncCode)
        handleUpdateState(AlertState.QR)
        handleDisplayQRExtra(true)
      }}
    />
  )
}

export default MobilePairing
