import { Browser, test } from '@playwright/test'
import { spawn, ChildProcess } from 'child_process'
import fs from 'fs'
import path from 'path'
import { pairWithBeaconWallet } from './utils'

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

test('should pair with example wallet', async ({ browser }) => {
  await pairWithBeaconWallet(browser)
})

test('should send 1 mutez', async ({ browser }) => {
  const [dapp] = await pairWithBeaconWallet(browser)

  // #sendToSelf
  await dapp.click('#sendToSelf')

  await dapp.waitForSelector('p.toast-label', { state: 'visible', timeout: 5_000 })
  await dapp.waitForSelector('div:has-text("Aborted")', { state: 'visible', timeout: 5_000 })
})

test('should send 1 mutez on second tab', async ({ browser }) => {
  const [_dapp, dappCtx] = await pairWithBeaconWallet(browser)
  const dapp2 = await dappCtx.newPage()
  await dapp2.goto('http://localhost:1234/dapp.html')

  // #sendToSelf
  await dapp2.click('#sendToSelf')

  await dapp2.waitForSelector('p.toast-label', { state: 'visible', timeout: 5_000 })
  await dapp2.waitForSelector('div:has-text("Aborted")', { state: 'visible', timeout: 5_000 })
})

test('should send 1 mutez on both tabs', async ({ browser }) => {
  const [dapp, dappCtx] = await pairWithBeaconWallet(browser)
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
