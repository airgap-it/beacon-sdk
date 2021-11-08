import { Serializer } from '@airgap/beacon-core'
import {
  ExtensionMessage,
  ExtensionMessageTarget,
  NetworkType,
  P2PPairingRequest,
  PostMessagePairingRequest
} from '@airgap/beacon-types'
import { windowRef } from '@airgap/beacon-core'
import { getTzip10Link } from '../../utils/get-tzip10-link'
import { isAndroid, isIOS } from '../../utils/platform'
import { PostMessageTransport } from '../../transports/PostMessageTransport'
import { desktopList, extensionList, iOSList, webList } from './wallet-lists'
import { availableTransports } from '../../utils/available-transports'

const serializer = new Serializer()

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
  key: string
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
    [NetworkType.FLORENCENET]?: string
    [NetworkType.GRANADANET]?: string
    [NetworkType.HANGZHOUNET]?: string
    [NetworkType.CUSTOM]?: string
  }
}

export interface DesktopApp extends AppBase {
  deepLink: string
}

export interface App extends AppBase {
  universalLink: string
  deepLink?: string
}

export interface PairingAlertWallet {
  key: string
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
}

export type StatusUpdateHandler = (
  walletType: WalletType,
  app?: PairingAlertWallet,
  keepOpen?: boolean
) => void

/**
 * @internalapi
 *
 */
export class Pairing {
  public static async getPlatfrom(): Promise<Platform> {
    return isAndroid(window) ? Platform.ANDROID : isIOS(window) ? Platform.IOS : Platform.DESKTOP
  }

