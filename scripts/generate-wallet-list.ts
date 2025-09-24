import * as path from 'path'
import { readFile, writeFile, readdir } from 'node:fs/promises'

const resizeImg = require('resize-img')

const PKG_DIR = path.join(__dirname, '../')
const REGISTRY_DIR = path.join(PKG_DIR, 'assets', 'logos')
const WALLET_LISTS_DIR = path.join(PKG_DIR, 'wallet-lists')

const processLogo = async (logoFile: string): Promise<string | undefined> => {
  try {
    if (!logoFile || logoFile.startsWith('data:')) {
      return logoFile
    }

    const ext = path.extname(logoFile).replace('.', '') || 'png'
    if (!ext) {
      return logoFile
    }

    const imgBuffer = await readFile(path.join(REGISTRY_DIR, logoFile))

    let resizedBuffer = imgBuffer
    if (ext === 'png' && imgBuffer.length > 25000) {
      resizedBuffer = await resizeImg(imgBuffer, {
        width: 256,
        height: 256
      })
    }

    const base64 = resizedBuffer.toString('base64')
    const mimeType = ext === 'svg' ? 'svg+xml' : ext
    return `data:image/${mimeType};base64,${base64}`
  } catch (error) {
    console.warn(`Failed to process logo ${logoFile}:`, error)
    return logoFile
  }
}

const updateWalletListLogos = async (filename: string) => {
  const filePath = path.join(WALLET_LISTS_DIR, filename)
  
  try {
    const content = await readFile(filePath, 'utf-8')
    const walletList = JSON.parse(content)
    
    const processWalletArray = async (wallets: any[]) => {
      if (!Array.isArray(wallets)) return wallets
      
      return Promise.all(
        wallets.map(async (wallet) => {
          if (wallet.logo && !wallet.logo.startsWith('data:')) {
            wallet.logo = await processLogo(wallet.logo)
          }
          return wallet
        })
      )
    }
    
    if (walletList.extensionList) {
      walletList.extensionList = await processWalletArray(walletList.extensionList)
    }
    
    if (walletList.desktopList) {
      walletList.desktopList = await processWalletArray(walletList.desktopList)
    }
    
    if (walletList.webList) {
      walletList.webList = await processWalletArray(walletList.webList)
    }
    
    if (walletList.iOSList) {
      walletList.iOSList = await processWalletArray(walletList.iOSList)
    }
    
    await writeFile(filePath, JSON.stringify(walletList, null, 2))
    console.log(`Updated logos in ${filename}`)
  } catch (error) {
    console.error(`Failed to update ${filename}:`, error)
  }
}

;(async () => {
  try {
    const files = await readdir(WALLET_LISTS_DIR)
    const jsonFiles = files.filter(f => f.endsWith('.json'))
    
    for (const file of jsonFiles) {
      await updateWalletListLogos(file)
    }
    
    console.log('Logo processing complete')
  } catch (error) {
    console.error('Error processing wallet lists:', error)
    process.exit(1)
  }
})()