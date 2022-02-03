import { App, DesktopApp, ExtensionApp, WebApp } from 'packages/beacon-ui/src/ui/alert/Pairing'
import { NetworkType } from 'packages/beacon-dapp/src'

export const tezosExtensionList: ExtensionApp[] = [
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

export const tezosWebList: WebApp[] = [
  {
    key: 'kukai_web',
    name: 'Kukai Wallet',
    shortName: 'Kukai',
    color: '',
    logo: 'web-kukai.png',
    links: {
      [NetworkType.MAINNET]: 'https://wallet.kukai.app',
      [NetworkType.DELPHINET]: 'https://testnet.kukai.app',
      [NetworkType.EDONET]: 'https://edonet.kukai.app',
      [NetworkType.FLORENCENET]: 'https://florencenet.kukai.app',
      [NetworkType.GRANADANET]: 'https://granadanet.kukai.app',
      [NetworkType.HANGZHOUNET]: 'https://hangzhounet.kukai.app',
      [NetworkType.IDIAZABALNET]: 'https://idiazabalnet.kukai.app'
    }
  }
]

export const tezosDesktopList: DesktopApp[] = [
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

export const tezosIosList: App[] = [
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
    name: 'Autonomy',
    shortName: 'Autonomy',
    color: '',
    logo: 'ios-autonomy.png',
    universalLink: 'https://au.bitmark.com/apps/tezos',
    deepLink: 'autonomy-tezos://'
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
