import { test, expect, Page, BrowserContext } from '@playwright/test'
import { pairWithBeaconWallet } from './utils'

let dapp: Page = {} as unknown as Page
let dappCtx: BrowserContext = {} as unknown as BrowserContext
let wallet: Page = {} as unknown as Page
let walletCtx: BrowserContext = {} as unknown as BrowserContext

test.beforeEach(async ({ browser }) => {
  ;[dapp, dappCtx, wallet, walletCtx] = await pairWithBeaconWallet(browser)
})

test.afterEach(async () => {
  await Promise.all([dappCtx.close(), walletCtx.close()])
})

test('should load activeAccount on page reload', async () => {
  await dapp.evaluate(() => {
    return window.location.reload()
  })
  await expect(dapp.locator('#activeAccount')).toHaveText('tz1RAf7CZDoa5Z94RdE2VMwfrRWeyiNAXTrw', {
    timeout: 30_000
  })
  const activeAccount = await dapp.evaluate(() => {
    return window.localStorage.getItem('beacon:active-account')
  })
  expect(activeAccount).not.toBe('undefined')
})

test('should send a request to sign', async () => {
  // #sendToSelf
  await dapp.click('#signPayloadRaw')

  await dapp.waitForSelector('p.toast-label', { state: 'visible', timeout: 30_000 })
  await dapp.waitForSelector('div:has-text("Aborted")', { state: 'visible', timeout: 30_000 })
})

test('should send 1 mutez', async () => {
  // #sendToSelf
  await dapp.click('#sendToSelf')

  await dapp.waitForSelector('p.toast-label', { state: 'visible', timeout: 30_000 })
  await dapp.waitForSelector('div:has-text("Aborted")', { state: 'visible', timeout: 30_000 })
})

test('should rate limit', async () => {
  await dapp.click('#sendToSelf')
  await dapp.click('#sendToSelf')

  await dapp.waitForSelector('div.alert-wrapper-show', { state: 'visible', timeout: 30_000 })

  await dapp.waitForSelector('h3:has-text("Error")')
  await dapp.waitForSelector('div:has-text("Rate")', {
    state: 'visible',
    timeout: 30_000
  })

  await dapp.click('button:has-text("Close")')

  await dapp.waitForSelector('div.alert-wrapper-show', { state: 'detached', timeout: 30_000 })
})

test('should send 1 mutez on second tab', async () => {
  const dapp2 = await dappCtx.newPage()
  await dapp2.goto('http://localhost:1234/dapp.html')

  await expect(dapp2.locator('#activeAccount')).toHaveText('tz1RAf7CZDoa5Z94RdE2VMwfrRWeyiNAXTrw', {
    timeout: 30_000
  })

  // #sendToSelf
  await dapp2.click('#sendToSelf')

  await dapp2.waitForSelector('p.toast-label', { state: 'visible', timeout: 30_000 })
  await dapp2.waitForSelector('div:has-text("Aborted")', { state: 'visible', timeout: 30_000 })
})

test('should send 1 mutez on both tabs', async () => {
  const dapp2 = await dappCtx.newPage()
  await dapp2.goto('http://localhost:1234/dapp.html')

  // #sendToSelf
  await dapp.click('#sendToSelf')
  await dapp2.click('#sendToSelf')

  const step1 = async () => {
    await dapp.waitForSelector('p.toast-label', { state: 'visible', timeout: 30_000 })
    await dapp.waitForSelector('div:has-text("Aborted")', { state: 'visible', timeout: 30_000 })
  }

  const step2 = async () => {
    await dapp2.waitForSelector('p.toast-label', { state: 'visible', timeout: 30_000 })
    await dapp2.waitForSelector('div:has-text("Aborted")', { state: 'visible', timeout: 30_000 })
  }

  await Promise.all([step1, step2])
})

test('should disconnect on both tabs', async () => {
  const dapp2 = await dappCtx.newPage()
  await dapp2.goto('http://localhost:1234/dapp.html')

  await dapp.click('#disconnect')

  await expect(dapp.locator('#activeAccount')).toHaveText('', { timeout: 30_000 })
  await expect(dapp2.locator('#activeAccount')).toHaveText('', { timeout: 30_000 })

  const activeAccount = await dapp.evaluate(() => {
    return window.localStorage.getItem('beacon:active-account')
  })

  expect(activeAccount).toBe('undefined')
})

test('should clearActiveAccount on both tabs', async () => {
  const dapp2 = await dappCtx.newPage()
  await dapp2.goto('http://localhost:1234/dapp.html')

  await dapp.click('#clearActiveAccount')

  await expect(dapp.locator('#activeAccount')).toHaveText('', { timeout: 30_000 })
  await expect(dapp2.locator('#activeAccount')).toHaveText('', { timeout: 30_000 })

  const activeAccount = await dapp.evaluate(() => {
    return window.localStorage.getItem('beacon:active-account')
  })

  expect(activeAccount).toBe('undefined')
})

