import {useAppDispatch, useAppSelector} from './redux'
import {useEffect, useMemo} from 'react'
import {setSearchResult, setSearchText, } from '../redux/envReducer'
import {Search} from '../utils/search'

interface Document {
  idx: number
  s: string // searchKeys
}

const useSearchService = () => {
  const dispatch = useAppDispatch()

  const envData = useAppSelector(state => state.env.envData)
  const data = useAppSelector(state => state.env.data)
  const searchText = useAppSelector(state => state.env.searchText)

  const {reset, search} = useMemo(() => Search('idx', 's', 256, {
    cnSearchEnabled: envData.cnSearchEnabled
  }), [envData.cnSearchEnabled]) // 搜索实例

  // reset search
  useEffect(() => {
    if (!envData.searchEnabled) {
      return
    }
    const startTime = Date.now()
    const docs: Document[] = []
    for (const item of data?.body??[]) {
      docs.push({
        idx: item.idx,
        s: item.content,
      })
    }
    reset(docs)
    // 清空搜索文本
    dispatch(setSearchText(''))
    // 日志
    const endTime = Date.now()
    console.debug(`[Search]reset ${docs.length} docs, cost ${endTime-startTime}ms`)
  }, [data?.body, dispatch, envData.searchEnabled, reset])

  // search text
  useEffect(() => {
    const searchResult: Record<string, boolean> = {}

    if (envData.searchEnabled && searchText) {
      // @ts-expect-error
      const documents: Document[] | undefined = search(searchText)
      if (documents != null) {
        for (const document of documents) {
          searchResult[''+document.idx] = true
        }
      }
    }

    dispatch(setSearchResult(searchResult))
  }, [dispatch, envData.searchEnabled, search, searchText])
}

export default useSearchService
