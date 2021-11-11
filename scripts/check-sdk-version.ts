import { readFileSync } from 'fs'
import { SDK_VERSION } from '../packages/beacon-core/src/constants'

const lernaJson = './lerna.json'

const lernaJsonContent = JSON.parse(readFileSync(lernaJson, 'utf-8'))

if (lernaJsonContent.version !== SDK_VERSION) {
  throw new Error(
    `Version in lerna.json (${lernaJsonContent.version}) does not match SDK Version (${SDK_VERSION})`
  )
}