test('should disconnect on tab1 and reconnect on tab2', async () => {
  const dapp2 = await dappCtx.newPage()
  await dapp2.goto('http://localhost:1234/dapp.html')

  await dapp.click('#disconnect')

  await expect(dapp.locator('#activeAccount')).toHaveText('', { timeout: 30_000 })
  await expect(dapp2.locator('#activeAccount')).toHaveText('', { timeout: 30_000 })

  let activeAccount = await dapp.evaluate(() => {
    return window.localStorage.getItem('beacon:active-account')
  })

  expect(activeAccount).toBe('undefined')

  await dapp2.click('#requestPermission')
  await dapp2.waitForSelector('div.alert-wrapper-show', { state: 'visible', timeout: 30_000 })

  // --- choose AirGap and wait for QR display ---
  await dapp2.click('div.alert-footer')
  await dapp2.click('button:has-text("Show QR code")')
  await dapp2.waitForSelector('span.pair-other-info', { state: 'visible', timeout: 30_000 })

  await dapp2.click('button:has-text("Beacon")')

  await dapp2.waitForSelector('div.qr-right', { state: 'visible', timeout: 30_000 })

  // --- click the QR element to copy the pairing code ---
  await dapp2.click('div.qr-right')

  // --- read back from the clipboard in the page context ---
  const pairingCode = await dapp2.evaluate(async () => {
    return await navigator.clipboard.readText()
  })

  expect(pairingCode).toBeTruthy()

  await wallet.click('#paste')

  await expect(dapp2.locator('#activeAccount')).toHaveText('tz1RAf7CZDoa5Z94RdE2VMwfrRWeyiNAXTrw', {
    timeout: 30_000
  })
  await expect(dapp.locator('#activeAccount')).toHaveText('tz1RAf7CZDoa5Z94RdE2VMwfrRWeyiNAXTrw', {
    timeout: 30_000
  })

  activeAccount = await dapp.evaluate(() => {
    return window.localStorage.getItem('beacon:active-account')
  })

  expect(activeAccount).not.toBe('undefined')

  // #sendToSelf
  await dapp.click('#sendToSelf')

  await dapp.waitForSelector('p.toast-label', { state: 'visible', timeout: 30_000 })
  await dapp.waitForSelector('div:has-text("Aborted")', { state: 'visible', timeout: 30_000 })
})

test('should disconnect on tab2 and reconnect on tab3', async () => {
  const dapp2 = await dappCtx.newPage()
  await dapp2.goto('http://localhost:1234/dapp.html')

  const dapp3 = await dappCtx.newPage()
  await dapp3.goto('http://localhost:1234/dapp.html')

  await dapp2.click('#disconnect')

  await expect(dapp.locator('#activeAccount')).toHaveText('', { timeout: 30_000 })
  await expect(dapp2.locator('#activeAccount')).toHaveText('', { timeout: 30_000 })
  await expect(dapp3.locator('#activeAccount')).toHaveText('', { timeout: 30_000 })

  let activeAccount = await dapp.evaluate(() => {
    return window.localStorage.getItem('beacon:active-account')
  })

  expect(activeAccount).toBe('undefined')

  await dapp3.click('#requestPermission')
  await dapp3.waitForSelector('div.alert-wrapper-show', { state: 'visible', timeout: 30_000 })

  // --- choose AirGap and wait for QR display ---
  await dapp3.click('div.alert-footer')
  await dapp3.click('button:has-text("Show QR code")')
  await dapp3.waitForSelector('span.pair-other-info', { state: 'visible', timeout: 30_000 })

  await dapp3.click('button:has-text("Beacon")')

  await dapp3.waitForSelector('div.qr-right', { state: 'visible', timeout: 30_000 })

  // --- click the QR element to copy the pairing code ---
  await dapp3.click('div.qr-right')

  // --- read back from the clipboard in the page context ---
  const pairingCode = await dapp3.evaluate(async () => {
    return await navigator.clipboard.readText()
  })

  expect(pairingCode).toBeTruthy()

  await wallet.click('#paste')

  await expect(dapp3.locator('#activeAccount')).toHaveText('tz1RAf7CZDoa5Z94RdE2VMwfrRWeyiNAXTrw', {
    timeout: 30_000
  })
  await expect(dapp2.locator('#activeAccount')).toHaveText('tz1RAf7CZDoa5Z94RdE2VMwfrRWeyiNAXTrw', {
    timeout: 30_000
  })
  await expect(dapp.locator('#activeAccount')).toHaveText('tz1RAf7CZDoa5Z94RdE2VMwfrRWeyiNAXTrw', {
    timeout: 30_000
  })

  activeAccount = await dapp.evaluate(() => {
    return window.localStorage.getItem('beacon:active-account')
  })

  expect(activeAccount).not.toBe('undefined')

  // #sendToSelf
  await dapp2.click('#sendToSelf')

  await dapp2.waitForSelector('p.toast-label', { state: 'visible', timeout: 30_000 })
  await dapp2.waitForSelector('div:has-text("Aborted")', { state: 'visible', timeout: 30_000 })
})

test('should send 1 mutez on 3G Network', async ({ browser }) => {
  await dappCtx.close()

  const [dapp, dappCtx1] = await pairWithBeaconWallet(browser, true)

  // #sendToSelf
  await dapp.click('#sendToSelf')

  await dapp.waitForSelector('p.toast-label', { state: 'visible', timeout: 30_000 })
  await dapp.waitForSelector('div:has-text("Aborted")', { state: 'visible', timeout: 30_000 })

  await dappCtx1.close()
})
