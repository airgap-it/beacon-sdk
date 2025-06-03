import { test, expect, Page, BrowserContext } from '@playwright/test'
import { spawn, ChildProcess } from 'child_process'
import fs from 'fs'
import path from 'path'
import { pairWithBeaconWallet } from './utils'

let server1: ChildProcess
let server2: ChildProcess

let dapp: Page = {} as unknown as Page
let dappCtx: BrowserContext = {} as unknown as BrowserContext
let wallet: Page = {} as unknown as Page
let walletCtx: BrowserContext = {} as unknown as BrowserContext

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

test.beforeEach(async ({ browser }) => {
  const ctx = await pairWithBeaconWallet(browser)
  dapp = ctx[0]
  dappCtx = ctx[1]
  wallet = ctx[2]
  walletCtx = ctx[3]
})

test.afterEach(async () => {
  await Promise.all([dappCtx.close(), walletCtx.close()])
})

test('should load activeAccount on page reload', async () => {
  await dapp.evaluate(() => {
    return window.location.reload()
  })
  await expect(dapp.locator('#activeAccount')).toHaveText('tz1RAf7CZDoa5Z94RdE2VMwfrRWeyiNAXTrw', {
    timeout: 5_000
  })
  const activeAccount = await dapp.evaluate(() => {
    return window.localStorage.getItem('beacon:active-account')
  })
  expect(activeAccount).not.toBe('undefined')
})

test('should send 1 mutez', async () => {
  // #sendToSelf
  await dapp.click('#sendToSelf')

  await dapp.waitForSelector('p.toast-label', { state: 'visible', timeout: 5_000 })
  await dapp.waitForSelector('div:has-text("Aborted")', { state: 'visible', timeout: 5_000 })

  await dappCtx.close()
})

test('should send 1 mutez on second tab', async () => {
  const dapp2 = await dappCtx.newPage()
  await dapp2.goto('http://localhost:1234/dapp.html')

  await expect(dapp2.locator('#activeAccount')).toHaveText('tz1RAf7CZDoa5Z94RdE2VMwfrRWeyiNAXTrw', {
    timeout: 5_000
  })

  // #sendToSelf
  await dapp2.click('#sendToSelf')

  await dapp2.waitForSelector('p.toast-label', { state: 'visible', timeout: 5_000 })
  await dapp2.waitForSelector('div:has-text("Aborted")', { state: 'visible', timeout: 5_000 })
})

test('should send 1 mutez on both tabs', async () => {
  const dapp2 = await dappCtx.newPage()
  await dapp2.goto('http://localhost:1234/dapp.html')

  // #sendToSelf
  await dapp.click('#sendToSelf')
  await dapp2.click('#sendToSelf')

  const step1 = async () => {
    await dapp.waitForSelector('p.toast-label', { state: 'visible', timeout: 5_000 })
    await dapp.waitForSelector('div:has-text("Aborted")', { state: 'visible', timeout: 5_000 })
  }

  const step2 = async () => {
    await dapp2.waitForSelector('p.toast-label', { state: 'visible', timeout: 5_000 })
    await dapp2.waitForSelector('div:has-text("Aborted")', { state: 'visible', timeout: 5_000 })
  }

  await Promise.all([step1, step2])
})

test('should disconnect on both tabs', async () => {
  const dapp2 = await dappCtx.newPage()
  await dapp2.goto('http://localhost:1234/dapp.html')

  await dapp.click('#disconnect')

  await expect(dapp.locator('#activeAccount')).toHaveText('', { timeout: 5_000 })
  await expect(dapp2.locator('#activeAccount')).toHaveText('', { timeout: 5_000 })

  const activeAccount = await dapp.evaluate(() => {
    return window.localStorage.getItem('beacon:active-account')
  })

  expect(activeAccount).toBe('undefined')
})

test('should clearActiveAccount on both tabs', async () => {
  const dapp2 = await dappCtx.newPage()
  await dapp2.goto('http://localhost:1234/dapp.html')

  await dapp.click('#clearActiveAccount')

  await expect(dapp.locator('#activeAccount')).toHaveText('', { timeout: 5_000 })
  await expect(dapp2.locator('#activeAccount')).toHaveText('', { timeout: 5_000 })

  const activeAccount = await dapp.evaluate(() => {
    return window.localStorage.getItem('beacon:active-account')
  })

  expect(activeAccount).toBe('undefined')
})
