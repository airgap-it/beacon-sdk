import { readFileSync } from 'fs'
import { SDK_VERSION } from '../src/constants'

const packageJson = './package.json'
const packageLockJson = './package-lock.json'

const packageJsonContent = JSON.parse(readFileSync(packageJson, 'utf-8'))
const packageLockJsonContent = JSON.parse(readFileSync(packageLockJson, 'utf-8'))

if (SDK_VERSION !== packageJsonContent.version || SDK_VERSION === packageLockJsonContent.version) {
  throw new Error('Beacon Version Mismatch!')
}
