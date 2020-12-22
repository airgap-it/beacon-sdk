import { ExtensionMessage, ExtensionMessageTarget, NetworkType, availableTransports } from '..'
import { myWindow } from '../MockWindow'
import { getTzip10Link } from '../utils/get-tzip10-link'
import { isAndroid, isIOS } from '../utils/platform'
import { desktopList, extensionList, iOSList, webList } from './wallet-lists'

const defaultExtensions = [
  'ookjlbkiijinhpmnjffcofjonbfbgaoc', // Thanos
  'gpfndedineagiepkpinficbcbbgjoenn' // Beacon
]

export enum Platform {
  DESKTOP,
  IOS,
  ANDROID
}

export enum WalletType {
  IOS = 'ios',
  ANDROID = 'android',
  EXTENSION = 'extension',
  DESKTOP = 'desktop',
  WEB = 'web'
}

export interface AppBase {
  name: string
  shortName: string
  color: string
  logo: string
}

export interface ExtensionApp extends AppBase {
  id: string
  link: string
}

export interface WebApp extends AppBase {
  links: {
    [NetworkType.MAINNET]: string
    [NetworkType.DELPHINET]?: string
    [NetworkType.EDONET]?: string
    [NetworkType.CUSTOM]?: string
  }
}

export interface App extends AppBase {
  universalLink: string
  deepLink?: string
}

export interface PairingAlertWallet {
  name: string
  shortName?: string
  color?: string
  logo?: string
  enabled: boolean
  clickHandler(): void
}

export interface PairingAlertButton {
  title: string
  text: string
  clickHandler(): void
}

export interface PairingAlertList {
  title: string
  type: WalletType
  wallets: PairingAlertWallet[]
}

export interface PairingAlertInfo {
  walletLists: PairingAlertList[]
  buttons: PairingAlertButton[]
  qrData: string
}

export type StatusUpdateHandler = (walletType: WalletType, app?: PairingAlertWallet) => void

export class Pairing {
  public static async getPlatfrom(): Promise<Platform> {
    return isAndroid(window) ? Platform.ANDROID : isIOS(window) ? Platform.IOS : Platform.DESKTOP
  }

  public static async getPairingInfo(
    pairingPayload: {
      p2pSyncCode: string
      postmessageSyncCode: string
      preferredNetwork: NetworkType
    },
    statusUpdateHandler: StatusUpdateHandler,
    platform?: Platform
  ): Promise<PairingAlertInfo> {
    const activePlatform = platform ?? (await Pairing.getPlatfrom())

    const pairingCode = pairingPayload.p2pSyncCode
    const postmessageSyncCode = pairingPayload.postmessageSyncCode
    const preferredNetwork = pairingPayload.preferredNetwork

    switch (activePlatform) {
      case Platform.DESKTOP:
        return Pairing.getDesktopPairingAlert(
          pairingCode,
          statusUpdateHandler,
          postmessageSyncCode,
          preferredNetwork
        )
      case Platform.IOS:
        return Pairing.getIOSPairingAlert(pairingCode, statusUpdateHandler, preferredNetwork)
      case Platform.ANDROID:
        return Pairing.getAndroidPairingAlert(pairingCode, statusUpdateHandler, preferredNetwork)

      default:
        throw new Error('platform unknown')
    }
  }

