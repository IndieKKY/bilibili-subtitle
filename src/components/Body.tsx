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
  PAGE_SETTINGS,
  SEARCH_BAR_HEIGHT,
  SUMMARIZE_ALL_THRESHOLD,
  TITLE_HEIGHT
} from '../consts/const'
import { FaClipboardList } from 'react-icons/fa'
import useTranslate from '../hooks/useTranslate'
import { openUrl } from '@kky002/kky-util'
import useKeyService from '../hooks/useKeyService'
import Ask from './Ask'
import { v4 } from 'uuid'
import RateExtension from '../components/RateExtension'
import ApiKeyReminder from './ApiKeyReminder'
import { useMessaging } from '@kky002/kky-message'

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
  const {disconnected} = useMessaging(DEFAULT_USE_PORT)
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
    const apiKey = envData.aiType === 'gemini' ? envData.geminiApiKey : envData.apiKey
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
  }, [addSummarizeTask, curSummaryType, envData.aiType, envData.apiKey, envData.geminiApiKey, segments])

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
    const apiKey = envData.aiType === 'gemini' ? envData.geminiApiKey : envData.apiKey
    if (apiKey) {
      dispatch(setAutoTranslate(!autoTranslate))
    } else {
      toast.error('请先在选项页面设置ApiKey!')
    }
  }, [autoTranslate, dispatch, envData.aiType, envData.apiKey, envData.geminiApiKey])

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
      const apiKey = envData.aiType === 'gemini' ? envData.geminiApiKey : envData.apiKey
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
  }, [addAskTask, dispatch, envData.aiType, envData.apiKey, envData.askEnabled, envData.geminiApiKey, searchText, segments])

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

      {/* <div className='flex flex-col items-center text-center pt-1 pb-2'> */}
      {/*  <div className='font-semibold text-accent'>💡<span className='underline underline-offset-4'>提示</span>💡</div> */}
      {/*  <div className='text-sm desc px-2'>可以尝试将<span className='text-amber-600 font-semibold'>概览</span>生成的内容粘贴到<span */}
      {/*    className='text-secondary/75 font-semibold'>视频评论</span>里，发布后看看有什么效果🥳 */}
      {/*  </div> */}
      {/*  {(segments?.length ?? 0) > 0 && <button className='mt-1.5 btn btn-xs btn-info' */}
      {/*                                          onClick={onCopy}>点击复制生成的{SUMMARIZE_TYPES[curSummaryType].name}<RiFileCopy2Line/> */}
      {/*  </button>} */}
      {/* </div> */}
      <div className='flex flex-col'>
         <div className='flex flex-col items-center text-center py-2 mx-4 border-t border-t-base-300'>
          <div className='font-semibold text-accent flex items-center gap-1'><img src='/bibigpt.png'
                                                                                  alt='BibiGPT logo'
                                                                                  className='w-8 h-8'/>BibiGPT
          </div>
          <div className='text-sm px-2 desc'>这是<span className='text-amber-600 font-semibold text-base'>网页</span>版的字幕列表，支持<span
            className='font-semibold'>任意</span>视频提取字幕总结（包括没有字幕的视频）
          </div>
          <div className='flex gap-2'>
            <a title='BibiGPT' href='https://bibigpt.co/r/bilibili'
               onClick={(e) => {
                 e.preventDefault()
                 openUrl('https://bibigpt.co/r/bilibili')
               }} className='link text-sm text-accent'>✨ BibiGPT ✨</a>
          </div>
         </div>
        <div className='flex flex-col items-center text-center py-2 mx-4 border-t border-t-base-300'>
          <div className='font-semibold text-accent flex items-center gap-1'><img src='/youtube-caption.png'
            alt='youtube caption logo'
            className='w-8 h-8' />YouTube Caption
          </div>
          <div className='text-sm px-2 desc'>这是<span className='text-amber-600 font-semibold text-base'>YouTube</span>版的字幕列表
          </div>
          <div className='flex gap-2'>
            <a title='Chrome商店' href='https://chromewebstore.google.com/detail/fiaeclpicddpifeflpmlgmbjgaedladf'
              onClick={(e) => {
                e.preventDefault()
                openUrl('https://chromewebstore.google.com/detail/fiaeclpicddpifeflpmlgmbjgaedladf')
              }} className='link text-sm text-accent'>Chrome商店</a>
            <a title='Edge商店'
              href='https://microsoftedge.microsoft.com/addons/detail/galeejdehabppfgooagmkclpppnbccpc'
              onClick={e => {
                e.preventDefault()
                openUrl('https://microsoftedge.microsoft.com/addons/detail/galeejdehabppfgooagmkclpppnbccpc')
              }} className='link text-sm text-accent'>Edge商店</a>
            <a title='Crx搜搜(国内可访问)'
              href='https://www.crxsoso.com/webstore/detail/fiaeclpicddpifeflpmlgmbjgaedladf'
              onClick={(e) => {
                e.preventDefault()
                openUrl('https://www.crxsoso.com/webstore/detail/fiaeclpicddpifeflpmlgmbjgaedladf')
              }} className='link text-sm text-accent'>Crx搜搜(国内可访问)</a>
          </div>
        </div>
        {/* <div className='flex flex-col items-center text-center py-2 mx-4 border-t border-t-base-300'> */}
        {/*  <div className='font-semibold text-accent flex items-center gap-1'><img src='/my-article-summarizer.png' */}
        {/*                                                                          alt='My Article Summarizer logo' */}
        {/*                                                                          className='w-8 h-8'/>My Article Summarizer */}
        {/*  </div> */}
        {/*  <div className='text-sm px-2 desc'>网页文章总结（有每日免费额度，无需apikey）。</div> */}
        {/*  <div className='flex gap-2'> */}
        {/*    <a title='Chrome商店' href='https://chromewebstore.google.com/detail/my-article-summarizer/nanlpakfialleijdidafldapoifndngn' */}
        {/*       onClick={(e) => { */}
        {/*         e.preventDefault() */}
        {/*         openUrl('https://chromewebstore.google.com/detail/my-article-summarizer/nanlpakfialleijdidafldapoifndngn') */}
        {/*       }} className='link text-sm text-accent'>Chrome商店</a> */}
        {/*    <a title='Crx搜搜(国内可访问)' */}
        {/*       href='https://www.crxsoso.com/webstore/detail/nanlpakfialleijdidafldapoifndngn' */}
        {/*       onClick={(e) => { */}
        {/*         e.preventDefault() */}
        {/*         openUrl('https://www.crxsoso.com/webstore/detail/nanlpakfialleijdidafldapoifndngn') */}
        {/*       }} className='link text-sm text-accent'>Crx搜搜(国内可访问)</a> */}
        {/*  </div> */}
        {/* </div> */}
      </div>
      <div className='p-2'><RateExtension /></div>
    </div>
    {/* recommend */}
    {/* <div className='p-0.5' style={{ */}
    {/*  height: `${RECOMMEND_HEIGHT}px` */}
    {/* }}> */}
    {/*  {recommendIdx === 0 && <div className='flex items-center gap-1.5 rounded shadow-sm bg-base-200/10'> */}
    {/*    <a className='link link-accent link-hover font-semibold text-sm flex items-center' onClick={(e) => { */}
    {/*      e.preventDefault() */}
    {/*      openUrl('https://bibigpt.co/r/bilibili') */}
    {/*    }}><img src='/bibigpt.png' */}
    {/*            alt='BibiGPT logo' */}
    {/*            className='w-8 h-8'/>✨ BibiGPT ✨</a> */}
    {/*    <span className='text-sm desc'>支持任意视频的网页版总结。</span> */}
    {/*  </div>} */}
    {/*  {recommendIdx === 1 && <div className='flex items-center gap-1 rounded shadow-sm bg-base-200/10'> */}
    {/*    <a className='link link-accent link-hover font-semibold text-sm flex items-center' onClick={(e) => { */}
    {/*      e.preventDefault() */}
    {/*      openUrl('https://chromewebstore.google.com/detail/fiaeclpicddpifeflpmlgmbjgaedladf') */}
    {/*    }}><img src='/youtube-caption.png' */}
    {/*            alt='youtube caption logo' */}
    {/*            className='w-8 h-8'/>YouTube Caption</a> */}
    {/*    <span className='text-sm desc'>YouTube版的字幕列表。</span> */}
    {/*  </div>} */}
    {/*  {recommendIdx === 2 && <div className='flex items-center gap-1 rounded shadow-sm bg-base-200/10'> */}
    {/*    <a className='link link-accent link-hover font-semibold text-sm flex items-center' onClick={(e) => { */}
    {/*      e.preventDefault() */}
    {/*      openUrl('https://chromewebstore.google.com/detail/nanlpakfialleijdidafldapoifndngn') */}
    {/*    }}><img src='/my-article-summarizer.png' */}
    {/*            alt='My Article Summarizer logo' */}
    {/*            className='w-8 h-8'/>My Article Summarizer</a> */}
    {/*    <span className='text-sm desc'>网页文章总结。</span> */}
    {/*  </div>} */}
    {/*  {recommendIdx === 3 && <div className='flex items-center gap-1 rounded shadow-sm bg-base-200/10'> */}
    {/*    <a className='link link-accent link-hover font-semibold text-sm flex items-center' onClick={(e) => { */}
    {/*      e.preventDefault() */}
    {/*      openUrl('https://api.openai-up.com/register?aff=varM') */}
    {/*    }}><img src='/openai-up.ico' */}
    {/*            alt='Openai Up logo' */}
    {/*            className='w-8 h-8'/>Openai代理</a> */}
    {/*    <span className='text-sm desc flex items-center'>目前价格不到官方的6折<FaGripfire */}
    {/*      className='text-amber-600'/></span> */}
    {/*  </div>} */}
    {/* </div> */}
  </div>
}

export default Body
