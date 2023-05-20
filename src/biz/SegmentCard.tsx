import React, {MutableRefObject, useCallback, useEffect, useMemo, useRef} from 'react'
import {useAppDispatch, useAppSelector} from '../hooks/redux'
import {setFloatKeyPointsSegIdx, setPage, setSegmentFold, setTempData} from '../redux/envReducer'
import classNames from 'classnames'
import {FaClipboardList} from 'react-icons/fa'
import {PAGE_MAIN, PAGE_SETTINGS, SUMMARIZE_THRESHOLD} from '../const'
import useTranslate from '../hooks/useTranslate'
import {BsDashSquare, BsPlusSquare, CgFileDocument, GrOverview, RiFileCopy2Line} from 'react-icons/all'
import toast from 'react-hot-toast'
import {getLastTime, getSummaryStr, isSummaryEmpty, parseStrTimeToSeconds} from '../util/biz_util'
import {useInViewport} from 'ahooks'
import SegmentItem from './SegmentItem'
import {stopPopFunc} from '../util/util'
import useSubtitle from '../hooks/useSubtitle'

const SummarizeItemOverview = (props: {
  segment: Segment
  summary: OverviewSummary
  segmentIdx: number
  overviewItem: OverviewItem
  idx: number
}) => {
  const { segment, summary, segmentIdx, overviewItem, idx} = props

  const {move} = useSubtitle()
  const time = parseStrTimeToSeconds(overviewItem.time)
  const currentTime = useAppSelector(state => state.env.currentTime)
  const isIn = useMemo(() => {
    if (currentTime != null) {
      // check in current segment
      if (segment.items?.length > 0) {
        const startTime = segment.items[0].from
        const lastTime = segment.items[segment.items.length - 1].to
        if (currentTime >= startTime && currentTime < lastTime) {
          // check in current overview item
          const nextOverviewItem = summary.content?.[idx + 1]
          const nextTime = (nextOverviewItem != null)?parseStrTimeToSeconds(nextOverviewItem.time):null
          return currentTime >= time && (nextTime == null || currentTime < nextTime)
        }
      }
    }
    return false
  }, [currentTime, idx, segment.items, summary.content, time])

  const moveCallback = useCallback((event: any) => {
    if (event.altKey) { // 复制
      navigator.clipboard.writeText(overviewItem.key).catch(console.error)
    } else {
      move(time)
    }
  }, [overviewItem.key, move, time])

  return <li className='flex items-center gap-1 relative cursor-pointer p-0.5 rounded-sm hover:bg-base-200' onClick={moveCallback}>
    <span className='absolute left-[-16px] top-auto bottom-auto'>{overviewItem.emoji}</span>
    <span className='bg-success/75 rounded-sm px-1'>{overviewItem.time}</span>
    <span className={classNames(isIn ? 'text-primary underline' : '')}>{overviewItem.key}</span>
  </li>
}

