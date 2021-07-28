import { readFileSync } from 'fs'
import { SDK_VERSION } from '../packages/beacon-core/src/constants'

const packageJson = './package.json'
const packageLockJson = './package-lock.json'

const packageJsonContent = JSON.parse(readFileSync(packageJson, 'utf-8'))
const packageLockJsonContent = JSON.parse(readFileSync(packageLockJson, 'utf-8'))

if (packageJsonContent.version !== packageLockJsonContent.version) {
  throw new Error(
    `Package (${packageJsonContent.version}) and Package Lock (${packageLockJsonContent.version}) version mismatch!`
  )
}

if (packageJsonContent.version !== SDK_VERSION) {
  throw new Error(
    `Package version (${packageJsonContent.version}) does not match SDK Version (${SDK_VERSION})`
  )
}
