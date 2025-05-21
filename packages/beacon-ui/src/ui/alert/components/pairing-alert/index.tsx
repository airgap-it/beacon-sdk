import Alert from '../../../../components/alert'
import useConnect from '../../hooks/useConnect'
import BugReportForm from '../../../../components/bug-report-form'
import Info from '../../../../components/info'
import PairOther from '../../../../components/pair-other'
import TopWallets from '../../../../components/top-wallets'
import Wallets from '../../../../components/wallets'
import { isMobileOS } from '../../../../utils/platform'
import useWallets from '../../hooks/useWallets'
import { AlertState, ConfigurableAlertProps } from '../../../common'
import useIsMobile from '../../hooks/useIsMobile'
import { useEffect, useState } from 'react'
import WCInitError from './components/wc-init-error'
import QRCode from './components/qr-code'
import MobilePairing from './components/mobile-pairing'
import useSubstrateWallets from '../../hooks/useSubstrateWallets'

const PairingAlert: React.FC<ConfigurableAlertProps> = (props) => {
  const wcPayload = props.pairingPayload!.walletConnectSyncCode
  const p2pPayload = props.pairingPayload!.p2pSyncCode
  const postPayload = props.pairingPayload!.postmessageSyncCode
  const isMobile = useIsMobile()
  const wallets = useWallets(
    props.pairingPayload?.networkType,
    !props.substratePairing ? props.featuredWallets : undefined
  )
  const substrateWalltes = useSubstrateWallets(
    props.pairingPayload?.networkType,
    props.substratePairing ? props.featuredWallets : undefined
  )
  const [
    wallet,
    isLoading,
    qrCode,
    state,
    displayQRExtra,
    showMoreContent,
    isWCWorking,
    handleClickWallet,
    handleNewTab,
    handleDeepLinking,
    handleClickOther,
    handleClickConnectExtension,
    handleClickInstallExtension,
    handleClickOpenDesktopApp,
    handleClickDownloadDesktopApp,
    handleUpdateState,
    handleUpdateQRCode,
    handleShowMoreContent,
    handleDisplayQRExtra,
    handleIsLoading
  ] = useConnect(
    isMobile,
    wcPayload,
    p2pPayload,
    postPayload,
    props.substratePairing ? substrateWalltes : wallets,
    props.onClose
  )
  const isOnline = navigator.onLine
  const walletList = Array.from(
    props.substratePairing ? substrateWalltes.values() : wallets.values()
  )

  const [isPairingExpired, setIsPairingExpired] = useState(false)

  useEffect(() => {
    if (!props.openBugReport || state === AlertState.BUG_REPORT) {
      return
    }

    handleUpdateState(AlertState.BUG_REPORT)
  }, [props.openBugReport])

  useEffect(() => {
    if (props.open || state !== AlertState.BUG_REPORT) {
      return
    }

    setIsPairingExpired(true)
  }, [state, props.open])

  const QR: React.FC<{ isMobile: boolean }> = ({ isMobile }) => (
    <QRCode
      wallet={wallet}
      isWCWorking={isWCWorking}
      isMobile={isMobile}
      qrCode={qrCode}
      defaultPairing={p2pPayload}
      handleUpdateState={handleUpdateState}
      handleIsLoading={handleIsLoading}
    />
  )

  const MobileInfoCard = () => {
    handleIsLoading(false)

    if (!wallet) {
      throw new Error('Wallet undefined')
    }

    return (
      <MobilePairing
        wallet={wallet}
        handleUpdateState={handleUpdateState}
        handleDeepLinking={handleDeepLinking}
        wcPayload={wcPayload}
        p2pPayload={p2pPayload}
        handleUpdateQRCode={handleUpdateQRCode}
        handleDisplayQRExtra={handleDisplayQRExtra}
        onClose={props.onClose}
      />
    )
  }

  return (
    <Alert
      {...props}
      closeOnBackdropClick={state !== AlertState.BUG_REPORT}
      loading={isLoading}
      onCloseClick={props.onClose}
      open={props.open}
      showMore={showMoreContent}
      extraContent={
        state !== AlertState.TOP_WALLETS || isMobile ? undefined : (
          <Wallets
            small
            disabled={isLoading}
            wallets={walletList.slice(-(walletList.length - 4))}
            isMobile={isMobile}
            onClickWallet={(id) => handleClickWallet(id, props)}
            onClickOther={handleClickOther}
          />
        )
      }
      onClickShowMore={handleShowMoreContent}
      onBackClick={
        [AlertState.INSTALL, AlertState.QR].includes(state) ||
        (state === AlertState.WALLETS && isMobile)
          ? () => handleUpdateState(AlertState.TOP_WALLETS)
          : state === 'bug-report'
            ? () => {
                if (isPairingExpired) {
                  props.onClose()
                  return undefined
                }
                return handleUpdateState(AlertState.TOP_WALLETS)
              }
            : undefined
      }
    >
      <div>
        {state === AlertState.INSTALL && (
          <div
            style={{
              opacity: 1,
              height: 'unset',
              overflow: 'unset',
              transform: 'scale(1)',
              transition: 'all ease 0.3s',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.9em'
            }}
          >
            {isOnline && wallet?.types.includes('web') && (
              <Info
                border
                title={`Connect with ${wallet?.name} Web`}
                description={`(It will open the wallet in a new tab)`}
                buttons={[
                  {
                    label: 'Use Browser',
                    type: 'primary',
                    onClick: () => handleNewTab(props, wallet)
                  }
                ]}
              />
            )}
            {!isMobile && wallet?.types.includes('extension') && (
              <Info
                border
                title={
                  wallet.firefoxId
                    ? `Connect with ${wallet?.name} Browser Extension`
                    : `Install ${wallet?.name} Wallet`
                }
                description={
                  wallet.firefoxId
                    ? `Please connect below to use your ${wallet?.name} Wallet browser extension.`
                    : `To connect your ${wallet?.name} Wallet, install the browser extension.`
                }
                buttons={
                  wallet.firefoxId
                    ? [
                        {
                          label: 'Use Extension',
                          type: 'primary',
                          onClick: () => handleClickConnectExtension()
                        }
                      ]
                    : [
                        {
                          label: 'Install extension',
                          type: 'primary',
                          onClick: () => handleClickInstallExtension()
                        }
                      ]
                }
              />
            )}
            {!isMobileOS(window) && wallet?.types.includes('desktop') && (
              <Info
                border
                title={`Connect with ${wallet?.name} Desktop App`}
                description={`If you don't have the desktop app installed, click below to download it.`}
                buttons={[
                  {
                    label: 'Open desktop app',
                    type: 'primary',
                    onClick: () => handleClickOpenDesktopApp()
                  },
                  {
                    label: 'Download desktop app',
                    type: 'secondary',
                    onClick: () => handleClickDownloadDesktopApp()
                  }
                ]}
              />
            )}
            {!isMobileOS(window) &&
              (qrCode?.length ?? 0) > 0 &&
              wallet?.types.includes('ios') &&
              (wallet?.types.length as number) > 1 && <QR isMobile={false} />}
            {!isMobileOS(window) &&
              (qrCode?.length ?? 0) > 0 &&
              wallet?.types.includes('ios') &&
              (wallet?.types.length as number) <= 1 && <QR isMobile={true} />}
            {isMobileOS(window) &&
              wallet?.types.includes('ios') &&
              ((isWCWorking && wallet?.supportedInteractionStandards?.includes('wallet_connect')) ||
              wallet?.name.toLowerCase().includes('acurast') ? (
                <MobileInfoCard />
              ) : (
                <WCInitError
                  title={`Connect with ${wallet?.name} Mobile`}
                  handleUpdateState={handleUpdateState}
                />
              ))}
          </div>
        )}
        {state === AlertState.QR && (
          <div
            style={{
              opacity: 1,
              height: 'unset',
              overflow: 'unset',
              transform: 'scale(1)',
              transition: 'all ease 0.3s',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.9em'
            }}
          >
            {!displayQRExtra ? (
              <PairOther
                walletList={walletList}
                onClickLearnMore={() => {}}
                p2pPayload={p2pPayload}
                wcPayload={wcPayload}
              />
            ) : (
              <QR isMobile={true} />
            )}
          </div>
        )}
        {state === AlertState.WALLETS && (
          <div
            style={{
              opacity: 1,
              height: 'unset',
              overflow: 'unset',
              transform: 'scale(1)',
              transition: 'all ease 0.3s'
            }}
          >
            <Wallets
              wallets={walletList.slice(-(walletList.length - (isMobile ? 3 : 4)))}
              isMobile={isMobile}
              onClickWallet={(id) => handleClickWallet(id, props)}
              onClickOther={handleClickOther}
            />
          </div>
        )}
        {state === AlertState.BUG_REPORT && (
          <div
            style={{
              opacity: 1,
              height: 'unset',
              overflow: 'unset',
              transform: 'scale(1)',
              transition: 'all ease 0.3s',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.9em'
            }}
          >
            <BugReportForm onSubmit={props.onClose} />
          </div>
        )}
        {![AlertState.QR, AlertState.WALLETS, AlertState.BUG_REPORT, AlertState.INSTALL].includes(
          state
        ) && (
          <div
            style={{
              opacity: 1,
              height: 'unset',
              overflow: 'unset',
              transform: 'scale(1)',
              transition: 'all ease 0.3s'
            }}
          >
            <TopWallets
              wallets={isMobile ? walletList.slice(0, 3) : walletList.slice(0, 4)}
              isMobile={isMobile}
              onClickWallet={(id) => handleClickWallet(id, props)}
              onClickLearnMore={() => handleUpdateState(AlertState.BUG_REPORT)}
              disabled={isLoading}
              otherWallets={
                isMobile && walletList.length >= 6
                  ? {
                      images: [walletList[3].image, walletList[4].image, walletList[5].image],
                      onClick: () => handleUpdateState(AlertState.WALLETS)
                    }
                  : undefined
              }
            />
          </div>
        )}
      </div>
    </Alert>
  )
}

export default PairingAlert
