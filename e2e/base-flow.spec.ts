// e2e/flow.spec.ts
import { test, expect } from '@playwright/test'
import { spawn, ChildProcess } from 'child_process'
import fs from 'fs'
import path from 'path'

let server1: ChildProcess
let server2: ChildProcess

test.beforeAll(async () => {
  const out = path.join(__dirname, 'output')
  fs.rmSync(out, { recursive: true, force: true })
  fs.mkdirSync(path.join(out, 'dapp'), { recursive: true })
  fs.mkdirSync(path.join(out, 'wallet'), { recursive: true })

  // use http-server (it lets us pass the dir as the first arg)
  server1 = spawn('npx', ['http-server', 'examples', '-p', '1234'], { stdio: 'inherit' })
  server2 = spawn('npx', ['http-server', 'examples', '-p', '4321'], { stdio: 'inherit' })
  await new Promise((r) => setTimeout(r, 2000))
})

test.afterAll(() => {
  server1.kill()
  server2.kill()
})

test('should open Kukai Web', async ({ browser }) => {
  // --- setup contexts + pages ---
  const dappCtx = await browser.newContext()

  const dapp = await dappCtx.newPage()
  await dapp.goto('http://localhost:1234/dapp.html')

  // --- trigger the Beacon pairing alert ---
  await dapp.click('#requestPermission')
  ;(await dapp.waitForSelector('div.alert-wrapper-show', {
    state: 'visible',
    timeout: 5000
  })) as unknown as HTMLElement

  await dapp.click('h3:has-text("Kukai")')
  ;(await dapp.waitForSelector('div.info-wrapper', {
    state: 'visible',
    timeout: 5000
  })) as unknown as HTMLElement
  ;(await dapp.waitForSelector('div.qr-wrapper', {
    state: 'visible',
    timeout: 5000
  })) as unknown as HTMLElement

  await dapp.click('button:has-text("Use Browser")')

  const [walletPage] = await Promise.all([
    dapp.waitForEvent('popup'), // wait for window.open()
    dapp.click('button:has-text("Use Browser")')
  ])

  await walletPage.waitForLoadState('domcontentloaded')
  ;(await walletPage.waitForSelector('div.agreement-body', {
    state: 'visible',
    timeout: 5000
  })) as unknown as HTMLElement
})

test('should display AirGap QR code and copy pairing code to clipboard', async ({ browser }) => {
  // --- setup context + grant clipboard permissions ---
  const dappCtx = await browser.newContext()
  await dappCtx.grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: 'http://localhost:1234'
  })

  const dapp = await dappCtx.newPage()
  await dapp.goto('http://localhost:1234/dapp.html')

  // --- trigger the Beacon pairing alert ---
  await dapp.click('#requestPermission')
  await dapp.waitForSelector('div.alert-wrapper-show', { state: 'visible', timeout: 5_000 })

  // --- choose AirGap and wait for QR display ---
  await dapp.click('h3:has-text("AirGap")')
  await dapp.waitForSelector('div.qr-right', { state: 'visible', timeout: 5_000 })

  // --- click the QR element to copy the pairing code ---
  await dapp.click('div.qr-right')

  // --- read back from the clipboard in the page context ---
  const pairingCode = await dapp.evaluate(async () => {
    return await navigator.clipboard.readText()
  })

  expect(pairingCode).toBeTruthy()
})

test('should display Temple Wallet', async ({ browser }) => {
  // --- setup context + grant clipboard permissions ---
  const dappCtx = await browser.newContext()

  const dapp = await dappCtx.newPage()
  await dapp.goto('http://localhost:1234/dapp.html')

  // --- trigger the Beacon pairing alert ---
  await dapp.click('#requestPermission')
  await dapp.waitForSelector('div.alert-wrapper-show', { state: 'visible', timeout: 5_000 })

  await dapp.click('div.alert-footer')
  await dapp.waitForSelector('div.wallets-list-wrapper', { state: 'visible', timeout: 5_000 })

  await dapp.click('h3:has-text("Temple")')

  await dapp.waitForSelector('h3:has-text("Connect with Temple Browser Extension")', {
    state: 'visible',
    timeout: 5_000
  })
  ;(await dapp.waitForSelector('div.qr-wrapper', {
    state: 'visible',
    timeout: 5000
  })) as unknown as HTMLElement

  // TODO extension pairing??
})

test('should pair other with Beacon', async ({ browser }) => {
  // --- setup context + grant clipboard permissions ---
  const dappCtx = await browser.newContext()
  await dappCtx.grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: 'http://localhost:1234'
  })

  const dapp = await dappCtx.newPage()
  await dapp.goto('http://localhost:1234/dapp.html')

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

  expect(pairingCode).toBeTruthy()
})

test('should pair other with WalletConnect', async ({ browser }) => {
  // --- setup context + grant clipboard permissions ---
  const dappCtx = await browser.newContext()
  await dappCtx.grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: 'http://localhost:1234'
  })

  const dapp = await dappCtx.newPage()
  await dapp.goto('http://localhost:1234/dapp.html')

  // --- trigger the Beacon pairing alert ---
  await dapp.click('#requestPermission')
  await dapp.waitForSelector('div.alert-wrapper-show', { state: 'visible', timeout: 5_000 })

  // --- choose AirGap and wait for QR display ---
  await dapp.click('div.alert-footer')
  await dapp.click('button:has-text("Show QR code")')
  await dapp.waitForSelector('span.pair-other-info', { state: 'visible', timeout: 5_000 })

  await dapp.click('button:has-text("WalletConnect")')

  await dapp.waitForSelector('div.qr-right', { state: 'visible', timeout: 5_000 })

  // --- click the QR element to copy the pairing code ---
  await dapp.click('div.qr-right')

  // --- read back from the clipboard in the page context ---
  const pairingCode = await dapp.evaluate(async () => {
    return await navigator.clipboard.readText()
  })

  expect(pairingCode).toBeTruthy()
})

test('should close the pairing alert', async ({ browser }) => {
  // --- setup context + grant clipboard permissions ---
  const dappCtx = await browser.newContext()
  await dappCtx.grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: 'http://localhost:1234'
  })

  const dapp = await dappCtx.newPage()
  await dapp.goto('http://localhost:1234/dapp.html')

  // --- trigger the Beacon pairing alert ---
  await dapp.click('#requestPermission')
  await dapp.waitForSelector('div.alert-wrapper-show', { state: 'visible', timeout: 5_000 })

  await dapp.locator('div.alert-button-icon').nth(0).click()

  await dapp.waitForSelector('div.alert-wrapper-show', { state: 'detached', timeout: 5_000 })
})