const Summarize = (props: {
  segment: Segment
  segmentIdx: number
  summary?: Summary
  float?: boolean
}) => {
  const {segment, segmentIdx, summary, float} = props

  const dispatch = useAppDispatch()
  const apiKey = useAppSelector(state => state.env.envData.apiKey)
  const fontSize = useAppSelector(state => state.env.envData.fontSize)
  const curSummaryType = useAppSelector(state => state.env.tempData.curSummaryType)
  const {addSummarizeTask} = useTranslate()

  const onGenerate = useCallback(() => {
    if (apiKey) {
      addSummarizeTask(curSummaryType, segment).catch(console.error)
    } else {
      dispatch(setPage(PAGE_SETTINGS))
      toast.error('需要先设置ApiKey!')
    }
  }, [addSummarizeTask, apiKey, curSummaryType, dispatch, segment])

  const onCopy = useCallback(() => {
    if (summary != null) {
      navigator.clipboard.writeText(getSummaryStr(summary)).then(() => {
        toast.success('已复制到剪贴板!')
      }).catch(console.error)
    }
  }, [summary])

  return <div className='flex flex-col gap-0.5 relative'>
    {(summary != null) && !isSummaryEmpty(summary) && <div className='absolute top-0 right-0'>
      <RiFileCopy2Line className='desc cursor-pointer' onClick={onCopy}/>
    </div>}
    <div className='flex justify-center items-center'>
      {summary?.type === 'overview' && (summary.content != null) &&
        <ul className={classNames('font-medium list-none max-w-[90%]', fontSize === 'large' ? 'text-sm' : 'text-xs')}>
          {(summary.content).map((overviewItem: OverviewItem, idx: number) =>
            <SummarizeItemOverview key={idx} idx={idx} summary={summary} overviewItem={overviewItem} segment={segment} segmentIdx={segmentIdx}/>)}
        </ul>}
      {summary?.type === 'keypoint' && (summary.content != null) &&
        <ul className={classNames('font-medium list-disc max-w-[90%]', fontSize === 'large' ? 'text-sm' : 'text-xs')}>
          {summary.content?.map((keyPoint: string, idx: number) => <li key={idx}>{keyPoint}</li>)}
        </ul>}
      {summary?.type === 'brief' && (summary.content != null) &&
        <div className={classNames('font-medium max-w-[90%]', fontSize === 'large' ? 'text-sm' : 'text-xs')}>
          {summary.content.summary}
        </div>}
    </div>
    <div className='flex flex-col justify-center items-center'>
      {segment.text.length < SUMMARIZE_THRESHOLD && <div className='desc-lighter text-xs'>文字过短，无法总结.</div>}
      {segment.text.length >= SUMMARIZE_THRESHOLD && ((summary == null) || summary.status !== 'done' || summary.error) && <button disabled={summary?.status === 'pending'}
                className={classNames('btn btn-link btn-xs', summary?.status === 'pending' && 'loading')}
                onClick={onGenerate}>{(summary == null) || summary.status === 'init' ? '点击生成' : (summary.status === 'pending' ? '生成中' : '重新生成')}</button>}
      {summary?.error && <div className='text-xs text-error'>{summary?.error}</div>}
    </div>
    {!float && <div className='mx-2 my-1 h-[1px] bg-base-300'></div>}
  </div>
}

