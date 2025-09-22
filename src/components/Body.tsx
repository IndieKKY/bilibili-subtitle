import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  addAskInfo,
  mergeAskInfo,
  setAutoScroll,
  setAutoTranslate,
  setCheckAutoScroll,
  setFoldAll,
  setNeedScroll,
  setSearchText,
  setSegmentFold,
  setTempData
} from '../redux/envReducer'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import {
  AiOutlineAim,
  AiOutlineCloseCircle,
  FaRegArrowAltCircleDown,
  IoWarning,
  MdExpand,
  RiTranslate
} from 'react-icons/all'
import classNames from 'classnames'
import toast from 'react-hot-toast'
import SegmentCard from './SegmentCard'
import {
  ASK_ENABLED_DEFAULT,
  DEFAULT_USE_PORT,
  HEADER_HEIGHT,
  SEARCH_BAR_HEIGHT,
  SUMMARIZE_ALL_THRESHOLD,
  TITLE_HEIGHT
} from '../consts/const'
import { FaClipboardList } from 'react-icons/fa'
import useTranslate from '../hooks/useTranslate'
import { openUrl } from '../utils/env_util'
import useKeyService from '../hooks/useKeyService'
import Ask from './Ask'
import { v4 } from 'uuid'
import RateExtension from '../components/RateExtension'
import ApiKeyReminder from './ApiKeyReminder'
import { useMessaging } from '../message'

