import { Logger } from '../utils/Logger'
import { Storage } from '@airgap/beacon-types'
import { ChromeStorage } from './ChromeStorage'
import { LocalStorage } from './LocalStorage'

const logger = new Logger('STORAGE')

/**
 * Get a supported storage on this platform
 */
export const getStorage: () => Promise<Storage> = async (): Promise<Storage> => {
  if (await ChromeStorage.isSupported()) {
    logger.log('getStorage', 'USING CHROME STORAGE')

    return new ChromeStorage()
  } else if (await LocalStorage.isSupported()) {
    logger.log('getStorage', 'USING LOCAL STORAGE')

    return new LocalStorage()
  } else {
    throw new Error('no storage type supported')
  }
}
