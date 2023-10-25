import { desktopList, extensionList, iOSList, webList } from '../ui/alert/wallet-lists'
import { DesktopApp, App, ExtensionApp, WebApp } from '@mavrykdynamics/beacon-types'

// export interface PairingProps {}

// const Pairing: Component<PairingProps> = (props: PairingProps) => {
//   return (
//     <div>
//       <h1>Pairing Component</h1>
//     </div>
//   )
// }

// export default Pairing

/**
 * Initialize with tezos wallets for backwards compatibility
 */
let localDesktopList: DesktopApp[] = desktopList
let localExtensionList: ExtensionApp[] = extensionList
let localWebList: WebApp[] = webList
let localiOSList: App[] = iOSList

export const getDesktopList = (): DesktopApp[] => {
  return localDesktopList
}

export const setDesktopList = (desktopList: DesktopApp[]): void => {
  localDesktopList = desktopList
}

export const getExtensionList = (): ExtensionApp[] => {
  return localExtensionList
}

export const setExtensionList = (extensionList: ExtensionApp[]): void => {
  localExtensionList = extensionList
}

export const getWebList = (): WebApp[] => {
  return localWebList
}

export const setWebList = (webList: WebApp[]): void => {
  localWebList = webList
}

export const getiOSList = (): App[] => {
  return localiOSList
}

export const setiOSList = (iosList: App[]): void => {
  localiOSList = iosList
}

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
export class Pairing {}