const Body = () => {
  const dispatch = useAppDispatch()
  const inputting = useAppSelector(state => state.env.inputting)
  const noVideo = useAppSelector(state => state.env.noVideo)
  const autoTranslate = useAppSelector(state => state.env.autoTranslate)
  const autoScroll = useAppSelector(state => state.env.autoScroll)
  const segments = useAppSelector(state => state.env.segments)
  const foldAll = useAppSelector(state => state.env.foldAll)
  const envData = useAppSelector(state => state.env.envData)
  const compact = useAppSelector(state => state.env.tempData.compact)
  const floatKeyPointsSegIdx = useAppSelector(state => state.env.floatKeyPointsSegIdx)
  const translateEnable = useAppSelector(state => state.env.envData.translateEnable)
  const summarizeEnable = useAppSelector(state => state.env.envData.summarizeEnable)
  const { addSummarizeTask, addAskTask } = useTranslate()
  // const infos = useAppSelector(state => state.env.infos)
  const bodyRef = useRef<any>()
  const curOffsetTop = useAppSelector(state => state.env.curOffsetTop)
  const checkAutoScroll = useAppSelector(state => state.env.checkAutoScroll)
  const needScroll = useAppSelector(state => state.env.needScroll)
  const totalHeight = useAppSelector(state => state.env.totalHeight)
  const curSummaryType = useAppSelector(state => state.env.tempData.curSummaryType)
  // const title = useAppSelector(state => state.env.title)
  // const fontSize = useAppSelector(state => state.env.envData.fontSize)
  const searchText = useAppSelector(state => state.env.searchText)
  const asks = useAppSelector(state => state.env.asks)
  const { disconnected } = useMessaging(DEFAULT_USE_PORT)
  // const recommendIdx = useMemo(() => random(0, 3), [])
  const showSearchInput = useMemo(() => {
    return (segments != null && segments.length > 0) && (envData.searchEnabled ? envData.searchEnabled : (envData.askEnabled ?? ASK_ENABLED_DEFAULT))
  }, [envData.askEnabled, envData.searchEnabled, segments])
  const searchPlaceholder = useMemo(() => {
    let placeholder = ''
    if (envData.searchEnabled) {
      if (envData.askEnabled ?? ASK_ENABLED_DEFAULT) {
        placeholder = '搜索或提问字幕内容(按Enter提问)'
      } else {
        placeholder = '搜索字幕内容'
      }
    } else {
      if (envData.askEnabled ?? ASK_ENABLED_DEFAULT) {
        placeholder = '提问字幕内容'
      }
    }
    return placeholder
  }, [envData.askEnabled, envData.searchEnabled])

  const normalCallback = useCallback(() => {
    dispatch(setTempData({
      compact: false
    }))
  }, [dispatch])

  const compactCallback = useCallback(() => {
    dispatch(setTempData({
      compact: true
    }))
  }, [dispatch])

  const posCallback = useCallback(() => {
    dispatch(setNeedScroll(true))
  }, [dispatch])

  const onSummarizeAll = useCallback(() => {
    const apiKey = envData.apiKey
    if (!apiKey) {
      toast.error('请先在选项页面设置ApiKey!')
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
        addSummarizeTask(curSummaryType, segment).catch(console.error)
      }
      toast.success(`已添加${segments_.length}个总结任务!`)
    }
  }, [addSummarizeTask, curSummaryType, envData.apiKey, segments])

  const onFoldAll = useCallback(() => {
    dispatch(setFoldAll(!foldAll))
    for (const ask of asks) {
      dispatch(mergeAskInfo({
        id: ask.id,
        fold: !foldAll
      }))
    }
    for (const segment of segments ?? []) {
      dispatch(setSegmentFold({
        segmentStartIdx: segment.startIdx,
        fold: !foldAll
      }))
    }
  }, [asks, dispatch, foldAll, segments])

  const toggleAutoTranslateCallback = useCallback(() => {
    const apiKey = envData.apiKey
    if (apiKey) {
      dispatch(setAutoTranslate(!autoTranslate))
    } else {
      toast.error('请先在选项页面设置ApiKey!')
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

  // const onCopy = useCallback(() => {
  //   const [success, content] = getSummarize(title, segments, curSummaryType)
  //   if (success) {
  //     navigator.clipboard.writeText(content).then(() => {
  //       toast.success('复制成功')
  //     }).catch(console.error)
  //   }
  // }, [curSummaryType, segments, title])

  const onSearchTextChange = useCallback((e: any) => {
    const searchText = e.target.value
    dispatch(setSearchText(searchText))
  }, [dispatch])

  const onClearSearchText = useCallback(() => {
    dispatch(setSearchText(''))
  }, [dispatch])

  const onAsk = useCallback(() => {
    if ((envData.askEnabled ?? ASK_ENABLED_DEFAULT) && searchText) {
      const apiKey = envData.apiKey
      if (apiKey) {
        if (segments != null && segments.length > 0) {
          const id = v4()
          addAskTask(id, segments[0], searchText).catch(console.error)
          // 添加ask
          dispatch(addAskInfo({
            id,
            question: searchText,
            status: 'pending',
          }))
        }
      } else {
        toast.error('请先在选项页面设置ApiKey!')
      }
    }
  }, [addAskTask, dispatch, envData.apiKey, envData.askEnabled, searchText, segments])

  // service
  useKeyService()

  // 自动滚动
  useEffect(() => {
    if (checkAutoScroll && curOffsetTop && autoScroll && !needScroll) {
      if (bodyRef.current.scrollTop <= curOffsetTop - bodyRef.current.offsetTop - (totalHeight - 160) + (floatKeyPointsSegIdx != null ? 100 : 0) ||
        bodyRef.current.scrollTop >= curOffsetTop - bodyRef.current.offsetTop - 40 - 10
      ) {
        dispatch(setNeedScroll(true))
        dispatch(setCheckAutoScroll(false))
        console.debug('need scroll')
      }
    }
  }, [autoScroll, checkAutoScroll, curOffsetTop, dispatch, floatKeyPointsSegIdx, needScroll, totalHeight])

  return <div className='relative'>
    {/* title */}
    <div className='absolute top-1 left-6 flex-center gap-1'>
      <AiOutlineAim className='cursor-pointer' onClick={posCallback} title='滚动到视频位置' />
      {segments != null && segments.length > 0 &&
        <MdExpand className={classNames('cursor-pointer', foldAll ? 'text-accent' : '')} onClick={onFoldAll}
          title='展开/折叠全部' />}
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
        <RiTranslate className={autoTranslate ? 'text-accent' : ''} />
      </div>}
      {summarizeEnable &&
        <div className='tooltip tooltip-left cursor-pointer z-[100] ml-2' data-tip='总结全部' onClick={onSummarizeAll}>
          <FaClipboardList />
        </div>}
      {noVideo && <div className='tooltip tooltip-left ml-2' data-tip='当前浏览器不支持视频跳转'>
        <IoWarning className='text-warning' />
      </div>}
    </div>

    {/* search */}
    {showSearchInput && <div className='px-2 py-1 flex flex-col relative'>
      <input type='text' className='input input-xs bg-base-200' placeholder={searchPlaceholder} value={searchText} onChange={onSearchTextChange} onKeyDown={e => {
        // enter
        if (e.key === 'Enter') {
          if (!inputting) {
            e.preventDefault()
            e.stopPropagation()
            onAsk()
            dispatch(setSearchText(''))
          }
        }
      }} />
      {searchText && <button className='absolute top-1 right-2 btn btn-ghost btn-xs btn-circle text-base-content/75' onClick={onClearSearchText}><AiOutlineCloseCircle /></button>}
    </div>}

    {disconnected && <div className='flex flex-col justify-center items-center gap-2 text-sm bg-red-400 rounded mx-2'>
      <span className='flex items-center gap-1 text-white'><AiOutlineCloseCircle className='text-white' />已断开连接</span>
    </div>}

    {/* auto scroll btn */}
    {!autoScroll && <div
      className='absolute z-[999] top-[96px] right-6 tooltip tooltip-left cursor-pointer rounded-full bg-primary/25 hover:bg-primary/75 text-primary-content p-1.5 text-xl'
      data-tip='开启自动滚动'
      onClick={onEnableAutoScroll}>
      <FaRegArrowAltCircleDown className={autoScroll ? 'text-accent' : ''} />
    </div>}

    {/* body */}
    <div ref={bodyRef} onWheel={onWheel}
      className={classNames('flex flex-col gap-1.5 overflow-y-auto select-text scroll-smooth', floatKeyPointsSegIdx != null && 'pb-[100px]')}
      style={{
        height: `${totalHeight - HEADER_HEIGHT - TITLE_HEIGHT - (showSearchInput ? SEARCH_BAR_HEIGHT : 0)}px`
      }}
    >
      {/* asks */}
      {asks.map(ask => <Ask key={ask.id} ask={ask} />)}

      {/* segments */}
      {segments?.map((segment, segmentIdx) => <SegmentCard key={segment.startIdx} segment={segment}
        segmentIdx={segmentIdx} bodyRef={bodyRef} />)}

      {/* tip */}
      <div className='text-sm font-semibold text-center'>快捷键提示</div>
      <ul className='list-disc text-sm desc pl-5'>
        <li>单击字幕跳转，双击字幕跳转+切换暂停。</li>
        <li>alt+单击字幕复制单条字幕。</li>
        <li>上下方向键来移动当前字幕(可先点击字幕使焦点在字幕列表内)。</li>
      </ul>

      <ApiKeyReminder />

      <RateExtension />
    </div>
  </div>
}

export default Body
