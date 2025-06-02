import { Browser } from '@playwright/test'

export const pairWithBeaconWallet = async (browser: Browser) => {
  // --- setup context + grant clipboard permissions ---
  const dappCtx = await browser.newContext()
  const walletCtx = await browser.newContext()

  await dappCtx.grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: 'http://localhost:1234'
  })
  await walletCtx.grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: 'http://localhost:1234'
  })

  const dapp = await dappCtx.newPage()
  const wallet = await walletCtx.newPage()

  await dapp.goto('http://localhost:1234/dapp.html')
  await wallet.goto('http://localhost:1234/wallet.html')

  // --- trigger the Beacon pairing alert ---
  await dapp.click('#requestPermission')
  await dapp.waitForSelector('div.alert-wrapper-show', { state: 'visible', timeout: 5_000 })

  // --- choose AirGap and wait for QR display ---
  await dapp.click('div.alert-footer')
  await dapp.click('button:has-text("Show QR code")')
  await dapp.waitForSelector('span.pair-other-info', { state: 'visible', timeout: 5_000 })

  await dapp.click('button:has-text("Beacon")')

  await dapp.waitForSelector('div.qr-right', { state: 'visible', timeout: 5_000 })

  // --- click the QR element to copy the pairing code ---
  await dapp.click('div.qr-right')

  // --- read back from the clipboard in the page context ---
  const pairingCode = await dapp.evaluate(async () => {
    return await navigator.clipboard.readText()
  })

  if (typeof pairingCode !== 'string') {
    console.error('Wrong pairing code:', pairingCode)
    throw new Error('QR code copy failed.')
  }

  await wallet.click('#paste')

  await dapp.waitForSelector('#activeAccount', { state: 'visible', timeout: 10_000 })

  return [dapp, wallet] as const
}
