import { v4 } from 'uuid'
import { STORAGE_BOOKMARKS, STORAGE_BOOKMARK_SEGMENTS } from '../consts/const'
import { getStorage } from '../utils/storage'

const storage = getStorage('chrome_client')

export const loadBookmarks = async (): Promise<BookmarkItem[]> => {
  try {
    const data = await storage.getStore(STORAGE_BOOKMARKS)
    if (data) {
      return JSON.parse(data) as BookmarkItem[]
    }
  } catch (e) {
    console.error('Failed to load bookmarks:', e)
  }
  return []
}

export const saveBookmarks = async (bookmarks: BookmarkItem[]): Promise<void> => {
  try {
    await storage.setStore(STORAGE_BOOKMARKS, JSON.stringify(bookmarks))
  } catch (e) {
    console.error('Failed to save bookmarks:', e)
  }
}

export const addBookmarkItem = async (
  item: Omit<BookmarkItem, 'id' | 'createdAt'>
): Promise<BookmarkItem> => {
  const bookmarks = await loadBookmarks()
  const newBookmark: BookmarkItem = {
    ...item,
    id: v4(),
    createdAt: Date.now(),
  }
  bookmarks.push(newBookmark)
  await saveBookmarks(bookmarks)
  return newBookmark
}

export const removeBookmarkItem = async (id: string): Promise<void> => {
  const bookmarks = await loadBookmarks()
  const filtered = bookmarks.filter(b => b.id !== id)
  await saveBookmarks(filtered)
}

export const updateBookmarkItem = async (
  id: string,
  updates: Partial<BookmarkItem>
): Promise<BookmarkItem | null> => {
  const bookmarks = await loadBookmarks()
  const idx = bookmarks.findIndex(b => b.id === id)
  if (idx >= 0) {
    bookmarks[idx] = { ...bookmarks[idx], ...updates }
    await saveBookmarks(bookmarks)
    return bookmarks[idx]
  }
  return null
}

export const getBookmarksByVideo = async (videoId: string): Promise<BookmarkItem[]> => {
  const bookmarks = await loadBookmarks()
  return bookmarks.filter(b => b.videoId === videoId)
}

export const isItemBookmarked = async (
  videoId: string,
  itemIdx: number
): Promise<boolean> => {
  const bookmarks = await loadBookmarks()
  return bookmarks.some(b => b.videoId === videoId && b.itemIdx === itemIdx)
}

export const loadBookmarkSegments = async (): Promise<BookmarkSegment[]> => {
  try {
    const data = await storage.getStore(STORAGE_BOOKMARK_SEGMENTS)
    if (data) {
      return JSON.parse(data) as BookmarkSegment[]
    }
  } catch (e) {
    console.error('Failed to load bookmark segments:', e)
  }
  return []
}

export const saveBookmarkSegments = async (segments: BookmarkSegment[]): Promise<void> => {
  try {
    await storage.setStore(STORAGE_BOOKMARK_SEGMENTS, JSON.stringify(segments))
  } catch (e) {
    console.error('Failed to save bookmark segments:', e)
  }
}

export const addBookmarkSegmentItem = async (
  segment: Omit<BookmarkSegment, 'id' | 'createdAt'>
): Promise<BookmarkSegment> => {
  const segments = await loadBookmarkSegments()
  const newSegment: BookmarkSegment = {
    ...segment,
    id: v4(),
    createdAt: Date.now(),
  }
  segments.push(newSegment)
  await saveBookmarkSegments(segments)
  return newSegment
}

export const removeBookmarkSegmentItem = async (id: string): Promise<void> => {
  const segments = await loadBookmarkSegments()
  const filtered = segments.filter(s => s.id !== id)
  await saveBookmarkSegments(filtered)
}

export const getBookmarkSegmentsByVideo = async (
  videoId: string
): Promise<BookmarkSegment[]> => {
  const segments = await loadBookmarkSegments()
  return segments.filter(s => s.videoId === videoId)
}

export const isSegmentBookmarked = async (
  videoId: string,
  segmentStartIdx: number
): Promise<boolean> => {
  const segments = await loadBookmarkSegments()
  return segments.some(
    s => s.videoId === videoId && s.segmentStartIdx === segmentStartIdx
  )
}

export const exportBookmarks = async (
  format: 'json' | 'csv' | 'txt'
): Promise<string> => {
  const bookmarks = await loadBookmarks()
  const segments = await loadBookmarkSegments()

  if (format === 'json') {
    return JSON.stringify({ bookmarks, segments }, null, 2)
  }

  if (format === 'csv') {
    let csv = 'Type,Video Title,Time,Content,Created At\n'
    for (const b of bookmarks) {
      csv += `Bookmark,"${b.videoTitle ?? ''}","${formatTime(b.from)}","${b.content.replace(/"/g, '""')}",${new Date(b.createdAt).toISOString()}\n`
    }
    for (const s of segments) {
      const content = s.items.map(i => i.content).join(' ')
      csv += `Segment,"${s.videoTitle ?? ''}","${formatTime(s.items[0]?.from ?? 0)}","${content.replace(/"/g, '""')}",${new Date(s.createdAt).toISOString()}\n`
    }
    return csv
  }

  let txt = '=== 收藏的字幕 ===\n\n'
  for (const b of bookmarks) {
    txt += `视频: ${b.videoTitle ?? '未知'}\n`
    txt += `时间: ${formatTime(b.from)}\n`
    txt += `内容: ${b.content}\n`
    if (b.translatedContent) {
      txt += `翻译: ${b.translatedContent}\n`
    }
    txt += `收藏时间: ${new Date(b.createdAt).toLocaleString()}\n`
    txt += '---\n\n'
  }

  txt += '\n=== 收藏的段落 ===\n\n'
  for (const s of segments) {
    txt += `视频: ${s.videoTitle ?? '未知'}\n`
    txt += `时间范围: ${formatTime(s.items[0]?.from ?? 0)} - ${formatTime(s.items[s.items.length - 1]?.to ?? 0)}\n`
    txt += '内容:\n'
    for (const item of s.items) {
      txt += `  ${formatTime(item.from)} ${item.content}\n`
    }
    txt += `收藏时间: ${new Date(s.createdAt).toLocaleString()}\n`
    txt += '---\n\n'
  }

  return txt
}

const formatTime = (time: number): string => {
  const hours = Math.floor(time / 3600)
  const minutes = Math.floor((time % 3600) / 60)
  const seconds = Math.floor(time % 60)

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}
