import { STORAGE_CACHED_SUBTITLES } from '../consts/const'
import { getStorage } from '../utils/storage'

const storage = getStorage('chrome_client')

const CACHE_EXPIRE_DAYS = 30

export const loadCachedSubtitles = async (): Promise<CachedSubtitle[]> => {
  try {
    const data = await storage.getStore(STORAGE_CACHED_SUBTITLES)
    if (data) {
      const cached = JSON.parse(data) as CachedSubtitle[]
      return cached.filter(c => !isCacheExpired(c))
    }
  } catch (e) {
    console.error('Failed to load cached subtitles:', e)
  }
  return []
}

export const saveCachedSubtitles = async (subtitles: CachedSubtitle[]): Promise<void> => {
  try {
    const valid = subtitles.filter(c => !isCacheExpired(c))
    await storage.setStore(STORAGE_CACHED_SUBTITLES, JSON.stringify(valid))
  } catch (e) {
    console.error('Failed to save cached subtitles:', e)
  }
}

export const addCachedSubtitle = async (
  subtitle: Omit<CachedSubtitle, 'cachedAt'>
): Promise<CachedSubtitle> => {
  const cached = await loadCachedSubtitles()
  const newCache: CachedSubtitle = {
    ...subtitle,
    cachedAt: Date.now(),
  }

  const existingIndex = cached.findIndex(
    c => c.videoId === subtitle.videoId && c.lan === subtitle.lan
  )

  if (existingIndex >= 0) {
    cached[existingIndex] = newCache
  } else {
    cached.push(newCache)
  }

  await saveCachedSubtitles(cached)
  return newCache
}

export const removeCachedSubtitle = async (videoId: string, lan: string): Promise<void> => {
  const cached = await loadCachedSubtitles()
  const filtered = cached.filter(c => !(c.videoId === videoId && c.lan === lan))
  await saveCachedSubtitles(filtered)
}

export const getCachedSubtitle = async (
  videoId: string,
  lan: string
): Promise<CachedSubtitle | null> => {
  const cached = await loadCachedSubtitles()
  const found = cached.find(c => c.videoId === videoId && c.lan === lan)
  if (found && !isCacheExpired(found)) {
    return found
  }
  return null
}

export const getCachedSubtitlesByVideo = async (
  videoId: string
): Promise<CachedSubtitle[]> => {
  const cached = await loadCachedSubtitles()
  return cached.filter(c => c.videoId === videoId && !isCacheExpired(c))
}

export const clearExpiredCache = async (): Promise<number> => {
  const cached = await loadCachedSubtitles()
  const valid = cached.filter(c => !isCacheExpired(c))
  const removed = cached.length - valid.length
  await saveCachedSubtitles(valid)
  return removed
}

export const clearAllCache = async (): Promise<void> => {
  await storage.setStore(STORAGE_CACHED_SUBTITLES, JSON.stringify([]))
}

export const getCacheStats = async (): Promise<{
  total: number
  totalVideos: number
  totalSize: number
}> => {
  const cached = await loadCachedSubtitles()
  const videoIds = new Set(cached.map(c => c.videoId))
  const totalSize = new Blob([JSON.stringify(cached)]).size

  return {
    total: cached.length,
    totalVideos: videoIds.size,
    totalSize,
  }
}

const isCacheExpired = (cache: CachedSubtitle): boolean => {
  const expireTime = CACHE_EXPIRE_DAYS * 24 * 60 * 60 * 1000
  return Date.now() - cache.cachedAt > expireTime
}
