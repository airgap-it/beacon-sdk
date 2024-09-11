import Alert from 'src/components/alert'
import useConnect from '../../hooks/useConnect'
import BugReportForm from 'src/components/bug-report-form'
import Info from 'src/components/info'
import PairOther from 'src/components/pair-other/pair-other'
import TopWallets from 'src/components/top-wallets'
import Wallets from 'src/components/wallets'
import { isIOS } from 'src/utils/platform'
import { StorageKey } from '@airgap/beacon-types'
import QR from 'src/components/qr'
import useWallets from '../../hooks/useWallets'
import { AlertConfig } from '../../common'
import { Grid2 } from '@mui/material'

const PairingAlert: React.FC<React.PropsWithChildren<AlertConfig>> = (props) => {
  const {
    walletConnectSyncCode: wcPayload,
    p2pSyncCode: p2pPayload,
    postmessageSyncCode: postPayload
  } = props.pairingPayload!
  const wallets = useWallets(props.pairingPayload?.networkType, props.featuredWallets)
  const [
    wallet,
    isMobile,
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
    handleShowMoreContent
  ] = useConnect(
    wcPayload,
    p2pPayload,
    postPayload,
    wallets,
    props.closeButtonCallback ?? (() => {})
  )
  const isOnline = navigator.onLine
  const walletList = Array.from(wallets.values())
  const areMetricsEnabled = localStorage
    ? localStorage.getItem(StorageKey.ENABLE_METRICS) === 'true'
    : false

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
            onClick={() => handleUpdateState('help')}
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
    localStorage.setItem(
      StorageKey.LAST_SELECTED_WALLET,
      JSON.stringify({
        key: wallet?.key,
        name: wallet?.name,
        type: 'mobile',
        icon: wallet?.image
      })
    )
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
      loading={isLoading}
      onCloseClick={props.closeButtonCallback ?? (() => {})}
      open={true}
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
        state === 'help'
          ? () => handleUpdateState('top-wallets')
          : undefined
      }
    >
      <Grid2 container>
        {state === 'install' && (
          <Grid2 container justifyContent={'center'} spacing={2}>
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
            {!isMobile && wallet?.types.includes('desktop') && (
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
            {!isMobile &&
              (qrCode?.length ?? 0) &&
              wallet?.types.includes('ios') &&
              (wallet?.types.length as number) > 1 && <QRCode isMobile={false} />}
            {!isMobile &&
              (qrCode?.length ?? 0) &&
              wallet?.types.includes('ios') &&
              (wallet?.types.length as number) <= 1 && <QRCode isMobile={true} />}
            {isMobile &&
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
                      props.closeButtonCallback && props.closeButtonCallback()
                      return
                    }

                    if (isMobile && wallet.types.includes('ios') && wallet.types.length === 1) {
                      handleDeepLinking(syncCode)
                    } else {
                      handleUpdateQRCode(syncCode)
                    }

                    handleUpdateState('qr')
                    // todo setDisplayQrExtra(true)
                  }}
                />
              ) : (
                generateWCError(`Connect with ${wallet?.name} Mobile`)
              ))}
          </Grid2>
        )}
        {state === 'qr' && (
          <Grid2
            container
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
          </Grid2>
        )}
        <Grid2
          container
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
        </Grid2>
        <Grid2
          container
          style={
            state === 'help'
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
          {areMetricsEnabled && (
            <BugReportForm onSubmit={props.closeButtonCallback ?? (() => {})} />
          )}
          {!areMetricsEnabled && (
            <>
              <Info
                iconBadge
                icon={
                  <svg
                    fill="currentColor"
                    stroke-width="0"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    height="1em"
                    width="1em"
                    style={{ overflow: 'visible' }}
                    color="white"
                  >
                    <path d="M16 12h2v4h-2z"></path>
                    <path d="M20 7V5c0-1.103-.897-2-2-2H5C3.346 3 2 4.346 2 6v12c0 2.201 1.794 3 3 3h15c1.103 0 2-.897 2-2V9c0-1.103-.897-2-2-2zM5 5h13v2H5a1.001 1.001 0 0 1 0-2zm15 14H5.012C4.55 18.988 4 18.805 4 18V8.815c.314.113.647.185 1 .185h15v10z"></path>
                  </svg>
                }
                title="What is a wallet?"
                description="Wallets let you send, receive, store and interact with digital assets. Your wallet can be used as an easy way to login, instead of having to remember a password."
              />
              <Info
                iconBadge
                icon={
                  <svg
                    fill="none"
                    stroke-width="2"
                    xmlns="http://www.w3.org/2000/svg"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    viewBox="0 0 24 24"
                    height="1em"
                    width="1em"
                    style={{ overflow: 'visible' }}
                    color="white"
                  >
                    <path stroke="none" d="M0 0h24v24H0z"></path>
                    <rect width="16" height="16" x="4" y="4" rx="2"></rect>
                    <path d="M9 12h6M12 9v6"></path>
                  </svg>
                }
                title="Not sure where to start?"
                description="If you are new to the Web3, we recommend that you start by creating a Kukai wallet. Kukai is a fast way of creating your first wallet using your preferred social account."
              />
            </>
          )}
        </Grid2>
        <Grid2
          container
          style={
            state !== 'install' && state !== 'qr' && state !== 'wallets' && state !== 'help'
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
            onClickLearnMore={() => {}}
            otherWallets={
              isMobile
                ? {
                    images: [walletList[3].image, walletList[4].image, walletList[5].image],
                    onClick: () => handleUpdateState('wallets')
                  }
                : undefined
            }
          />
        </Grid2>
      </Grid2>
    </Alert>
  )
}

export default PairingAlert