  private static async getDesktopPairingAlert(
    pairingCode: string,
    statusUpdateHandler: StatusUpdateHandler,
    postmessageSyncCode: string,
    network: NetworkType
  ): Promise<PairingAlertInfo> {
    const availableExtensions = await availableTransports.availableExtensions
    const qrLink = getTzip10Link('tezos://', pairingCode)

    availableExtensions.forEach((ext) => {
      const index = defaultExtensions.indexOf(ext.id)
      if (index >= 0) {
        defaultExtensions.splice(index, 1)
      }
    })

    return {
      walletLists: [
        {
          title: 'Browser Extensions',
          type: WalletType.EXTENSION,
          wallets: [
            ...availableExtensions.map((app) => {
              const ext = extensionList.find((extEl) => extEl.id === app.id)

              return {
                name: app.name ?? ext?.name,
                logo: app.iconUrl ?? ext?.logo,
                shortName: app.shortName ?? ext?.shortName,
                color: app.color ?? ext?.color,
                enabled: true,
                clickHandler(): void {
                  if (postmessageSyncCode) {
                    const message: ExtensionMessage<string> = {
                      target: ExtensionMessageTarget.EXTENSION,
                      payload: postmessageSyncCode,
                      targetId: app.id
                    }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    myWindow.postMessage(message as any, window.location.origin)
                  }
                  statusUpdateHandler(WalletType.EXTENSION, this)
                }
              }
            }),
            ...extensionList
              .filter((app) => defaultExtensions.some((extId) => extId === app.id))
              .map((app) => ({
                name: app.name,
                shortName: app.shortName,
                color: app.color,
                logo: app.logo,
                enabled: false,
                clickHandler: (): void => {
                  // Don't do anything
                }
              }))
          ]
        },
        {
          title: 'Desktop & Web Wallets',
          type: WalletType.DESKTOP,
          wallets: [
            ...desktopList.map((app) => ({
              name: app.name,
              shortName: app.shortName,
              color: app.color,
              logo: app.logo,
              enabled: true,
              clickHandler(): void {
                const link = getTzip10Link(app.deepLink ?? app.universalLink, pairingCode)
                window.open(link, '_blank')
                statusUpdateHandler(WalletType.DESKTOP, this)
              }
            })),
            ...(await Pairing.getWebList(pairingCode, statusUpdateHandler, network))
          ]
        }
      ],
      buttons: [],
      qrData: qrLink
    }
  }

  private static async getIOSPairingAlert(
    pairingCode: string,
    statusUpdateHandler: StatusUpdateHandler,
    network: NetworkType
  ): Promise<PairingAlertInfo> {
    const qrLink = getTzip10Link('tezos://', pairingCode)

    return {
      walletLists: [
        {
          title: 'Mobile Wallets',
          type: WalletType.IOS,
          wallets: iOSList.map((app) => ({
            name: app.name,
            shortName: app.shortName,
            color: app.color,
            logo: app.logo,
            enabled: true,
            clickHandler(): void {
              const link = getTzip10Link(app.deepLink ?? app.universalLink, pairingCode)

              // iOS does not trigger deeplinks with `window.open(...)`. The only way is using a normal link. So we have to work around that.
              const a = document.createElement('a')
              a.setAttribute('href', link)
              a.dispatchEvent(
                new MouseEvent('click', { view: window, bubbles: true, cancelable: true })
              )

              statusUpdateHandler(WalletType.IOS, this)
            }
          }))
        },
        {
          title: 'Web Wallets',
          type: WalletType.WEB,
          wallets: [...(await Pairing.getWebList(pairingCode, statusUpdateHandler, network))]
        }
      ],
      buttons: [],
      qrData: qrLink
    }
  }

  private static async getAndroidPairingAlert(
    pairingCode: string,
    statusUpdateHandler: StatusUpdateHandler,
    network: NetworkType
  ): Promise<PairingAlertInfo> {
    const qrLink = getTzip10Link('tezos://', pairingCode)

    return {
      walletLists: [
        {
          title: 'Web Wallets',
          type: WalletType.WEB,
          wallets: [...(await Pairing.getWebList(pairingCode, statusUpdateHandler, network))]
        }
      ],
      buttons: [
        {
          title: 'Mobile Wallets',
          text: 'Connect Wallet',
          clickHandler: (): void => {
            window.open(qrLink, '_blank')
            statusUpdateHandler(WalletType.ANDROID)
          }
        }
      ],
      qrData: qrLink
    }
  }

  private static async getWebList(
    pairingCode: string,
    statusUpdateHandler: StatusUpdateHandler,
    network: NetworkType
  ): Promise<PairingAlertWallet[]> {
    return webList.map((app) => ({
      name: app.name,
      shortName: app.shortName,
      color: app.color,
      logo: app.logo,
      enabled: true,
      clickHandler(): void {
        const link = getTzip10Link(
          app.links[network] ?? app.links[NetworkType.MAINNET],
          pairingCode
        )
        window.open(link, '_blank')
        statusUpdateHandler(WalletType.WEB, this)
      }
    }))
  }
}