const SegmentCard = (props: {
  bodyRef: MutableRefObject<any>
  segment: Segment
  segmentIdx: number
}) => {
  const {bodyRef, segment, segmentIdx} = props

  const dispatch = useAppDispatch()
  const summarizeRef = useRef<any>(null)
  const [inViewport] = useInViewport(summarizeRef, {
    root: bodyRef.current,
  })
  const segments = useAppSelector(state => state.env.segments)
  const needScroll = useAppSelector(state => state.env.needScroll)
  const curIdx = useAppSelector(state => state.env.curIdx)
  const summarizeEnable = useAppSelector(state => state.env.envData.summarizeEnable)
  const summarizeFloat = useAppSelector(state => state.env.envData.summarizeFloat)
  const fold = useAppSelector(state => state.env.fold)
  const page = useAppSelector(state => state.env.page)
  const compact = useAppSelector(state => state.env.compact)
  const floatKeyPointsSegIdx = useAppSelector(state => state.env.floatKeyPointsSegIdx)
  const showCurrent = useMemo(() => curIdx != null && segment.startIdx <= curIdx && curIdx <= segment.endIdx, [curIdx, segment.endIdx, segment.startIdx])
  const curSummaryType = useAppSelector(state => state.env.tempData.curSummaryType)
  const summary = useMemo(() => {
    const result = segment.summaries[curSummaryType]
    if (result) {
      return result
    }
    return undefined
  }, [curSummaryType, segment.summaries])

  const onFold = useCallback(() => {
    dispatch(setSegmentFold({
      segmentStartIdx: segment.startIdx,
      fold: !segment.fold
    }))
  }, [dispatch, segment.fold, segment.startIdx])

  // 检测设置floatKeyPointsSegIdx
  useEffect(() => {
    if (summarizeFloat) { // 已启用
      if (!fold && page === PAGE_MAIN && showCurrent) { // 当前Card有控制权
        if (!inViewport && (summary != null) && !isSummaryEmpty(summary)) {
          dispatch(setFloatKeyPointsSegIdx(segment.startIdx))
        } else {
          dispatch(setFloatKeyPointsSegIdx())
        }
      }
    }
  }, [dispatch, fold, inViewport, page, segment.startIdx, showCurrent, summarizeFloat, summary])

  const onSelBrief = useCallback(() => {
    dispatch(setTempData({
      curSummaryType: 'brief'
    }))
  }, [dispatch])

  const onSelOverview = useCallback(() => {
    dispatch(setTempData({
      curSummaryType: 'overview'
    }))
  }, [dispatch])

  const onSelKeypoint = useCallback(() => {
    dispatch(setTempData({
      curSummaryType: 'keypoint'
    }))
  }, [dispatch])

  return <div
    className={classNames('border border-base-300 bg-base-200/25 rounded flex flex-col m-1.5 p-1.5 gap-1 shadow', showCurrent && 'shadow-primary')}>
    <div className='relative flex justify-center min-h-[20px]'>
      {segments != null && segments.length > 1 &&
        <div className='absolute left-0 top-0 bottom-0 text-xs select-none flex-center desc'>
          {segment.fold
            ? <BsPlusSquare className='cursor-pointer' onClick={onFold}/> :
            <BsDashSquare className='cursor-pointer' onClick={onFold}/>}
        </div>}
      {summarizeEnable && <div className="tabs">
        <a className="tab tab-lifted tab-xs tab-disabled cursor-default"></a>
        <a className={classNames('tab tab-lifted tab-xs', curSummaryType === 'brief' && 'tab-active')} onClick={onSelBrief}><CgFileDocument/>总结</a>
        <a className={classNames('tab tab-lifted tab-xs', curSummaryType === 'overview' && 'tab-active')} onClick={onSelOverview}><GrOverview/>概览</a>
        <a className={classNames('tab tab-lifted tab-xs', curSummaryType === 'keypoint' && 'tab-active')} onClick={onSelKeypoint}><FaClipboardList/>要点</a>
        <a className="tab tab-lifted tab-xs tab-disabled cursor-default"></a>
      </div>}
      <div
        className='absolute right-0 top-0 bottom-0 text-xs desc-lighter select-none flex-center'>{getLastTime(segment.items[segment.items.length - 1].to - segment.items[0].from)}</div>
    </div>
    {summarizeEnable && <div ref={summarizeRef}>
      <Summarize segment={segment} segmentIdx={segmentIdx} summary={summary}/>
    </div>}
    {!segment.fold
      ? <div>
        {!compact && <div className='desc text-xs flex py-0.5'>
          <div className='w-[66px] flex justify-center'>时间</div>
          <div className='flex-1'>字幕内容</div>
        </div>}
        {segment.items.map((item: TranscriptItem, idx: number) => <SegmentItem key={item.idx}
                                                                               bodyRef={bodyRef}
                                                                               item={item}
                                                                               idx={segment.startIdx + idx}
                                                                               isIn={curIdx === segment.startIdx + idx}
                                                                               needScroll={needScroll && curIdx === segment.startIdx + idx}
                                                                               last={idx === segment.items.length - 1}
        />)}
        {segments != null && segments.length > 1 && <div className='flex justify-center'><a className='link text-xs'
                                                                                            onClick={onFold}>点击折叠{segment.items.length}行</a>
        </div>}
      </div>
      : <div className='flex justify-center'><a className='link text-xs'
                                                onClick={onFold}>{segment.items.length}行已折叠,点击展开</a>
      </div>}
    {floatKeyPointsSegIdx === segment.startIdx && <div
      className='absolute bottom-0 left-0 right-0 z-[200] border-t bg-base-100 text-primary-content shadow max-h-[100px] overflow-y-auto scrollbar-hide'
      onWheel={stopPopFunc}
    >
      <div className='bg-primary/50 p-2'>
        <Summarize segment={segment} segmentIdx={segmentIdx} summary={summary} float/>
      </div>
    </div>}
  </div>
}

export default SegmentCard
