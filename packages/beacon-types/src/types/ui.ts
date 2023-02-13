import { NetworkType } from './beacon/NetworkType'

// export enum InteractionStandardType { // TODO JGD module not found
//   BEACON = 'beacon',
//   WALLET_CONNECT = 'wallet_connect'
// }

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
    [NetworkType.GHOSTNET]?: string
    [NetworkType.MONDAYNET]?: string
    [NetworkType.DAILYNET]?: string
    [NetworkType.DELPHINET]?: string
    [NetworkType.EDONET]?: string
    [NetworkType.FLORENCENET]?: string
    [NetworkType.GRANADANET]?: string
    [NetworkType.HANGZHOUNET]?: string
    [NetworkType.ITHACANET]?: string
    [NetworkType.JAKARTANET]?: string
    [NetworkType.KATHMANDUNET]?: string
    [NetworkType.LIMANET]?: string
    [NetworkType.MUMBAINET]?: string
    [NetworkType.CUSTOM]?: string
  }
}

export interface DesktopApp extends AppBase {
  deepLink: string
}

export interface App extends AppBase {
  universalLink: string
  supportedInteractionStandards?: any // TODO JGD convert to mandatory
  deepLink?: string
}
