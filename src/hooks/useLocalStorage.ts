import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useAsyncEffect, useMemoizedFn} from 'ahooks/es'
import {cloneDeep, isEqual} from 'lodash-es'
import {getStorage, IStorage, StorageType} from '../utils/storage'

const useLocalStorage = <T = any>(type: StorageType | IStorage, key: string, data: T, onLoad: (data?: T) => void) => {
  const onLoadMemorized = useMemoizedFn(onLoad)
  const storage = useMemo(() => typeof type === 'string'?getStorage(type):type, [type])
  const {setStore, getStore} = storage
  const [ready, setReady] = useState(false)
  const prevData = useRef<T>()

  // 存数据
  useEffect(() => {
    if (ready) {
      if (!isEqual(prevData.current, data)) {
        prevData.current = cloneDeep(data)
        setStore(key, JSON.stringify(data)).catch(console.error)
        console.debug(`[local][${key}]存数据: `, data)
      } else {
        console.debug(`[local][${key}]数据未变化，存数据取消!`)
      }
    }
  }, [data, key, ready, setStore])

  // 刷新数据
  const refresh = useCallback(async () => {
    const s = await getStore(key)
    let savedData: T | undefined
    if (s) {
      try {
        savedData = JSON.parse(s)
      } catch (e) {
        console.error(`[local][${key}]格式解析异常: `, s)
      }
    }
    prevData.current = cloneDeep(savedData)
    onLoadMemorized(savedData)
    console.debug(`[local][${key}]读数据: `, savedData)
  }, [onLoadMemorized, getStore, key])

  // 读数据
  useAsyncEffect(async () => {
    await refresh()
    // 读取完毕
    setReady(true)
  }, [refresh])

  return {ready, refresh}
}

export default useLocalStorage
