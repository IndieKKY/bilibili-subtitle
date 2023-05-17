import React, {useCallback, useEffect, useRef} from 'react'
import {useAppDispatch, useAppSelector} from '../hooks/redux'
import useSubtitle from '../hooks/useSubtitle'
import {setCheckAutoScroll, setCurOffsetTop, setNeedScroll} from '../redux/envReducer'
import NormalSegmentItem from './NormalSegmentItem'
import CompactSegmentItem from './CompactSegmentItem'

const SegmentItem = (props: {
  bodyRef: any
  item: {
    from: number
    to: number
    content: string
  }
  idx: number
  isIn: boolean
  needScroll?: boolean
  last: boolean
}) => {
  const dispatch = useAppDispatch()
  const {bodyRef, item, idx, isIn, needScroll, last} = props
  const ref = useRef<any>()
  const {move} = useSubtitle()
  const compact = useAppSelector(state => state.env.compact)

  const moveCallback = useCallback((event: any) => {
    if (event.altKey) { // 复制
      navigator.clipboard.writeText(item.content).catch(console.error)
    } else {
      move(item.from)
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

  return <span ref={ref}>
    {compact
      ? <CompactSegmentItem
        item={item}
        idx={idx}
        isIn={isIn}
        last={last}
        moveCallback={moveCallback}
      />
      :
      <NormalSegmentItem
        item={item}
        idx={idx}
        isIn={isIn}
        moveCallback={moveCallback}
      />
    }
  </span>
}

export default SegmentItem
