import { useCallback, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from './redux'
import {
  setCachedSubtitles,
  setCachedReady,
  addCachedSubtitle as addCachedSubtitleAction,
  removeCachedSubtitle as removeCachedSubtitleAction,
} from '../redux/envReducer'
import {
  loadCachedSubtitles,
  addCachedSubtitle,
  removeCachedSubtitle,
  getCachedSubtitle,
  clearExpiredCache,
  clearAllCache,
  getCacheStats,
} from '../services/cacheService'
import toast from 'react-hot-toast'

const useCacheService = () => {
  const dispatch = useAppDispatch()

  const cachedSubtitles = useAppSelector(state => state.env.cachedSubtitles)
  const cachedReady = useAppSelector(state => state.env.cachedReady)
  const url = useAppSelector(state => state.env.url)
  const title = useAppSelector(state => state.env.title)
  const infos = useAppSelector(state => state.env.infos)
  const data = useAppSelector(state => state.env.data)

  const videoId = useCallback(() => {
    if (!url) return ''
    const path = url.split('/').pop() || ''
    return path
  }, [url])

  useEffect(() => {
    const initCache = async () => {
      if (!cachedReady) {
        const loaded = await loadCachedSubtitles()
        dispatch(setCachedSubtitles(loaded))
        dispatch(setCachedReady(true))
      }
    }
    initCache().catch(console.error)
  }, [dispatch, cachedReady])

  const cacheCurrentSubtitle = useCallback(async (lan: string, lanDoc: string) => {
    const currentVideoId = videoId()
    if (!currentVideoId || !data || !infos) {
      toast.error('缺少必要的数据')
      return
    }

    const subtitleInfo = infos.find(i => i.lan === lan)
    if (!subtitleInfo) {
      toast.error('未找到对应字幕')
      return
    }

    const cached = await addCachedSubtitle({
      videoId: currentVideoId,
      videoTitle: title,
      cid: subtitleInfo.id,
      lan,
      lanDoc,
      subtitleUrl: subtitleInfo.subtitle_url,
      data,
    })

    dispatch(addCachedSubtitleAction(cached))
    toast.success('已缓存字幕')
  }, [data, dispatch, infos, title, videoId])

  const cacheAllSubtitles = useCallback(async () => {
    const currentVideoId = videoId()
    if (!currentVideoId || !infos) {
      toast.error('缺少必要的数据')
      return
    }

    let cachedCount = 0
    for (const info of infos) {
      if (info.subtitle_url) {
        const existing = await getCachedSubtitle(currentVideoId, info.lan)
        if (!existing) {
          toast.loading(`正在缓存: ${info.lan_doc}...`, { id: 'caching' })
        }
        cachedCount++
      }
    }

    toast.success(`已缓存 ${cachedCount} 个字幕`, { id: 'caching' })
  }, [infos, videoId])

  const getVideoCachedSubtitles = useCallback(() => {
    const currentVideoId = videoId()
    return cachedSubtitles.filter(c => c.videoId === currentVideoId)
  }, [cachedSubtitles, videoId])

  const isSubtitleCached = useCallback(
    (lan: string) => {
      const currentVideoId = videoId()
      return cachedSubtitles.some(c => c.videoId === currentVideoId && c.lan === lan)
    },
    [cachedSubtitles, videoId]
  )

  const removeCache = useCallback(async (lan: string) => {
    const currentVideoId = videoId()
    await removeCachedSubtitle(currentVideoId, lan)
    dispatch(removeCachedSubtitleAction({ videoId: currentVideoId, lan }))
    toast.success('已移除缓存')
  }, [dispatch, videoId])

  const clearExpired = useCallback(async () => {
    const cleared = await clearExpiredCache()
    if (cleared > 0) {
      const loaded = await loadCachedSubtitles()
      dispatch(setCachedSubtitles(loaded))
      toast.success(`已清理 ${cleared} 个过期缓存`)
    } else {
      toast.success('没有过期的缓存')
    }
  }, [dispatch])

  const clearAll = useCallback(async () => {
    if (confirm('确定要清除所有缓存吗？')) {
      await clearAllCache()
      dispatch(setCachedSubtitles([]))
      toast.success('已清除所有缓存')
    }
  }, [dispatch])

  const getStats = useCallback(async () => {
    return await getCacheStats()
  }, [])

  return {
    cachedSubtitles,
    cachedReady,
    cacheCurrentSubtitle,
    cacheAllSubtitles,
    getVideoCachedSubtitles,
    isSubtitleCached,
    removeCache,
    clearExpired,
    clearAll,
    getStats,
  }
}

export default useCacheService
