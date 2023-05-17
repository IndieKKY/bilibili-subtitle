import React, {useCallback, useEffect, useRef} from 'react'
import {
  setAutoScroll,
  setAutoTranslate,
  setCheckAutoScroll,
  setCompact,
  setFoldAll,
  setNeedScroll,
  setPage,
  setSegmentFold
} from '../redux/envReducer'
import {useAppDispatch, useAppSelector} from '../hooks/redux'
import {AiOutlineAim, FaRegArrowAltCircleDown, IoWarning, MdExpand, RiTranslate} from 'react-icons/all'
import classNames from 'classnames'
import toast from 'react-hot-toast'
import SegmentCard from './SegmentCard'
import {HEADER_HEIGHT, PAGE_SETTINGS, SUMMARIZE_ALL_THRESHOLD, TITLE_HEIGHT} from '../const'
import {FaClipboardList} from 'react-icons/fa'
import useTranslate from '../hooks/useTranslate'

const Body = () => {
  const dispatch = useAppDispatch()
  const noVideo = useAppSelector(state => state.env.noVideo)
  const autoTranslate = useAppSelector(state => state.env.autoTranslate)
  const autoScroll = useAppSelector(state => state.env.autoScroll)
  const segments = useAppSelector(state => state.env.segments)
  const foldAll = useAppSelector(state => state.env.foldAll)
  const envData = useAppSelector(state => state.env.envData)
  const compact = useAppSelector(state => state.env.compact)
  const apiKey = useAppSelector(state => state.env.envData.apiKey)
  const floatKeyPointsSegIdx = useAppSelector(state => state.env.floatKeyPointsSegIdx)
  const translateEnable = useAppSelector(state => state.env.envData.translateEnable)
  const summarizeEnable = useAppSelector(state => state.env.envData.summarizeEnable)
  const title = useAppSelector(state => state.env.title)
  const {addSummarizeTask} = useTranslate()
  const bodyRef = useRef<any>()
  const curOffsetTop = useAppSelector(state => state.env.curOffsetTop)
  const checkAutoScroll = useAppSelector(state => state.env.checkAutoScroll)
  const needScroll = useAppSelector(state => state.env.needScroll)
  const totalHeight = useAppSelector(state => state.env.totalHeight)
  const curSummaryType = useAppSelector(state => state.env.curSummaryType)

  const normalCallback = useCallback(() => {
    dispatch(setCompact(false))
  }, [dispatch])

  const compactCallback = useCallback(() => {
    dispatch(setCompact(true))
  }, [dispatch])

  const posCallback = useCallback(() => {
    dispatch(setNeedScroll(true))
  }, [dispatch])

  const onSummarizeAll = useCallback(() => {
    if (!apiKey) {
      dispatch(setPage(PAGE_SETTINGS))
      toast.error('需要先设置ApiKey!')
      return
    }
    const segments_ = []
    for (const segment of segments ?? []) {
      const summary = segment.summaries[curSummaryType]
      if (!summary || summary.status === 'init' || (summary.status === 'done' && summary.error)) {
        segments_.push(segment)
      }
    }
    if (segments_.length === 0) {
      toast.error('没有可总结的段落!')
      return
    }
    if (segments_.length < SUMMARIZE_ALL_THRESHOLD || confirm(`确定总结${segments_.length}个段落?`)) {
      for (const segment of segments_) {
        addSummarizeTask(title, curSummaryType, segment).catch(console.error)
      }
      toast.success(`已添加${segments_.length}个总结任务!`)
    }
  }, [addSummarizeTask, apiKey, curSummaryType, dispatch, segments, title])

  const onFoldAll = useCallback(() => {
    dispatch(setFoldAll(!foldAll))
    for (const segment of segments ?? []) {
      dispatch(setSegmentFold({
        segmentStartIdx: segment.startIdx,
        fold: !foldAll
      }))
    }
  }, [dispatch, foldAll, segments])

  const toggleAutoTranslateCallback = useCallback(() => {
    if (envData.apiKey) {
      dispatch(setAutoTranslate(!autoTranslate))
    } else {
      dispatch(setPage(PAGE_SETTINGS))
      toast.error('需要先设置ApiKey!')
    }
  }, [autoTranslate, dispatch, envData.apiKey])

  const onEnableAutoScroll = useCallback(() => {
    dispatch(setAutoScroll(true))
    dispatch(setNeedScroll(true))
  }, [dispatch])

  const onWheel = useCallback(() => {
    if (autoScroll) {
      dispatch(setAutoScroll(false))
    }
  }, [autoScroll, dispatch])

  // 自动滚动
  useEffect(() => {
    if (checkAutoScroll && curOffsetTop && autoScroll && !needScroll) {
      if (bodyRef.current.scrollTop <= curOffsetTop - bodyRef.current.offsetTop - (totalHeight-120) + (floatKeyPointsSegIdx != null ? 100 : 0) ||
        bodyRef.current.scrollTop >= curOffsetTop - bodyRef.current.offsetTop - 40 - 10
      ) {
        dispatch(setNeedScroll(true))
        dispatch(setCheckAutoScroll(false))
        console.debug('need scroll')
      }
    }
  }, [autoScroll, checkAutoScroll, curOffsetTop, dispatch, floatKeyPointsSegIdx, needScroll, totalHeight])

  return <div className='relative'>
    <div className='absolute top-1 left-6 flex-center gap-1'>
      <AiOutlineAim className='cursor-pointer' onClick={posCallback} title='滚动到视频位置'/>
      {segments != null && segments.length > 1 &&
        <MdExpand className={classNames('cursor-pointer', foldAll ? 'text-accent' : '')} onClick={onFoldAll}
                  title='展开/折叠全部'/>}
    </div>
    <div className='flex justify-center'>
      <div className='tabs'>
        <a className={classNames('tab tab-sm tab-bordered', !compact && 'tab-active')}
           onClick={normalCallback}>列表视图</a>
        <a className={classNames('tab tab-sm tab-bordered', compact && 'tab-active')}
           onClick={compactCallback}>文章视图</a>
      </div>
    </div>
    <div className='absolute top-1 right-6'>
      {translateEnable && <div className='tooltip tooltip-left cursor-pointer' data-tip='点击切换自动翻译'
                               onClick={toggleAutoTranslateCallback}>
        <RiTranslate className={autoTranslate ? 'text-accent' : ''}/>
      </div>}
      {summarizeEnable &&
        <div className='tooltip tooltip-left cursor-pointer z-[100] ml-2' data-tip='总结全部' onClick={onSummarizeAll}>
          <FaClipboardList/>
        </div>}
      {noVideo && <div className='tooltip tooltip-left ml-2' data-tip='当前浏览器不支持视频跳转'>
        <IoWarning className='text-warning'/>
      </div>}
    </div>
    {!autoScroll && <div
      className='absolute z-[999] top-[96px] right-6 tooltip tooltip-left cursor-pointer rounded-full bg-primary/25 hover:bg-primary/75 text-primary-content p-1.5 text-xl'
      data-tip='开启自动滚动'
      onClick={onEnableAutoScroll}>
      <FaRegArrowAltCircleDown className={autoScroll ? 'text-accent' : ''}/>
    </div>}
    <div ref={bodyRef} onWheel={onWheel}
         className={classNames('flex flex-col gap-1.5 overflow-y-auto select-text scroll-smooth', floatKeyPointsSegIdx != null && 'pb-[100px]')}
         style={{
           height: `${totalHeight - HEADER_HEIGHT - TITLE_HEIGHT}px`
         }}
    >
      {segments?.map((segment, segmentIdx) => <SegmentCard key={segment.startIdx} segment={segment} segmentIdx={segmentIdx} bodyRef={bodyRef}/>)}
    </div>
  </div>
}

export default Body
