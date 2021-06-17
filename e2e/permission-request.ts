var StaticServer = require('static-server')
var server1 = new StaticServer({
  rootPath: './examples/', // required, the root of the server file tree
  port: 8080, // required, the port to listen
  name: 'beacon' // optional, will set "X-Powered-by" HTTP header
})
var server2 = new StaticServer({
  rootPath: './examples/', // required, the root of the server file tree
  port: 8081, // required, the port to listen
  name: 'beacon' // optional, will set "X-Powered-by" HTTP header
})
server1.start(function () {
  console.log('Server1 listening to', server1.port)
  server2.start(function () {
    console.log('Server2 listening to', server2.port)
    rune2e()
  })
})

import { mkdirSync, rmdirSync } from 'fs'
import * as puppeteer from 'puppeteer'
const PuppeteerMassScreenshots = require('puppeteer-mass-screenshots')
// const clickButton = async (page, query, selector = 'button') => {
//   page.evaluate(
//     (input) => {
//       const elements = [...document.querySelectorAll(input.selector)]

//       // Either use .find or .filter, comment one of these
//       // find element with find
//       const targetElement = elements.find((e) => e.innerText === input.query)

//       // OR, find element with filter
//       // const targetElement = elements.filter(e => e.innerText.includes(query))[0];

//       // make sure the element exists, and only then click it
//       targetElement && targetElement.click()
//     },
//     { query, selector }
//   )
// }

const dAppURL = 'http://localhost:8080/dapp.html'
const walletURL = 'http://localhost:8081/wallet.html'

type BeaconPages = { dapp: puppeteer.Page; wallet: puppeteer.Page }

const sleep = async (time: number) => {
  return new Promise((resolve) => setTimeout(resolve, time))
}

const createPage = async (browser: puppeteer.Browser, url: string) => {
  const page = await browser.newPage()
  await page.setViewport({
    width: 960,
    height: 1080,
    deviceScaleFactor: 1
  })
  await page.goto(url)
  await page.waitForSelector('title')
  return page
}

const takeScreenshots = async (pages: BeaconPages, name: string) => {
  console.log('SCREENSHOT', name)
  const id = '' // Math.random().toString()
  await pages.dapp.screenshot({ path: `./e2e/output/screenshot-${name}-${id}-dapp.png` })
  await pages.wallet.screenshot({ path: `./e2e/output/screenshot-${name}-${id}-wallet.png` })
}

const rune2e = async () => {
  try {
    rmdirSync('./e2e/output', { recursive: true })
  } catch {}
  mkdirSync('./e2e/output/dapp', { recursive: true })
  mkdirSync('./e2e/output/wallet', { recursive: true })
  const browser = await puppeteer.launch()
  const context = browser.defaultBrowserContext()
  context.overridePermissions('http://localhost:8081', ['clipboard-read', 'clipboard-write'])

  console.log('started')

  const pages: BeaconPages = {
    dapp: await createPage(browser, dAppURL),
    wallet: await createPage(browser, walletURL)
  }

  const ssDapp = new PuppeteerMassScreenshots()
  const ssWallet = new PuppeteerMassScreenshots()

  await ssDapp.init(pages.dapp, './e2e/output/dapp')
  await ssWallet.init(pages.wallet, './e2e/output/wallet')

  console.log('pages-created')

  await ssDapp.start()
  await ssWallet.start()
  await takeScreenshots(pages, '1-init')

  await pages.dapp.click('#requestPermission')
  await sleep(1000)
  await takeScreenshots(pages, '2-popup')

  const newPagePromise = new Promise<puppeteer.Page>((x) =>
    browser.once('targetcreated', (target) => x(target.page()))
  ) // declare promise
  const desktopWallet = (
    await pages.dapp.evaluateHandle(
      `document.querySelector("[id^='beacon-alert-wrapper']").shadowRoot.querySelector("#wallet_kukai_web")`
    )
  ).asElement()
  if (desktopWallet) {
    await desktopWallet.click()
  }
  const pairingPage = await newPagePromise
  const pairingUrl = pairingPage.url()
  console.log('pairingUrl', pairingUrl)
  await pairingPage.close()

  await sleep(1000)

  await pages.wallet.type(
    '#hidden-input',
    pairingUrl.slice('https://wallet.kukai.app/?type=tzip10&data='.length)
  )

  await pages.wallet.click('#paste')
  await sleep(5000)

  await takeScreenshots(pages, '3-connected')
  //   await pages.dapp.waitForSelector('title')
  //   const connectButtonSelector =
  //     '#root > div > div.page-container.header-top-container > div > div.text-center.hidden.lg\\:flex.main-menu-container > div:nth-child(5) > button'

  //   await pageDapp.waitForSelector(connectButtonSelector)
  //   await pageDapp.click(connectButtonSelector)

  await ssDapp.stop()
  await ssWallet.stop()
  await browser.close()
  server1.stop()
  server2.stop()
}
