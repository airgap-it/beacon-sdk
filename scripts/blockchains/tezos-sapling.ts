import { App, DesktopApp, ExtensionApp, WebApp } from 'packages/beacon-types/src/types/ui'
// import { NetworkType } from 'packages/beacon-types/src/types'
// TODO: Temporary build fix
export enum NetworkType {
  MAINNET = 'mainnet',
  GHOSTNET = 'ghostnet', // Long running testnet
  MONDAYNET = 'mondaynet', // Testnet, resets every monday
  DAILYNET = 'mondaynet', // Testnet, resets every day
  DELPHINET = 'delphinet',
  EDONET = 'edonet',
  FLORENCENET = 'florencenet',
  GRANADANET = 'granadanet',
  HANGZHOUNET = 'hangzhounet',
  ITHACANET = 'ithacanet',
  JAKARTANET = 'jakartanet',
  KATHMANDUNET = 'kathmandunet',
  LIMANET = 'limanet',
  MUMBAINET = 'mumbainet',
  CUSTOM = 'custom'
}

export const tezosSaplingExtensionList: ExtensionApp[] = []

export const tezosSaplingWebList: WebApp[] = []

export const tezosSaplingDesktopList: DesktopApp[] = []

export const tezosSaplingIosList: App[] = [
  {
    key: 'airgap_ios',
    name: 'AirGap Wallet',
    shortName: 'AirGap',
    color: 'rgb(4, 235, 204)',
    logo: 'ios-airgap.png',
    universalLink: 'https://wallet.airgap.it',
    deepLink: 'airgap-wallet://'
  }
]
