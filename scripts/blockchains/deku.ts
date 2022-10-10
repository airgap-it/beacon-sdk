import { App, DesktopApp, ExtensionApp, WebApp } from 'packages/beacon-types/src/types/ui'

export enum NetworkType {
  BETANET = 'betanet'
}

export const dekuExtensionList: ExtensionApp[] = [
  {
    key: 'spire_chrome',
    id: 'gpfndedineagiepkpinficbcbbgjoenn',
    name: 'Spire',
    shortName: 'Spire',
    color: '',
    logo: 'extension-spire.png',
    link: 'https://spirewallet.com/'
  },
  {
    key: 'temple_chrome',
    id: 'ookjlbkiijinhpmnjffcofjonbfbgaoc',
    name: 'Temple Wallet',
    shortName: 'Temple',
    color: '',
    logo: 'extension-temple.png',
    link: 'https://templewallet.com/'
  }
]

export const dekuWebList: WebApp[] = []

export const dekuDesktopList: DesktopApp[] = [
  {
    key: 'galleon_desktop',
    name: 'Galleon',
    shortName: 'Galleon',
    color: '',
    logo: 'desktop-galleon.png',
    deepLink: 'galleon://'
  },
  {
    key: 'umami_desktop',
    name: 'Umami',
    shortName: 'Umami',
    color: '',
    logo: 'desktop-umami.png',
    deepLink: 'umami://'
  }
]

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
    key: 'naan_ios',
    name: 'Naan Wallet',
    shortName: 'Naan',
    color: 'rgb(129, 100, 100)',
    logo: 'ios-naan.png',
    universalLink: 'https://naanwallet.com',
    deepLink: 'naan://'
  },
  {
    key: 'autonomy-app',
    name: 'Autonomy: Digital Art Wallet',
    shortName: 'Autonomy',
    color: '',
    logo: 'ios-autonomy.png',
    universalLink: 'https://autonomy.io/apps/tezos',
    deepLink: 'autonomy-tezos://'
  },
  {
    key: 'temple_ios',
    name: 'Temple Wallet',
    shortName: 'Temple',
    color: '',
    logo: 'ios-temple.png',
    universalLink: 'https://templewallet.com',
    deepLink: 'temple://'
  }
  // {
  //   name: 'Galleon',
  //   shortName: 'Galleon',
  //   color: '',
  //   logo: 'ios-galleon.png',
  //   universalLink: 'https://cryptonomic.tech',
  //   deepLink: 'galleon://'
  // }
]
