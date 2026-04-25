import { useCallback, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from './redux'
import {
  setBookmarks,
  setBookmarksReady,
  setBookmarkSegments,
  addBookmark as addBookmarkAction,
  removeBookmark as removeBookmarkAction,
  updateBookmark as updateBookmarkAction,
  addBookmarkSegment as addBookmarkSegmentAction,
  removeBookmarkSegment as removeBookmarkSegmentAction,
  setShowBookmarksPanel,
} from '../redux/envReducer'
import {
  loadBookmarks,
  saveBookmarks,
  addBookmarkItem,
  removeBookmarkItem,
  updateBookmarkItem,
  loadBookmarkSegments,
  saveBookmarkSegments,
  addBookmarkSegmentItem,
  removeBookmarkSegmentItem,
} from '../services/bookmarkService'
import toast from 'react-hot-toast'

const useBookmarkService = () => {
  const dispatch = useAppDispatch()

  const bookmarks = useAppSelector(state => state.env.bookmarks)
  const bookmarkSegments = useAppSelector(state => state.env.bookmarkSegments)
  const bookmarksReady = useAppSelector(state => state.env.bookmarksReady)
  const showBookmarksPanel = useAppSelector(state => state.env.showBookmarksPanel)
  const url = useAppSelector(state => state.env.url)
  const title = useAppSelector(state => state.env.title)
  const transResults = useAppSelector(state => state.env.transResults)

  const videoId = useCallback(() => {
    if (!url) return ''
    const path = url.split('/').pop() || ''
    return path
  }, [url])

  useEffect(() => {
    const initBookmarks = async () => {
      if (!bookmarksReady) {
        const [loadedBookmarks, loadedSegments] = await Promise.all([
          loadBookmarks(),
          loadBookmarkSegments(),
        ])
        dispatch(setBookmarks(loadedBookmarks))
        dispatch(setBookmarkSegments(loadedSegments))
        dispatch(setBookmarksReady(true))
      }
    }
    initBookmarks().catch(console.error)
  }, [dispatch, bookmarksReady])

  const toggleBookmarksPanel = useCallback(() => {
    dispatch(setShowBookmarksPanel(!showBookmarksPanel))
  }, [dispatch, showBookmarksPanel])

  const addItemBookmark = useCallback(async (item: TranscriptItem, segmentStartIdx?: number) => {
    const currentVideoId = videoId()
    if (!currentVideoId) {
      toast.error('无法获取视频ID')
      return
    }

    const existingBookmark = bookmarks.find(
      b => b.videoId === currentVideoId && b.itemIdx === item.idx
    )

    if (existingBookmark) {
      await removeBookmarkItem(existingBookmark.id)
      dispatch(removeBookmarkAction(existingBookmark.id))
      toast.success('已取消收藏')
    } else {
      const newBookmark = await addBookmarkItem({
        videoId: currentVideoId,
        videoTitle: title,
        segmentStartIdx,
        itemIdx: item.idx,
        from: item.from,
        to: item.to,
        content: item.content,
        translatedContent: transResults[item.idx]?.data,
      })
      dispatch(addBookmarkAction(newBookmark))
      toast.success('已添加收藏')
    }
  }, [bookmarks, dispatch, title, transResults, videoId])

  const addSegmentBookmark = useCallback(async (segment: Segment) => {
    const currentVideoId = videoId()
    if (!currentVideoId) {
      toast.error('无法获取视频ID')
      return
    }

    const existingSegment = bookmarkSegments.find(
      s => s.videoId === currentVideoId && s.segmentStartIdx === segment.startIdx
    )

    if (existingSegment) {
      await removeBookmarkSegmentItem(existingSegment.id)
      dispatch(removeBookmarkSegmentAction(existingSegment.id))
      toast.success('已取消段落收藏')
    } else {
      const newSegment = await addBookmarkSegmentItem({
        videoId: currentVideoId,
        videoTitle: title,
        segmentStartIdx: segment.startIdx,
        startIdx: segment.startIdx,
        endIdx: segment.endIdx,
        items: segment.items,
      })
      dispatch(addBookmarkSegmentAction(newSegment))
      toast.success('已添加段落收藏')
    }
  }, [bookmarkSegments, dispatch, title, videoId])

  const removeBookmark = useCallback(async (id: string, isSegment: boolean = false) => {
    if (isSegment) {
      await removeBookmarkSegmentItem(id)
      dispatch(removeBookmarkSegmentAction(id))
    } else {
      await removeBookmarkItem(id)
      dispatch(removeBookmarkAction(id))
    }
    toast.success('已移除收藏')
  }, [dispatch])

  const updateBookmarkNote = useCallback(async (id: string, note: string) => {
    const updated = await updateBookmarkItem(id, { note })
    if (updated) {
      dispatch(updateBookmarkAction({ id, note }))
      toast.success('已更新备注')
    }
  }, [dispatch])

  const isItemBookmarked = useCallback(
    (itemIdx: number) => {
      const currentVideoId = videoId()
      return bookmarks.some(b => b.videoId === currentVideoId && b.itemIdx === itemIdx)
    },
    [bookmarks, videoId]
  )

  const isSegmentBookmarked = useCallback(
    (segmentStartIdx: number) => {
      const currentVideoId = videoId()
      return bookmarkSegments.some(
        s => s.videoId === currentVideoId && s.segmentStartIdx === segmentStartIdx
      )
    },
    [bookmarkSegments, videoId]
  )

  const getVideoBookmarks = useCallback(() => {
    const currentVideoId = videoId()
    return {
      items: bookmarks.filter(b => b.videoId === currentVideoId),
      segments: bookmarkSegments.filter(s => s.videoId === currentVideoId),
    }
  }, [bookmarks, bookmarkSegments, videoId])

  return {
    bookmarks,
    bookmarkSegments,
    bookmarksReady,
    showBookmarksPanel,
    toggleBookmarksPanel,
    addItemBookmark,
    addSegmentBookmark,
    removeBookmark,
    updateBookmarkNote,
    isItemBookmarked,
    isSegmentBookmarked,
    getVideoBookmarks,
  }
}

export default useBookmarkService
