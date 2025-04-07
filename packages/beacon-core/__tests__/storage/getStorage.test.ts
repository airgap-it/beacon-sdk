// __tests__/storage/getStorage.test.ts

import { getStorage } from '../../src/storage/getStorage'
import { ChromeStorage } from '../../src/storage/ChromeStorage'
import { LocalStorage } from '../../src/storage/LocalStorage'

describe('getStorage', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return a ChromeStorage instance when ChromeStorage is supported', async () => {
    jest.spyOn(ChromeStorage, 'isSupported').mockResolvedValue(true)
    jest.spyOn(LocalStorage, 'isSupported').mockResolvedValue(false)
    const storage = await getStorage()
    expect(storage).toBeInstanceOf(ChromeStorage)
  })

  it('should return a LocalStorage instance when ChromeStorage is not supported but LocalStorage is', async () => {
    jest.spyOn(ChromeStorage, 'isSupported').mockResolvedValue(false)
    jest.spyOn(LocalStorage, 'isSupported').mockResolvedValue(true)
    const storage = await getStorage()
    expect(storage).toBeInstanceOf(LocalStorage)
  })

  it('should throw an error when neither storage type is supported', async () => {
    jest.spyOn(ChromeStorage, 'isSupported').mockResolvedValue(false)
    jest.spyOn(LocalStorage, 'isSupported').mockResolvedValue(false)
    await expect(getStorage()).rejects.toThrow('no storage type supported')
  })
})
