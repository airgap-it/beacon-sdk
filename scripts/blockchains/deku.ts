import { App, DesktopApp, ExtensionApp, WebApp } from 'packages/beacon-types/src/types/ui'

export enum NetworkType {
  BETANET = 'betanet'
}

export const dekuExtensionList: ExtensionApp[] = [
  {
    key: 'temple_chrome',
    id: 'kbabebbjkdokcajfjkeblfnimbiicooc',
    name: 'Temple Wallet',
    shortName: 'Temple',
    color: '',
    logo: 'extension-temple.png',
    link: 'https://templewallet.com/'
  }
]

export const dekuWebList: WebApp[] = []

export const dekuDesktopList: DesktopApp[] = []

export const dekuIosList: App[] = []
