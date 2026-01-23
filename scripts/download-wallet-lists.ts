import * as path from 'path'
import { writeFile, mkdir } from 'fs/promises'
import * as https from 'https'

const GITHUB_RELEASES_BASE = 'https://github.com/airgap-it/beacon-wallet-list/releases/latest/download'
const BEACON_UI_DATA_DIR = path.join(process.cwd(), 'packages/beacon-ui/src/data')

async function downloadFile(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        if (response.headers.location) {
          return downloadFile(response.headers.location).then(resolve).catch(reject)
        }
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`HTTP ${response.statusCode}`))
      }
      let data = ''
      response.on('data', (chunk) => (data += chunk))
      response.on('end', () => resolve(data))
    }).on('error', reject)
  })
}

async function download() {
  try {
    await mkdir(BEACON_UI_DATA_DIR, { recursive: true })

    const files = ['tezos.json', 'substrate.json', 'tezos-sapling.json']

    for (const file of files) {
      console.log(`Downloading ${file}...`)
      const content = await downloadFile(`${GITHUB_RELEASES_BASE}/${file}`)
      await writeFile(path.join(BEACON_UI_DATA_DIR, file), content)
    }

    console.log('All wallet lists downloaded successfully')
  } catch (error) {
    console.error('Download failed:', error)
    process.exit(1)
  }
}

download()
