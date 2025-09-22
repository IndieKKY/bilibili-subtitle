import {storageWeb} from './storage_web'
import {storageChromeClient} from './storage_chrome_client'

export interface IStorage {
  setStore: (key: string, data?: string) => Promise<void>
  delStore: (key: string) => Promise<void>
  getStore: (key: string) => Promise<string | null | undefined>
  getStoreKeys: () => Promise<string[] | undefined>
}

export type StorageType = 'web' | 'chrome_client'

export const getStorage = (type: StorageType): IStorage => {
  switch (type) {
    case 'web':
      return storageWeb
    case 'chrome_client':
      return storageChromeClient
    default:
      throw new Error('unknown storage type')
  }
}
