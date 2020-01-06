import { Logger } from '../utils/Logger'
import { FileStorage } from './FileStorage'
import { LocalStorage } from './LocalStorage'
import { Storage } from './Storage'
import { ChromeStorage } from './ChromeStorage'

const logger = new Logger('STORAGE')

export const getStorage: () => Promise<Storage> = async (): Promise<Storage> => {
  if (await ChromeStorage.isSupported()) {
    logger.log('getStorage', 'USING CHROME STORAGE')

    return new ChromeStorage()
  } else if (await LocalStorage.isSupported()) {
    logger.log('getStorage', 'USING LOCAL STORAGE')

    return new LocalStorage()
  } else if (await FileStorage.isSupported()) {
    logger.log('getStorage', 'USING FILE STORAGE')

    return new FileStorage()
  } else {
    throw new Error('no storage type supported')
  }
}
