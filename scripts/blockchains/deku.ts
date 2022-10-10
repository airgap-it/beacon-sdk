import { App, DesktopApp, ExtensionApp, WebApp } from 'packages/beacon-types/src/types/ui'

export const dekuExtensionList: ExtensionApp[] = []

export const dekuWebList: WebApp[] = []

export const dekuDesktopList: DesktopApp[] = []

export const dekuIosList: App[] = [
  {
    key: 'airgap_ios',
    name: 'AirGap Wallet',
    shortName: 'AirGap',
    color: 'rgb(4, 235, 204)',
    logo: 'ios-airgap.png',
    universalLink: 'https://wallet.airgap.it',
    deepLink: 'airgap-wallet://'
  },
  {
    key: 'nova_ios',
    name: 'Nova Wallet',
    shortName: 'Nova',
    color: '',
    logo: 'ios-nova.png',
    universalLink: 'https://novawallet.io',
    deepLink: 'nova://'
  },
  {
    key: 'fearless_ios',
    name: 'Fearless Wallet',
    shortName: 'fearless',
    color: '',
    logo: 'ios-fearless.png',
    universalLink: 'https://fearlesswallet.io',
    deepLink: 'fearless://'
  }
]
