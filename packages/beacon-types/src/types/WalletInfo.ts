export interface WalletInfo {
  name: string
  type?: 'extension' | 'mobile' | 'web' | 'desktop'
  icon?: string
  deeplink?: string
}
