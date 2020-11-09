import * as path from 'path'
import * as fs from 'fs'
import { replaceInTemplate } from '../src/utils/replace-in-template'
import { getTzip10Link } from '../src/utils/get-tzip10-link'

export interface App {
  name: string
  shortName: string
  color: string
  logo: string
  universalLink: string
  deepLink?: string
}

export const webList: App[] = [
  {
    name: 'Kukai',
    shortName: 'Kukai',
    color: '',
    logo: 'web-kukai.png',
    universalLink: 'https://wallet.kukai.app'
  }
]

export const desktopList: App[] = [
  // {
  //   name: 'Galleon',
  //   shortName: 'Galleon',
  //   color: '',
  //   logo: 'desktop-galleon.png',
  //   universalLink: 'https://cryptonomic.tech'
  // }
]

export const iosList: App[] = [
  {
    name: 'AirGap Wallet',
    shortName: 'AirGap',
    color: 'rgb(4, 235, 204)',
    logo: 'ios-airgap.png',
    universalLink: 'https://wallet.airgap.it',
    deepLink: 'airgap-wallet://'
  }
  // {
  //   name: 'Magma',
  //   shortName: 'Magma',
  //   color: '',
  //   logo: 'ios-magma.png',
  //   universalLink: 'https://magmawallet.io',
  //   deepLink: 'magma://'
  // },
  // {
  //   name: 'Galleon',
  //   shortName: 'Galleon',
  //   color: '',
  //   logo: 'ios-galleon.png',
  //   universalLink: 'https://cryptonomic.tech',
  //   deepLink: 'galleon://'
  // }
]

const readFile = (path: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, res) => {
      if (err) {
        reject(err)
      }
      resolve(res)
    })
  })
}

function writeFile(path: string, data: any) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, (err: Error | null): void => {
      if (err) {
        reject(err)
      }
      resolve()
    })
  })
}

const PKG_DIR = path.join(__dirname, '../')
const REGISTRY_DIR = path.join(PKG_DIR, 'assets', 'logos')

const resizeImg = require('resize-img')

const convert = (list: App[]): Promise<string[]> => {
  return Promise.all(
    list.map(async (entry) => {
      const image = await resizeImg(await readFile(path.join(REGISTRY_DIR, entry.logo)), {
        width: 64,
        height: 64
      })

      const ext = path.extname(entry.logo).replace('.', '')
      const altTag = `Open in ${entry.name}`
      const logo = `data:image/${ext};base64,${image.toString('base64')}`
      const link = getTzip10Link(entry.deepLink ?? entry.universalLink, '{{payload}}')

      return `
      <a alt="${altTag}" href="${link}" target="_blank" class="beacon-selection__list">
        <div class="beacon-selection__name">${entry.name}</div>
        <div>
          <img class="beacon-selection__img" src="${logo}"/>
        </div>
      </a>
      `
    })
  )
}

const createAlert = async () => {
  const ALERT_SRC_DIR = path.join(PKG_DIR, 'assets', 'alert')
  const ALERT_DEST_DIR = path.join(PKG_DIR, 'src', 'alert')

  const css = (await readFile(path.join(ALERT_SRC_DIR, 'alert.css'))).toString('utf-8')
  const pairCss = (await readFile(path.join(ALERT_SRC_DIR, 'alert-pair.css'))).toString('utf-8')
  let containerHtml = (await readFile(path.join(ALERT_SRC_DIR, 'alert-container.html'))).toString(
    'utf-8'
  )
  let pairHtml = (await readFile(path.join(ALERT_SRC_DIR, 'alert-pair.html'))).toString('utf-8')
  let defaultHtml = (await readFile(path.join(ALERT_SRC_DIR, 'alert-default.html'))).toString(
    'utf-8'
  )

  /**
   * Replace the lists of the devices
   */
  pairHtml = replaceInTemplate(pairHtml, 'ios', (await convert(iosList)).join(''))
  pairHtml = replaceInTemplate(
    pairHtml,
    'android',
    `<a href="${getTzip10Link(
      'tezos://',
      '{{payload}}'
    )}" target="_blank"><button class="beacon-modal__button">Connect Wallet</button></a>`
  )
  pairHtml = replaceInTemplate(pairHtml, 'desktop', (await convert(desktopList)).join(''))
  pairHtml = replaceInTemplate(pairHtml, 'web', (await convert(webList)).join(''))

  const x = {
    container: containerHtml,
    default: {
      html: defaultHtml,
      css: css
    },
    pair: {
      html: pairHtml,
      css: pairCss
    }
  }

  writeFile(
    path.join(ALERT_DEST_DIR, 'alert-templates.ts'),
    `export const alertTemplates = ${JSON.stringify(x)}`
  )
}

createAlert()
