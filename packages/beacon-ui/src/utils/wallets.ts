export interface Wallet {
  id: string
  key: string
  name: string
  image: string
  description: string
  type: string
  link: string
  supportedInteractionStandards?: ('wallet_connect' | 'beacon')[] // 'wallet_connect' or 'beacon'
  deepLink?: string
}

export interface MergedWallet {
  id: string
  firefoxId?: string
  key: string
  name: string
  image: string
  descriptions: string[]
  types: string[]
  link: string
  supportedInteractionStandards?: ('wallet_connect' | 'beacon')[] // 'wallet_connect' or 'beacon',
  tags?: string[]
  deepLink?: string
}

export function parseWallets(wallets: Wallet[]): Wallet[] {
  return wallets.map((wallet) => {
    const tokens = ['Web', 'web', 'App', 'app', 'Mobile', 'mobile']
    for (let i = 0; i < tokens.length; i++) {
      if (wallet.name.includes(tokens[i])) wallet.name = wallet.name.replace(tokens[i], '')
    }
    wallet.name = wallet.name.trim()
    return wallet
  })
}

export function arrangeTopWallets(arr: MergedWallet[], walletIds: string[]): MergedWallet[] {
  const idsToMoveToFront = walletIds.slice(0, 4)
  const itemsToMoveToFront = []
  const itemsToSortByName = []

  for (let item of arr) {
    let position: number | undefined = undefined
    idsToMoveToFront.some((id, index) => {
      const isWallet = item.key.startsWith(id)
      if (isWallet) {
        position = index
      }
      return isWallet
    })

    if (typeof position !== 'undefined') {
      itemsToMoveToFront[position] = item
    } else {
      itemsToSortByName.push(item)
    }
  }

  itemsToSortByName.sort((a, b) => {
    if (a.name < b.name) {
      return -1
    } else if (a.name > b.name) {
      return 1
    } else {
      return 0
    }
  })

  return [...itemsToMoveToFront, ...itemsToSortByName]
}

export function mergeWallets(wallets: Wallet[]): MergedWallet[] {
  const mergedWallets: MergedWallet[] = []
  for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i]
    const mergedWalletsNames = mergedWallets.map((_wallet) => _wallet.name)
    if (mergedWalletsNames.includes(wallet.name)) {
      const index = mergedWallets.findIndex((_wallet) => _wallet.name === wallet.name)
      if (index < 0) console.error('There should be a wallet')
      if (!mergedWallets[index].descriptions.includes(wallet.description))
        mergedWallets[index].descriptions.push(wallet.description)
      mergedWallets[index].types.push(wallet.type)
      mergedWallets[index].deepLink = wallet.deepLink
      mergedWallets[index].firefoxId = wallet.key.includes('firefox')
        ? wallet.id
        : mergedWallets[index].firefoxId
    } else {
      mergedWallets.push({
        ...wallet,
        descriptions: [wallet.description],
        types: [wallet.type],
        firefoxId: wallet.key.includes('firefox') ? wallet.id : undefined
      })
    }
  }
  return mergedWallets
}
