import { ExtensionApp, DesktopApp, WebApp, App } from '@airgap/beacon-types'

export interface WalletLists {
  extensionList: ExtensionApp[]
  desktopList: DesktopApp[]
  webList: WebApp[]
  iOSList: App[]
}

/**
 * Loads and type-casts wallet lists from a registry JSON
 */
export function loadWalletLists(registry: any): WalletLists {
  return {
    extensionList: registry.extensionList as ExtensionApp[],
    desktopList: registry.desktopList as DesktopApp[],
    webList: registry.webList as WebApp[],
    iOSList: registry.iOSList as App[]
  }
}