  public static async getPairingInfo(
    pairingPayload: {
      p2pSyncCode: () => Promise<P2PPairingRequest>
      postmessageSyncCode: () => Promise<PostMessagePairingRequest>
      preferredNetwork: NetworkType
    },
    statusUpdateHandler: StatusUpdateHandler,
    mobileWalletHandler: (pairingCode: string) => Promise<void>,
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
          mobileWalletHandler,
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
    pairingCode: () => Promise<P2PPairingRequest>,
    statusUpdateHandler: StatusUpdateHandler,
    postmessageSyncCode: () => Promise<PostMessagePairingRequest>,
    mobileWalletHandler: (pairingCode: string) => Promise<void>,
    network: NetworkType
  ): Promise<PairingAlertInfo> {
    const availableExtensions = await PostMessageTransport.getAvailableExtensions()

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
                key: ext?.key ?? app.id,
                name: app.name ?? ext?.name,
                logo: app.iconUrl ?? ext?.logo,
                shortName: app.shortName ?? ext?.shortName,
                color: app.color ?? ext?.color,
                enabled: true,
                async clickHandler(): Promise<void> {
                  if (postmessageSyncCode) {
                    const postmessageCode = await serializer.serialize(await postmessageSyncCode())
                    const message: ExtensionMessage<string> = {
                      target: ExtensionMessageTarget.EXTENSION,
                      payload: postmessageCode,
                      targetId: app.id
                    }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    windowRef.postMessage(message as any, windowRef.location.origin)
                  }
                  statusUpdateHandler(WalletType.EXTENSION, this)
                }
              }
            }),
            ...extensionList
              .filter((app) => defaultExtensions.some((extId) => extId === app.id))
              .map((app) => ({
                key: app.key,
                name: app.name,
                shortName: app.shortName,
                color: app.color,
                logo: app.logo,
                enabled: false,
                clickHandler: (): void => {
                  // Don't do anything
                }
              }))
          ].sort((a, b) => a.key.localeCompare(b.key))
        },
        {
          title: 'Desktop & Web Wallets',
          type: WalletType.DESKTOP,
          wallets: [
            ...desktopList.map((app) => ({
              key: app.key,
              name: app.name,
              shortName: app.shortName,
              color: app.color,
              logo: app.logo,
              enabled: true,
              async clickHandler(): Promise<void> {
                const code = await serializer.serialize(await pairingCode())
                const link = getTzip10Link(app.deepLink, code)
                window.open(link, '_blank')
                statusUpdateHandler(WalletType.DESKTOP, this, true)
              }
            })),
            ...(await Pairing.getWebList(pairingCode, statusUpdateHandler, network))
          ].sort((a, b) => a.key.localeCompare(b.key))
        },
        {
          title: 'Mobile Wallets',
          type: WalletType.IOS,
          wallets: [
            ...iOSList.map((app) => ({
              key: app.key,
              name: app.name,
              shortName: app.shortName,
              color: app.color,
              logo: app.logo,
              enabled: true,
              async clickHandler(): Promise<void> {
                const code = await serializer.serialize(await pairingCode())
                mobileWalletHandler(code)
                statusUpdateHandler(WalletType.IOS, this, true)
              }
            }))
          ].sort((a, b) => a.key.localeCompare(b.key))
        }
      ],
      buttons: []
    }
  }

  private static async getIOSPairingAlert(
    pairingCode: () => Promise<P2PPairingRequest>,
    statusUpdateHandler: StatusUpdateHandler,
    network: NetworkType
  ): Promise<PairingAlertInfo> {
    return {
      walletLists: [
        {
          title: 'Mobile Wallets',
          type: WalletType.IOS,
          wallets: iOSList
            .map((app) => ({
              key: app.key,
              name: app.name,
              shortName: app.shortName,
              color: app.color,
              logo: app.logo,
              enabled: true,
              async clickHandler(): Promise<void> {
                const code = await serializer.serialize(await pairingCode())
                const link = getTzip10Link(app.deepLink ?? app.universalLink, code)

                // iOS does not trigger deeplinks with `window.open(...)`. The only way is using a normal link. So we have to work around that.
                const a = document.createElement('a')
                a.setAttribute('href', link)
                a.dispatchEvent(
                  new MouseEvent('click', { view: window, bubbles: true, cancelable: true })
                )

                statusUpdateHandler(WalletType.IOS, this, true)
              }
            }))
            .sort((a, b) => a.key.localeCompare(b.key))
        },
        {
          title: 'Web Wallets',
          type: WalletType.WEB,
          wallets: [
            ...(await Pairing.getWebList(pairingCode, statusUpdateHandler, network))
          ].sort((a, b) => a.key.localeCompare(b.key))
        }
      ],
      buttons: []
    }
  }

  private static async getAndroidPairingAlert(
    pairingCode: () => Promise<P2PPairingRequest>,
    statusUpdateHandler: StatusUpdateHandler,
    network: NetworkType
  ): Promise<PairingAlertInfo> {
    return {
      walletLists: [
        {
          title: 'Web Wallets',
          type: WalletType.WEB,
          wallets: [
            ...(await Pairing.getWebList(pairingCode, statusUpdateHandler, network))
          ].sort((a, b) => a.key.localeCompare(b.key))
        }
      ],
      buttons: [
        {
          title: 'Mobile Wallets',
          text: 'Connect Wallet',
          clickHandler: async (): Promise<void> => {
            const code = await serializer.serialize(await pairingCode())
            const qrLink = getTzip10Link('tezos://', code)
            window.open(qrLink, '_blank')
            statusUpdateHandler(WalletType.ANDROID)
          }
        }
      ]
    }
  }

  private static async getWebList(
    pairingCode: () => Promise<P2PPairingRequest>,
    statusUpdateHandler: StatusUpdateHandler,
    network: NetworkType
  ): Promise<PairingAlertWallet[]> {
    return webList
      .map((app) => ({
        key: app.key,
        name: app.name,
        shortName: app.shortName,
        color: app.color,
        logo: app.logo,
        enabled: true,
        clickHandler(): void {
          const newTab = window.open('', '_blank')

          pairingCode()
            .then((code) => serializer.serialize(code))
            .then((code) => {
              const link = getTzip10Link(app.links[network] ?? app.links[NetworkType.MAINNET], code)

              if (newTab) {
                newTab.location.href = link
              } else {
                window.open(link, '_blank')
              }

              statusUpdateHandler(WalletType.WEB, this, true)
            })
            .catch((error) => {
              // eslint-disable-next-line no-console
              console.error(error)
            })
        }
      }))
      .sort((a, b) => a.key.localeCompare(b.key))
  }
}
