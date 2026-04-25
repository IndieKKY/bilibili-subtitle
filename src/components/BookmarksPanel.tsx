import React, { useCallback, useMemo } from 'react'
import { useAppSelector } from '../hooks/redux'
import useBookmarkService from '../hooks/useBookmarkService'
import { formatTime } from '../utils/util'
import {
  IoClose,
  IoBookmark,
  IoTrashBin,
  IoCreate,
  IoCheckmark,
} from 'react-icons/io5'
import classNames from 'classnames'
import toast from 'react-hot-toast'

const BookmarksPanel: React.FC = () => {
  const {
    bookmarks,
    bookmarkSegments,
    showBookmarksPanel,
    toggleBookmarksPanel,
    removeBookmark,
    updateBookmarkNote,
  } = useBookmarkService()

  const url = useAppSelector(state => state.env.url)
  const title = useAppSelector(state => state.env.title)
  const [editingNote, setEditingNote] = React.useState<string | null>(null)
  const [noteText, setNoteText] = React.useState('')

  const currentVideoId = useMemo(() => {
    if (!url) return ''
    const path = url.split('/').pop() || ''
    return path
  }, [url])

  const currentVideoBookmarks = useMemo(() => {
    return {
      items: bookmarks.filter(b => b.videoId === currentVideoId),
      segments: bookmarkSegments.filter(s => s.videoId === currentVideoId),
    }
  }, [bookmarks, bookmarkSegments, currentVideoId])

  const otherVideoBookmarks = useMemo(() => {
    const videoBookmarks: Record<
      string,
      {
        title?: string
        items: BookmarkItem[]
        segments: BookmarkSegment[]
      }
    > = {}

    for (const b of bookmarks) {
      if (b.videoId !== currentVideoId) {
        if (!videoBookmarks[b.videoId]) {
          videoBookmarks[b.videoId] = { title: b.videoTitle, items: [], segments: [] }
        }
        videoBookmarks[b.videoId].items.push(b)
      }
    }

    for (const s of bookmarkSegments) {
      if (s.videoId !== currentVideoId) {
        if (!videoBookmarks[s.videoId]) {
          videoBookmarks[s.videoId] = { title: s.videoTitle, items: [], segments: [] }
        }
        videoBookmarks[s.videoId].segments.push(s)
      }
    }

    return videoBookmarks
  }, [bookmarks, bookmarkSegments, currentVideoId])

  const startEditNote = useCallback(
    (id: string, currentNote?: string) => {
      setEditingNote(id)
      setNoteText(currentNote || '')
    },
    []
  )

  const saveNote = useCallback(
    (id: string) => {
      updateBookmarkNote(id, noteText)
      setEditingNote(null)
      setNoteText('')
    },
    [updateBookmarkNote, noteText]
  )

  const cancelEdit = useCallback(() => {
    setEditingNote(null)
    setNoteText('')
  }, [])

  const handleRemove = useCallback(
    (id: string, isSegment: boolean) => {
      if (confirm('确定要移除这个收藏吗？')) {
        removeBookmark(id, isSegment)
      }
    },
    [removeBookmark]
  )

  const copyContent = useCallback((content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      toast.success('已复制到剪贴板')
    })
  }, [])

  if (!showBookmarksPanel) return null

  return (
    <div className='fixed inset-0 z-[2000] flex items-center justify-center bg-black/50'>
      <div className='bg-base-100 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col'>
        <div className='flex items-center justify-between p-4 border-b border-base-300'>
          <h2 className='text-lg font-semibold flex items-center gap-2'>
            <IoBookmark className='text-primary' />
            收藏的字幕
          </h2>
          <button
            className='btn btn-ghost btn-circle btn-sm'
            onClick={toggleBookmarksPanel}
          >
            <IoClose />
          </button>
        </div>

        <div className='flex-1 overflow-y-auto p-4'>
          {currentVideoBookmarks.items.length > 0 ||
          currentVideoBookmarks.segments.length > 0 ? (
            <div className='mb-6'>
              <h3 className='text-sm font-semibold text-primary mb-3'>
                当前视频: {title || '未命名'}
              </h3>

              {currentVideoBookmarks.items.length > 0 && (
                <div className='mb-4'>
                  <h4 className='text-xs text-base-content/70 mb-2'>单条字幕 ({currentVideoBookmarks.items.length})</h4>
                  <div className='space-y-2'>
                    {currentVideoBookmarks.items.map(b => (
                      <div
                        key={b.id}
                        className='p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors'
                      >
                        <div className='flex items-start justify-between'>
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center gap-2 mb-1'>
                              <span className='text-xs text-primary bg-primary/10 px-2 py-0.5 rounded'>
                                {formatTime(b.from)}
                              </span>
                            </div>
                            <p
                              className='text-sm cursor-pointer hover:text-primary'
                              onClick={() => copyContent(b.content)}
                            >
                              {b.content}
                            </p>
                            {b.translatedContent && (
                              <p className='text-xs text-base-content/60 mt-1'>
                                {b.translatedContent}
                              </p>
                            )}

                            {editingNote === b.id ? (
                              <div className='mt-2 flex items-center gap-2'>
                                <input
                                  type='text'
                                  className='input input-sm input-bordered flex-1'
                                  value={noteText}
                                  onChange={e => setNoteText(e.target.value)}
                                  placeholder='添加备注...'
                                  autoFocus
                                />
                                <button
                                  className='btn btn-ghost btn-sm btn-circle'
                                  onClick={() => saveNote(b.id)}
                                >
                                  <IoCheckmark className='text-success' />
                                </button>
                              </div>
                            ) : (
                              b.note && (
                                <p className='text-xs text-secondary mt-1'>
                                  备注: {b.note}
                                </p>
                              )
                            )}
                          </div>

                          <div className='flex items-center gap-1 ml-2'>
                            {editingNote !== b.id && (
                              <button
                                className='btn btn-ghost btn-xs btn-circle'
                                onClick={() => startEditNote(b.id, b.note)}
                                title='添加备注'
                              >
                                <IoCreate className='text-xs' />
                              </button>
                            )}
                            <button
                              className='btn btn-ghost btn-xs btn-circle text-error'
                              onClick={() => handleRemove(b.id, false)}
                              title='移除收藏'
                            >
                              <IoTrashBin className='text-xs' />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentVideoBookmarks.segments.length > 0 && (
                <div>
                  <h4 className='text-xs text-base-content/70 mb-2'>段落 ({currentVideoBookmarks.segments.length})</h4>
                  <div className='space-y-2'>
                    {currentVideoBookmarks.segments.map(s => (
                      <div
                        key={s.id}
                        className='p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors'
                      >
                        <div className='flex items-start justify-between'>
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center gap-2 mb-2'>
                              <span className='text-xs text-primary bg-primary/10 px-2 py-0.5 rounded'>
                                {formatTime(s.items[0]?.from ?? 0)} -{' '}
                                {formatTime(s.items[s.items.length - 1]?.to ?? 0)}
                              </span>
                              <span className='text-xs text-base-content/60'>
                                {s.items.length} 条字幕
                              </span>
                            </div>
                            <div className='text-sm text-base-content/80 line-clamp-3'>
                              {s.items.slice(0, 3).map((item, idx) => (
                                <span key={idx}>
                                  {item.content}
                                  {idx < Math.min(2, s.items.length - 1) && ' '}
                                </span>
                              ))}
                              {s.items.length > 3 && '...'}
                            </div>
                          </div>

                          <button
                            className='btn btn-ghost btn-xs btn-circle text-error ml-2'
                            onClick={() => handleRemove(s.id, true)}
                            title='移除收藏'
                          >
                            <IoTrashBin className='text-xs' />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {Object.keys(otherVideoBookmarks).length > 0 && (
            <div>
              <h3 className='text-sm font-semibold text-base-content/70 mb-3'>
                其他视频
              </h3>
              <div className='space-y-4'>
                {Object.entries(otherVideoBookmarks).map(([videoId, data]) => (
                  <div key={videoId} className='border border-base-300 rounded-lg p-3'>
                    <h4 className='text-sm font-medium mb-2'>
                      {data.title || videoId}
                    </h4>
                    <div className='text-xs text-base-content/60'>
                      {data.items.length > 0 && <span>{data.items.length} 条单条字幕</span>}
                      {data.items.length > 0 && data.segments.length > 0 && <span>, </span>}
                      {data.segments.length > 0 && <span>{data.segments.length} 个段落</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentVideoBookmarks.items.length === 0 &&
            currentVideoBookmarks.segments.length === 0 &&
            Object.keys(otherVideoBookmarks).length === 0 && (
              <div className='flex flex-col items-center justify-center py-12 text-base-content/60'>
                <IoBookmark className='text-4xl mb-3 opacity-50' />
                <p>暂无收藏的字幕</p>
                <p className='text-xs mt-1'>点击字幕旁的书签图标即可收藏</p>
              </div>
            )}
        </div>
      </div>
    </div>
  )
}

export default BookmarksPanel
