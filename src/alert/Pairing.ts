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
    [NetworkType.CARTHAGENET]?: string
    [NetworkType.DELPHINET]?: string
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

export class Pairing {
  public static async getPlatfrom(): Promise<Platform> {
    return isAndroid(window) ? Platform.ANDROID : isIOS(window) ? Platform.IOS : Platform.DESKTOP
  }

  public static async getPairingInfo(
    pairingPayload: {
      p2pSyncCode: string
      postmessageSyncCode: string
    },
    platform?: Platform
  ): Promise<PairingAlertInfo> {
    const activePlatform = (await Pairing.getPlatfrom()) ?? platform
    const statusUpdateHandler = (status: string) => {
      console.log('STATUS UPDATE', status)
    }

    const qrData = pairingPayload.p2pSyncCode
    const postmessageSyncCode = pairingPayload.postmessageSyncCode

    switch (activePlatform) {
      case Platform.DESKTOP:
        return Pairing.getDesktopPairingAlert(qrData, statusUpdateHandler, postmessageSyncCode)
      case Platform.IOS:
        return Pairing.getIOSPairingAlert(qrData, statusUpdateHandler)
      case Platform.ANDROID:
        return Pairing.getAndroidPairingAlert(qrData, statusUpdateHandler)

      default:
        throw new Error('platform unknown')
    }
  }

  private static async getDesktopPairingAlert(
    qrData: string,
    statusUpdateHandler: any,
    postmessageSyncCode: string
  ): Promise<PairingAlertInfo> {
    const extensions = await availableTransports.availableExtensions

    extensions.forEach((ext) => {
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
            ...extensions.map((app) => ({
              name: app.name,
              logo: app.iconUrl,
              enabled: true,
              clickHandler: () => {
                if (postmessageSyncCode) {
                  const message: ExtensionMessage<string> = {
                    target: ExtensionMessageTarget.EXTENSION,
                    payload: postmessageSyncCode,
                    targetId: app.id
                  }
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  myWindow.postMessage(message as any, window.location.origin)
                }
                statusUpdateHandler(`click ${app.name}`)
              }
            })),
            ...extensionList.map((app) => ({
              name: app.name,
              shortName: app.shortName,
              color: app.color,
              logo: app.logo,
              enabled: false,
              clickHandler: () => {
                console.log('TEST', app.name)
                statusUpdateHandler(`click ${app.name}`)
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
              clickHandler: () => {
                console.log('TEST', app.name)
                statusUpdateHandler(`click ${app.name}`)
              }
            })),
            ...webList.map((app) => ({
              name: app.name,
              shortName: app.shortName,
              color: app.color,
              logo: app.logo,
              enabled: true,
              clickHandler: () => {
                console.log('TEST', app.name)
                statusUpdateHandler(`click ${app.name}`)
              }
            }))
          ]
        }
      ],
      buttons: [],
      qrData
    }
  }

  private static async getIOSPairingAlert(
    qrData: string,
    statusUpdateHandler: any
  ): Promise<PairingAlertInfo> {
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
            clickHandler: () => {
              console.log('TEST', app.name)
              statusUpdateHandler(`click ${app.name}`)
            }
          }))
        },
        {
          title: 'Web Wallets',
          type: WalletType.DESKTOP,
          wallets: [
            ...webList.map((app) => ({
              name: app.name,
              shortName: app.shortName,
              color: app.color,
              logo: app.logo,
              enabled: true,
              clickHandler: () => {
                console.log('TEST', app.name)
                statusUpdateHandler(`click ${app.name}`)
              }
            }))
          ]
        }
      ],
      buttons: [],
      qrData
    }
  }

  private static async getAndroidPairingAlert(
    qrData: string,
    statusUpdateHandler: any
  ): Promise<PairingAlertInfo> {
    return {
      walletLists: [
        {
          title: 'Web Wallets',
          type: WalletType.WEB,
          wallets: [
            ...webList.map((app) => ({
              name: app.name,
              shortName: app.shortName,
              color: app.color,
              logo: app.logo,
              enabled: true,
              clickHandler: () => {
                console.log('TEST', app.name)
                statusUpdateHandler(`click ${app.name}`)
              }
            }))
          ]
        }
      ],
      buttons: [
        {
          text: 'Connect wallet',
          clickHandler: () => {
            window.open(getTzip10Link('tezos://', qrData), '_blank')
            statusUpdateHandler(`click android`)
          }
        }
      ],
      qrData
    }
  }
}
