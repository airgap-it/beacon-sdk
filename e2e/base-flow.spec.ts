// e2e/flow.spec.ts
import { test } from '@playwright/test'
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
  const walletCtx = await browser.newContext()
  await walletCtx.grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: 'http://localhost:4321'
  })

  const dapp = await dappCtx.newPage()
  // const wallet = await walletCtx.newPage()
  await dapp.goto('http://localhost:1234/dapp.html')
  // await wallet.goto('http://localhost:4321/wallet.html')

  // --- trigger the Beacon permission dialog ---
  await dapp.click('#requestPermission')
  ;(await dapp.waitForSelector('div.alert-wrapper-show', {
    state: 'visible', // other options: 'attached' (in DOM), 'hidden', 'detached'
    timeout: 5000 // adjust as needed (ms)
  })) as unknown as HTMLElement

  await dapp.click('h3:has-text("Kukai")')
  ;(await dapp.waitForSelector('div.info-wrapper', {
    state: 'visible', // other options: 'attached' (in DOM), 'hidden', 'detached'
    timeout: 5000 // adjust as needed (ms)
  })) as unknown as HTMLElement

  await dapp.click('button:has-text("Use Browser")')

  const [walletPage] = await Promise.all([
    dapp.waitForEvent('popup'), // wait for window.open()
    dapp.click('button:has-text("Use Browser")')
  ])

  // 2️⃣ Make sure it’s loaded
  await walletPage.waitForLoadState('domcontentloaded')
  ;(await walletPage.waitForSelector('div.agreement-body', {
    state: 'visible', // other options: 'attached' (in DOM), 'hidden', 'detached'
    timeout: 10_000 // adjust as needed (ms)
  })) as unknown as HTMLElement
})
