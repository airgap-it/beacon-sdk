import Alert from '../../../../components/alert'
import useConnect from '../../hooks/useConnect'
import BugReportForm from '../../../../components/bug-report-form'
import Info from '../../../../components/info'
import PairOther from '../../../../components/pair-other'
import TopWallets from '../../../../components/top-wallets'
import Wallets from '../../../../components/wallets'
import { isIOS, isMobileOS } from '../../../../utils/platform'
import { StorageKey } from '@airgap/beacon-types'
import QR from '../../../../components/qr'
import useWallets from '../../hooks/useWallets'
import { ConfigurableAlertProps } from '../../../common'
import useIsMobile from '../../hooks/useIsMobile'
import { useEffect } from 'react'

const PairingAlert: React.FC<ConfigurableAlertProps> = (props) => {
  const {
    walletConnectSyncCode: wcPayload,
    p2pSyncCode: p2pPayload,
    postmessageSyncCode: postPayload
  } = props.pairingPayload!
  const isMobile = useIsMobile()
  const wallets = useWallets(props.pairingPayload?.networkType, props.featuredWallets)
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
    handleDisplayQRExtra
  ] = useConnect(isMobile, wcPayload, p2pPayload, postPayload, wallets, props.onClose)
  const isOnline = navigator.onLine
  const walletList = Array.from(wallets.values())

  useEffect(() => {
    if (!props.openBugReport || state === 'bug-report') {
      return
    }
    handleUpdateState('bug-report')
  }, [props.openBugReport])

  const generateWCError = (title: string) => {
    const errorMessage = localStorage ? localStorage.getItem(StorageKey.WC_INIT_ERROR) : undefined
    const description: any = (
      <>
        <h3 style={{ color: '#FF4136', margin: '0.6px' }}>A network error occurred.</h3>
        <h4>
          This issue does not concern your wallet or dApp. If the problem persists, please report it
          to the Beacon team{' '}
          <span
            style={{ textDecoration: 'underline', color: '#007bff', cursor: 'pointer' }}
            onClick={() => handleUpdateState('bug-report')}
          >
            here
          </span>
        </h4>
        {errorMessage && <span>{errorMessage}</span>}
      </>
    )
    return <Info title={title} description={description} border />
  }

  const QRCode = ({ isMobile }: any) => {
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
          generateWCError(`Connect with ${wallet?.name} Mobile`)
        )}
      </>
    )
  }

  return (
    <Alert
      {...props}
      loading={isLoading}
      onCloseClick={props.onClose}
      open={props.open}
      showMore={showMoreContent}
      extraContent={
        state !== 'top-wallets' || isMobile ? undefined : (
          <Wallets
            small
            wallets={walletList.slice(-(walletList.length - 4))}
            isMobile={isMobile}
            onClickWallet={(id) => handleClickWallet(id, props)}
            onClickOther={handleClickOther}
          />
        )
      }
      onClickShowMore={handleShowMoreContent}
      onBackClick={
        state === 'install' ||
        state === 'qr' ||
        (state === 'wallets' && isMobile) ||
        state === 'bug-report'
          ? () => handleUpdateState('top-wallets')
          : undefined
      }
    >
      <div>
        {state === 'install' && (
          <div
            style={
              state === 'install' || state === 'qr'
                ? {
                    opacity: 1,
                    height: 'unset',
                    overflow: 'unset',
                    transform: 'scale(1)',
                    transition: 'all ease 0.3s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.9em'
                  }
                : {
                    opacity: 0,
                    height: 0,
                    overflow: 'hidden',
                    transform: 'scale(1.1)',
                    transition: 'all ease 0.3s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.9em'
                  }
            }
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
              (qrCode?.length ?? 0) &&
              wallet?.types.includes('ios') &&
              (wallet?.types.length as number) > 1 && <QRCode isMobile={false} />}
            {!isMobileOS(window) &&
              (qrCode?.length ?? 0) &&
              wallet?.types.includes('ios') &&
              (wallet?.types.length as number) <= 1 && <QRCode isMobile={true} />}
            {isMobileOS(window) &&
              wallet?.types.includes('ios') &&
              (!wallet?.supportedInteractionStandards?.includes('wallet_connect') || isWCWorking ? (
                <Info
                  border
                  title={`Connect with ${wallet?.name} Mobile`}
                  description={''}
                  buttons={[
                    {
                      label: 'Use App',
                      type: 'primary',
                      onClick: async () => {
                        if (!wallet) {
                          return
                        }
                        handleDeepLinking(
                          wallet,
                          wallet.supportedInteractionStandards?.includes('wallet_connect')
                            ? wcPayload
                            : p2pPayload
                        )
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
                    const syncCode = wallet?.supportedInteractionStandards?.includes(
                      'wallet_connect'
                    )
                      ? wcPayload
                      : p2pPayload

                    if (!syncCode.length || !wallet) {
                      props.onClose()
                      return
                    }

                    if (isMobile && wallet.types.includes('ios') && wallet.types.length === 1) {
                      handleDeepLinking(wallet, syncCode)
                    } else {
                      handleUpdateQRCode(syncCode)
                    }

                    handleUpdateState('qr')
                    handleDisplayQRExtra(true)
                  }}
                />
              ) : (
                generateWCError(`Connect with ${wallet?.name} Mobile`)
              ))}
          </div>
        )}
        {state === 'qr' && (
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
              ></PairOther>
            ) : (
              <QRCode isMobile={true} />
            )}
          </div>
        )}
        <div
          style={
            state === 'wallets'
              ? {
                  opacity: 1,
                  height: 'unset',
                  overflow: 'unset',
                  transform: 'scale(1)',
                  transition: 'all ease 0.3s'
                }
              : {
                  opacity: 0,
                  height: 0,
                  overflow: 'hidden',
                  transform: 'scale(1.1)',
                  transition: 'all ease 0.3s'
                }
          }
        >
          <Wallets
            wallets={walletList.slice(-(walletList.length - (isMobile ? 3 : 4)))}
            isMobile={isMobile}
            onClickWallet={(id) => handleClickWallet(id, props)}
            onClickOther={handleClickOther}
          />
        </div>
        <div
          style={
            state === 'bug-report'
              ? {
                  opacity: 1,
                  height: 'unset',
                  overflow: 'unset',
                  transform: 'scale(1)',
                  transition: 'all ease 0.3s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.9em'
                }
              : {
                  opacity: 0,
                  height: 0,
                  overflow: 'hidden',
                  transform: 'scale(1.1)',
                  transition: 'all ease 0.3s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.9em'
                }
          }
        >
          <BugReportForm onSubmit={props.onClose} />
        </div>
        <div
          style={
            state !== 'install' && state !== 'qr' && state !== 'wallets' && state !== 'bug-report'
              ? {
                  opacity: 1,
                  height: 'unset',
                  overflow: 'unset',
                  transform: 'scale(1)',
                  transition: 'all ease 0.3s'
                }
              : {
                  opacity: 0,
                  height: 0,
                  overflow: 'hidden',
                  transform: 'scale(1.1)',
                  transition: 'all ease 0.3s'
                }
          }
        >
          <TopWallets
            wallets={isMobile ? walletList.slice(0, 3) : walletList.slice(0, 4)}
            isMobile={isMobile}
            onClickWallet={(id) => handleClickWallet(id, props)}
            onClickLearnMore={() => handleUpdateState('bug-report')}
            otherWallets={
              isMobile
                ? {
                    images: [walletList[3].image, walletList[4].image, walletList[5].image],
                    onClick: () => handleUpdateState('wallets')
                  }
                : undefined
            }
          />
        </div>
      </div>
    </Alert>
  )
}

export default PairingAlert
