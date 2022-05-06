import * as path from 'path'
import * as fs from 'fs'
import {
  ExtensionApp,
  WebApp,
  App,
  AppBase,
  DesktopApp
} from '../packages/beacon-types/src/types/ui'

import {
  substrateExtensionList,
  substrateDesktopList,
  substrateWebList,
  substrateIosList
} from './blockchains/substrate'

import {
  tezosDesktopList,
  tezosExtensionList,
  tezosIosList,
  tezosWebList
} from './blockchains/tezos'

import {
  tezosSaplingDesktopList,
  tezosSaplingExtensionList,
  tezosSaplingIosList,
  tezosSaplingWebList
} from './blockchains/tezos-sapling'

const resizeImg = require('resize-img')

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

const generateForBlockchains = (
  packagePath: string,
  extensionList: ExtensionApp[],
  desktopList: DesktopApp[],
  webList: WebApp[],
  iosList: App[]
) => {
  const PKG_DIR = path.join(__dirname, '../')
  const REGISTRY_DIR = path.join(PKG_DIR, 'assets', 'logos')

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
    const ALERT_DEST_DIR = path.join(PKG_DIR, 'packages', packagePath, 'src', 'ui', 'alert')

    const extensionListWithInlinedLogo = await convert(extensionList)
    const desktopListWithInlinedLogo = await convert(desktopList)
    const webListWithInlinedLogo = await convert(webList)
    const iosListWithInlinedLogo = await convert(iosList)

    let out = `import { App, DesktopApp, ExtensionApp, WebApp } from '@airgap/beacon-types'`
    out += `
  
  `

    out += `export const extensionList: ExtensionApp[] = ${JSON.stringify(
      extensionListWithInlinedLogo,
      null,
      2
    )}`
    out += `
  
  `
    out += `export const desktopList: DesktopApp[] = ${JSON.stringify(
      desktopListWithInlinedLogo,
      null,
      2
    )}`
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
    const ALERT_DEST_DIR = path.join(PKG_DIR, 'packages', packagePath, 'src', 'ui', 'alert')

    const css = (await readFile(path.join(ALERT_SRC_DIR, 'alert.css'))).toString('utf-8')
    const pairCss = (await readFile(path.join(ALERT_SRC_DIR, 'alert-pair.css'))).toString('utf-8')

    const x = {
      default: {
        css: css
      },
      pair: {
        css: pairCss
      }
    }

    writeFile(
      path.join(ALERT_DEST_DIR, 'alert-templates.ts'),
      `export const alertTemplates = ${JSON.stringify(x)}`
    )
  }

  const createToast = async () => {
    const TOAST_SRC_DIR = path.join(PKG_DIR, 'assets', 'toast')
    const TOAST_DEST_DIR = path.join(PKG_DIR, 'packages', packagePath, 'src', 'ui', 'toast')

    const css = (await readFile(path.join(TOAST_SRC_DIR, 'toast.css'))).toString('utf-8')

    const x = {
      default: {
        css: css
      }
    }

    writeFile(
      path.join(TOAST_DEST_DIR, 'toast-templates.ts'),
      `export const toastTemplates = ${JSON.stringify(x)}`
    )
  }

  createLists()
  createAlert()
  createToast()
}

generateForBlockchains(
  'beacon-blockchain-tezos',
  tezosExtensionList,
  tezosDesktopList,
  tezosWebList,
  tezosIosList
)

generateForBlockchains(
  'beacon-blockchain-tezos-sapling',
  tezosSaplingExtensionList,
  tezosSaplingDesktopList,
  tezosSaplingWebList,
  tezosSaplingIosList
)

generateForBlockchains(
  'beacon-blockchain-substrate',
  substrateExtensionList,
  substrateDesktopList,
  substrateWebList,
  substrateIosList
)

generateForBlockchains(
  'beacon-ui',
  tezosExtensionList,
  tezosDesktopList,
  tezosWebList,
  tezosIosList
)
