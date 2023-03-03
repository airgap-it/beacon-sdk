export interface Wallet {
  id: string
  key: string
  name: string
  image: string
  description: string
  type: string
  link: string
  supportedInteractionStandards?: string[] // 'wallet_connect' or 'beacon'
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
  supportedInteractionStandards?: string[] // 'wallet_connect' or 'beacon',
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

export function arrangeTop4(
  arr: MergedWallet[],
  id1: string,
  id2: string,
  id3: string,
  id4: string
): MergedWallet[] {
  const idsToMoveToFront = [id1, id2, id3, id4]
  const itemsToMoveToFront = []
  const itemsToSortByName = []

  for (let item of arr) {
    if (idsToMoveToFront.includes(item.key)) {
      itemsToMoveToFront[idsToMoveToFront.indexOf(item.key)] = item
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
