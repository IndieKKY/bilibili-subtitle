import {IStorage} from './storage'

/**
 * 存储: chrome extension client
 * 需要配合background.js使用
 */
export default class StorageChromeClient implements IStorage {
  async setStore(key: string, data?: string) {
    if (data) {
      await chrome.runtime.sendMessage({
        type: 'syncSet',
        items: {
          [key]: data,
        }
      })
    } else {
      await chrome.runtime.sendMessage({
        type: 'syncRemove',
        keys: key
      })
    }
  }

  async delStore(key: string) {
    await chrome.runtime.sendMessage({
      type: 'syncRemove',
      keys: key
    })
  }

  async getStore(key: string): Promise<string | null | undefined> {
    const resultMap = await chrome.runtime.sendMessage({
      type: 'syncGet',
      keys: [key]
    })
    return resultMap?.[key]
  }

  async getStoreKeys() {
    return undefined
  }
}

export const storageChromeClient = new StorageChromeClient()
