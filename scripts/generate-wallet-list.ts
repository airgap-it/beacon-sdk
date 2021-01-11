import * as path from 'path'
import * as fs from 'fs'
import { NetworkType } from '../src/types/beacon/NetworkType'
import { ExtensionApp, WebApp, App, AppBase } from '../src/alert/Pairing'

export const extensionList: ExtensionApp[] = [
  {
    id: 'ookjlbkiijinhpmnjffcofjonbfbgaoc',
    name: 'Thanos Wallet',
    shortName: 'Thanos',
    color: '',
    logo: 'extension-thanos.png',
    link: 'https://thanoswallet.com/'
  },
  {
    id: 'gpfndedineagiepkpinficbcbbgjoenn',
    name: 'Beacon Extension',
    shortName: 'Beacon',
    color: '',
    logo: 'extension-beacon.png',
    link: 'https://walletbeacon.io/'
  }
]

export const webList: WebApp[] = [
  {
    name: 'Kukai',
    shortName: 'Kukai',
    color: '',
    logo: 'web-kukai.png',
    links: {
      [NetworkType.MAINNET]: 'https://wallet.kukai.app',
      [NetworkType.DELPHINET]: 'https://testnet.kukai.app'
    }
  }
]

export const desktopList: App[] = [
  {
    name: 'Galleon',
    shortName: 'Galleon',
    color: '',
    logo: 'desktop-galleon.png',
    universalLink: 'https://cryptonomic.tech',
    deepLink: 'galleon://'
  }
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
      resolve(undefined)
    })
  })
}

const PKG_DIR = path.join(__dirname, '../')
const REGISTRY_DIR = path.join(PKG_DIR, 'assets', 'logos')

const resizeImg = require('resize-img')

const convert = <T extends AppBase>(list: T[]): Promise<T[]> => {
  return Promise.all(
    list.map(async (entry) => {
      const image = await resizeImg(await readFile(path.join(REGISTRY_DIR, entry.logo)), {
        width: 64,
        height: 64
      })

      const ext = path.extname(entry.logo).replace('.', '')

      entry.logo = `data:image/${ext};base64,${image.toString('base64')}`

      return entry
    })
  )
}

const createLists = async () => {
  const ALERT_DEST_DIR = path.join(PKG_DIR, 'src', 'alert')

  const extensionListWithInlinedLogo = await convert(extensionList)
  const desktopListWithInlinedLogo = await convert(desktopList)
  const webListWithInlinedLogo = await convert(webList)
  const iosListWithInlinedLogo = await convert(iosList)

  let out = `import { App, ExtensionApp, WebApp } from './Pairing'`
  out += `

`

  out += `export const extensionList: ExtensionApp[] = ${JSON.stringify(
    extensionListWithInlinedLogo,
    null,
    2
  )}`
  out += `

`
  out += `export const desktopList: App[] = ${JSON.stringify(desktopListWithInlinedLogo, null, 2)}`
  out += `

`
  out += `export const webList: WebApp[] = ${JSON.stringify(webListWithInlinedLogo, null, 2)}`
  out += `

`
  out += `export const iOSList: App[] = ${JSON.stringify(iosListWithInlinedLogo, null, 2)}`
  out += `

`

  writeFile(path.join(ALERT_DEST_DIR, 'wallet-lists.ts'), out)
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

createLists()
createAlert()
