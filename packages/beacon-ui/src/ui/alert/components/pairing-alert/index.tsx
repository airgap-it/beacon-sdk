import Alert from 'src/components/alert'
import useConnect from '../../hooks/useConnect'
import useWallets from '../../hooks/useWallets'

// todo remove any
const PairingAlert: React.FC<any> = ({ wcPayload, p2pPayload, postPayload, onCloseHandler }) => {
  const wallets = useWallets()
  const [
    isLoading
    // qrCode,
    // state,
    // displayQRExtra,
    // showMoreContent,
    // handleNewTab,
    // handleDeepLinking,
    // handleClickOther,
    // handleClickConnectExtension,
    // handleClickInstallExtension,
    // handleClickOpenDesktopApp,
    // handleClickDownloadDesktopApp
  ] = useConnect(wcPayload, p2pPayload, postPayload, onCloseHandler)

  console.log('wallets', wallets)

  return (
    <Alert
      loading={isLoading}
      onCloseClick={onCloseHandler}
      open={true}
      content={<h1>Hello World</h1>}
    />
  )
}

export default PairingAlert
