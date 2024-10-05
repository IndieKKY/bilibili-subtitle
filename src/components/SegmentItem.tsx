import React, {useCallback, useEffect, useMemo, useRef} from 'react'
import {useAppDispatch, useAppSelector} from '../hooks/redux'
import useSubtitle from '../hooks/useSubtitle'
import {setCheckAutoScroll, setCurOffsetTop, setNeedScroll} from '../redux/envReducer'
import NormalSegmentItem from './NormalSegmentItem'
import CompactSegmentItem from './CompactSegmentItem'

const SegmentItem = (props: {
  bodyRef: any
  item: TranscriptItem
  idx: number
  isIn: boolean
  needScroll?: boolean
  last: boolean
}) => {
  const {bodyRef, item, idx, isIn, needScroll, last} = props
  const dispatch = useAppDispatch()
  const ref = useRef<any>()
  const {move} = useSubtitle()

  const compact = useAppSelector(state => state.env.tempData.compact)
  const searchText = useAppSelector(state => state.env.searchText)
  const searchResult = useAppSelector(state => state.env.searchResult)
  const display = useMemo(() => {
    if (searchText) {
      return searchResult[item.idx+''] ? 'inline' : 'none'
    } else {
      return 'inline'
    }
  }, [item.idx, searchResult, searchText])

  const moveCallback = useCallback((event: any) => {
    if (event.altKey) { // 复制
      navigator.clipboard.writeText(item.content).catch(console.error)
    } else {
      move(item.from, false)
    }
  }, [item.content, item.from, move])

  const move2Callback = useCallback((event: any) => {
    if (event.altKey) { // 复制
      navigator.clipboard.writeText(item.content).catch(console.error)
    } else {
      move(item.from, true)
    }
  }, [item.content, item.from, move])

  // 检测需要滚动进入视野
  useEffect(() => {
    if (needScroll) {
      bodyRef.current.scrollTop = ref.current.offsetTop - bodyRef.current.offsetTop - 40
      dispatch(setNeedScroll(false))
    }
  }, [dispatch, needScroll, bodyRef])

  // 进入时更新当前offsetTop
  useEffect(() => {
    if (isIn) {
      dispatch(setCurOffsetTop(ref.current.offsetTop))
      dispatch(setCheckAutoScroll(true))
    }
  }, [dispatch, isIn])

  return <span ref={ref} style={{
    display
  }}>
    {compact
      ? <CompactSegmentItem
        item={item}
        idx={idx}
        isIn={isIn}
        last={last}
        moveCallback={moveCallback}
        move2Callback={move2Callback}
      />
      :
      <NormalSegmentItem
        item={item}
        idx={idx}
        isIn={isIn}
        moveCallback={moveCallback}
        move2Callback={move2Callback}
      />
    }
  </span>
}

export default SegmentItem
