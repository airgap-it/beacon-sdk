export interface Wallet {
  id: string
  name: string
  image: string
  description: string
  type: string
  link: string,
  supportedInteractionStandards?: string[] // 'wallet_connect' or 'beacon'
}

export interface MergedWallet {
  id: string
  name: string
  image: string
  descriptions: string[]
  types: string[]
  link: string,
  supportedInteractionStandards?: string[] // 'wallet_connect' or 'beacon'
}

export function parseWallets(wallets: Wallet[]): Wallet[] {
  return wallets.map((wallet) => {
    const tokens = ['Web', 'web', 'Wallet', 'wallet', 'App', 'app', 'Mobile', 'mobile']
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
    if (idsToMoveToFront.includes(item.id)) {
      itemsToMoveToFront[idsToMoveToFront.indexOf(item.id)] = item
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
      mergedWallets[index].descriptions.push(wallet.description)
      mergedWallets[index].types.push(wallet.type)
    } else {
      mergedWallets.push({
        ...wallet,
        descriptions: [wallet.description],
        types: [wallet.type]
      })
    }
  }
  return mergedWallets
}
