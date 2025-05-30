// e2e/flow.spec.ts
import { test } from '@playwright/test'
import { spawn, ChildProcess } from 'child_process'
import fs from 'fs'
import path from 'path'

let server1: ChildProcess
let server2: ChildProcess

test.beforeAll(async () => {
  // Clean up any old screenshots
  const out = path.join(__dirname, 'output')
  fs.rmSync(out, { recursive: true, force: true })
  fs.mkdirSync(path.join(out, 'dapp'), { recursive: true })
  fs.mkdirSync(path.join(out, 'wallet'), { recursive: true })

  // Start two static‐file servers with http-server
  server1 = spawn('npx', ['http-server', 'examples', '-p', '8080'], { stdio: 'inherit' })
  server2 = spawn('npx', ['http-server', 'examples', '-p', '8081'], { stdio: 'inherit' })

  // Give them a moment to boot
  await new Promise((r) => setTimeout(r, 2000))
})

test.afterAll(() => {
  server1.kill()
  server2.kill()
})

test('full Beacon E2E flow', async ({ browser }) => {
  // Create two contexts (one for DApp, one for Wallet)
  const dappCtx = await browser.newContext()
  const walletCtx = await browser.newContext()

  // grant clipboard permissions to the wallet origin
  await walletCtx.grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: 'http://localhost:8081'
  })

  // Open pages
  const dapp = await dappCtx.newPage()
  const wallet = await walletCtx.newPage()
  await dapp.goto('http://localhost:8080/dapp.html')
  await wallet.goto('http://localhost:8081/wallet.html')

  // 1) Initial screenshots
  await dapp.screenshot({ path: 'e2e/output/dapp/screenshot-1-init-dapp.png' })
  await wallet.screenshot({ path: 'e2e/output/wallet/screenshot-1-init-wallet.png' })

  // 2) Trigger the permission request
  await dapp.click('#requestPermission')
  await dapp.waitForTimeout(1000)
  await dapp.screenshot({ path: 'e2e/output/dapp/screenshot-2-popup-dapp.png' })
  await wallet.screenshot({ path: 'e2e/output/wallet/screenshot-2-popup-wallet.png' })

  // 3) Click the “Kukai” wallet button in Beacon’s shadow DOM
  const handle = await dapp.evaluateHandle(() => {
    const wrapper = document.querySelector("[id^='beacon-alert-wrapper']") as HTMLElement
    return wrapper.shadowRoot?.querySelector('#wallet_kukai_web')
  })
  const btn = handle.asElement()
  if (!btn) throw new Error('Couldn’t find the Kukai button')

  // Wait for the popup window to open
  const [pairingPage] = await Promise.all([dapp.waitForEvent('popup'), btn.click()])
  await pairingPage.waitForLoadState()
  const pairingUrl = pairingPage.url()
  await pairingPage.close()

  // 4) Paste the pairing data into the wallet
  await dapp.waitForTimeout(1000)
  const prefix = 'https://wallet.kukai.app/?type=tzip10&data='.length
  const data = pairingUrl.slice(prefix)
  await wallet.fill('#hidden-input', data)
  await wallet.click('#paste')
  await wallet.waitForTimeout(5000)

  // 5) Final screenshots
  await dapp.screenshot({ path: 'e2e/output/dapp/screenshot-3-connected-dapp.png' })
  await wallet.screenshot({ path: 'e2e/output/wallet/screenshot-3-connected-wallet.png' })
})
