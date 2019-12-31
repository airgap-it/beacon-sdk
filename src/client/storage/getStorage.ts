import { Logger } from '../utils/Logger'
import { FileStorage } from './FileStorage'
import { LocalStorage } from './LocalStorage'
import { Storage } from './Storage'
import { ChromeStorage } from './ChromeStorage'

const logger = new Logger('STORAGE')

export const getStorage: () => Promise<Storage> = async (): Promise<Storage> => {
  const local: LocalStorage = new LocalStorage()
  const file: FileStorage = new FileStorage()
  const chrome: ChromeStorage = new ChromeStorage()
  if (await chrome.isSupported()) {
    logger.log('getStorage', 'USING CHROME STORAGE')

    return chrome
  } else if (await local.isSupported()) {
    logger.log('getStorage', 'USING LOCAL STORAGE')

    return local
  } else if (await file.isSupported()) {
    logger.log('getStorage', 'USING FILE STORAGE')

    return file
  } else {
    throw new Error('no storage type supported')
  }
}
