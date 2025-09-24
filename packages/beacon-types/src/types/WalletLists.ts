import { App, DesktopApp, ExtensionApp, WebApp } from './ui'

export interface WalletLists {
  version: number
  extensionList: ExtensionApp[]
  desktopList: DesktopApp[]
  webList: WebApp[]
  iOSList: App[]
}