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
