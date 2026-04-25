import React, { useCallback, useMemo } from 'react'
import { useAppSelector } from '../hooks/redux'
import { getDisplay, getTransText } from '../utils/bizUtil'
import classNames from 'classnames'
import { IoBookmarkOutline, IoBookmark } from 'react-icons/io5'
import useBookmarkService from '../hooks/useBookmarkService'
import { HIGHLIGHT_CLASS } from '../consts/const'

const highlightText = (text: string, searchText: string): React.ReactNode => {
  if (!searchText || !text) return text

  const needle = searchText.toLowerCase()
  const lowerText = text.toLowerCase()

  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let index = lowerText.indexOf(needle)

  while (index !== -1) {
    if (index > lastIndex) {
      parts.push(text.substring(lastIndex, index))
    }
    parts.push(
      <mark key={`${index}`} className={HIGHLIGHT_CLASS}>
        {text.substring(index, index + searchText.length)}
      </mark>
    )
    lastIndex = index + searchText.length
    index = lowerText.indexOf(needle, lastIndex)
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts.length > 0 ? <>{parts}</> : text
}

const CompactSegmentItem = (props: {
  item: TranscriptItem
  idx: number
  isIn: boolean
  last: boolean
  moveCallback: (event: any) => void
  move2Callback: (event: any) => void
  segmentStartIdx?: number
}) => {
  const { item, idx, last, isIn, moveCallback, move2Callback, segmentStartIdx } = props
  const transResult = useAppSelector(state => state.env.transResults[idx])
  const envData = useAppSelector(state => state.env.envData)
  const fontSize = useAppSelector(state => state.env.envData.fontSize)
  const autoTranslate = useAppSelector(state => state.env.autoTranslate)
  const searchText = useAppSelector(state => state.env.searchText)
  const highlightMatches = useAppSelector(state => state.env.highlightMatches)

  const { isItemBookmarked, addItemBookmark } = useBookmarkService()

  const transText = useMemo(() => getTransText(transResult, envData.hideOnDisableAutoTranslate, autoTranslate), [autoTranslate, envData.hideOnDisableAutoTranslate, transResult])
  const display = useMemo(() => getDisplay(envData.transDisplay, item.content, transText), [envData.transDisplay, item.content, transText])

  const isBookmarked = isItemBookmarked(item.idx)

  const handleBookmarkClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      addItemBookmark(item, segmentStartIdx)
    },
    [addItemBookmark, item, segmentStartIdx]
  )

  const displayMain = useMemo(() => {
    if (highlightMatches && searchText) {
      return highlightText(display.main, searchText)
    }
    return display.main
  }, [display.main, highlightMatches, searchText])

  const displaySub = useMemo(() => {
    if (highlightMatches && searchText && display.sub) {
      return highlightText(display.sub, searchText)
    }
    return display.sub
  }, [display.sub, highlightMatches, searchText])

  return <div className={classNames('inline-flex items-center group', fontSize === 'large' ? 'text-sm' : 'text-xs')}>
    <span className={'pl-1 pr-0.5 py-0.5 cursor-pointer rounded-sm hover:bg-base-200'} onClick={moveCallback} onDoubleClick={move2Callback}>
      <text className={classNames('font-medium', isIn ? 'text-primary underline' : '')}>{displayMain}</text>
      {displaySub && <text className='desc'>({displaySub})</text>}
    </span>
    <button
      className={classNames(
        'btn btn-ghost btn-xs btn-circle p-0 ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity',
        isBookmarked ? 'text-primary opacity-100' : 'text-base-content/50'
      )}
      onClick={handleBookmarkClick}
      title={isBookmarked ? '取消收藏' : '收藏字幕'}
    >
      {isBookmarked ? (
        <IoBookmark className='text-xs' />
      ) : (
        <IoBookmarkOutline className='text-xs' />
      )}
    </button>
    <span className='text-base-content/75 ml-0.5'>{!last && ','}</span>
  </div>
}

export default CompactSegmentItem
