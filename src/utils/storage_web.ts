import {IStorage} from './storage'

/**
 * 存储: web
 */
export default class StorageWeb implements IStorage {
  async setStore(key: string, data?: string) {
    if (data) {
      localStorage.setItem(key, data)
    } else {
      localStorage.removeItem(key)
    }
  }

  async delStore(key: string) {
    localStorage.removeItem(key)
  }

  async getStore(key: string): Promise<string | null | undefined> {
    return localStorage.getItem(key)
  }

  async getStoreKeys() {
    const result: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key) {
        result.push(key)
      }
    }
    return result
  }
}

export const storageWeb = new StorageWeb()
