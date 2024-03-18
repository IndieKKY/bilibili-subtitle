import {useAppDispatch, useAppSelector} from './redux'
import {useContext, useEffect} from 'react'
import {
  setCurFetched,
  setCurIdx,
  setCurInfo,
  setCurrentTime,
  setData,
  setInfos,
  setNoVideo,
  setSegmentFold,
  setSegments,
  setTitle,
  setTotalHeight,
} from '../redux/envReducer'
import {EventBusContext} from '../Router'
import {
  EVENT_EXPAND,
  GEMINI_TOKENS,
  MODEL_DEFAULT,
  MODEL_MAP,
  TOTAL_HEIGHT_MAX,
  TOTAL_HEIGHT_MIN,
  WORDS_MIN,
  WORDS_RATE
} from '../const'
import {useInterval} from 'ahooks'
import {getWholeText} from '../util/biz_util'

/**
 * Service是单例，类似后端的服务概念
 */
const useSubtitleService = () => {
  const dispatch = useAppDispatch()
  const infos = useAppSelector(state => state.env.infos)
  const curInfo = useAppSelector(state => state.env.curInfo)
  const curFetched = useAppSelector(state => state.env.curFetched)
  const fold = useAppSelector(state => state.env.fold)
  const envReady = useAppSelector(state => state.env.envReady)
  const envData = useAppSelector(state => state.env.envData)
  const data = useAppSelector(state => state.env.data)
  const currentTime = useAppSelector(state => state.env.currentTime)
  const curIdx = useAppSelector(state => state.env.curIdx)
  const eventBus = useContext(EventBusContext)
  const needScroll = useAppSelector(state => state.env.needScroll)
  const segments = useAppSelector(state => state.env.segments)
  const transResults = useAppSelector(state => state.env.transResults)
  const hideOnDisableAutoTranslate = useAppSelector(state => state.env.envData.hideOnDisableAutoTranslate)
  const autoTranslate = useAppSelector(state => state.env.autoTranslate)

  // 监听消息
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      const data = event.data

      if (data.type === 'setVideoInfo') {
        dispatch(setInfos(data.infos))
        dispatch(setTitle(data.title))
        console.debug('video title: ', data.title)
      }

      if (data.type === 'setInfos') {
        dispatch(setInfos(data.infos))
        dispatch(setCurInfo(undefined))
        dispatch(setCurFetched(false))
        dispatch(setData(undefined))
        // console.log('setInfos', data.infos)
      }

      if (data.type === 'setSubtitle') {
        const data_ = data.data.data
        data_?.body?.forEach((item: TranscriptItem, idx: number) => {
          item.idx = idx
        })
        // dispatch(setCurInfo(data.data.info))
        dispatch(setCurFetched(true))
        dispatch(setData(data_))
        // console.log('setSubtitle', data.data)
      }

      if (data.type === 'setCurrentTime') {
        dispatch(setCurrentTime(data.data.currentTime))
      }
      if (data.type === 'setSettings') {
        dispatch(setNoVideo(data.data.noVideo))
        if (data.data.totalHeight) {
          dispatch(setTotalHeight(Math.min(Math.max(data.data.totalHeight, TOTAL_HEIGHT_MIN), TOTAL_HEIGHT_MAX)))
        }
      }
    }

    window.addEventListener('message', listener)

    return () => {
      window.removeEventListener('message', listener)
    }
  }, [dispatch, eventBus])

  // 有数据时自动展开
  useEffect(() => {
    if ((data != null) && data.body.length > 0) {
      eventBus.emit({
        type: EVENT_EXPAND
      })
    }
  }, [data, eventBus])

  // 当前未展示 & (未折叠 | 自动展开) & 有列表 => 展示第一个
  useEffect(() => {
    if (!curInfo && (!fold || (envReady && envData.autoExpand)) && (infos != null) && infos.length > 0) {
      dispatch(setCurInfo(infos[0]))
      dispatch(setCurFetched(false))
    }
  }, [curInfo, dispatch, envData.autoExpand, envReady, fold, infos])
  // 获取
  useEffect(() => {
    if (curInfo && !curFetched) {
      window.parent.postMessage({type: 'getSubtitle', info: curInfo}, '*')
    }
  }, [curFetched, curInfo])

  useEffect(() => {
    // 初始获取列表
    window.parent.postMessage({type: 'refreshVideoInfo'}, '*')
    // 初始获取设置信息
    window.parent.postMessage({type: 'getSettings'}, '*')
  }, [])

  // 更新当前位置
  useEffect(() => {
    let curIdx
    if (((data?.body) != null) && currentTime) {
      for (let i=0; i<data.body.length; i++) {
        const item = data.body[i]
        if (item.from && currentTime < item.from) {
          break
        } else {
          curIdx = i
        }
      }
    }
    dispatch(setCurIdx(curIdx))
  }, [currentTime, data?.body, dispatch])

  // 需要滚动 => segment自动展开
  useEffect(() => {
    if (needScroll && curIdx != null) { // 需要滚动
      for (const segment of segments??[]) { // 检测segments
        if (segment.startIdx <= curIdx && curIdx <= segment.endIdx) { // 找到对应的segment
          if (segment.fold) { // 需要展开
            dispatch(setSegmentFold({
              segmentStartIdx: segment.startIdx,
              fold: false
            }))
          }
          break
        }
      }
    }
  }, [curIdx, dispatch, needScroll, segments])

  // data等变化时自动刷新segments
  useEffect(() => {
    let segments: Segment[] | undefined
    const items = data?.body
    if (items != null) {
      if (envData.summarizeEnable) { // 分段
        let size = envData.words
        if (!size) { // 默认
          if (envData.aiType === 'gemini') {
            size = GEMINI_TOKENS*WORDS_RATE
          } else {
            size = (MODEL_MAP[envData.model??MODEL_DEFAULT]?.tokens??4000)*WORDS_RATE
          }
        }
        size = Math.max(size, WORDS_MIN)

        segments = []
        let transcriptItems: TranscriptItem[] = []
        let totalLength = 0
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          transcriptItems.push(item)
          totalLength += item.content.length
          if (totalLength >= size || i === items.length-1) { // new segment or last
            // add
            segments.push({
              items: transcriptItems,
              startIdx: transcriptItems[0].idx,
              endIdx: transcriptItems[transcriptItems.length - 1].idx,
              text: getWholeText(transcriptItems.map(item => item.content)),
              summaries: {},
            })
            // reset
            transcriptItems = []
            totalLength = 0
          }
        }
      } else { // 都放一个分段
        segments = [{
          items,
          startIdx: 0,
          endIdx: items.length-1,
          text: getWholeText(items.map(item => item.content)),
          summaries: {},
        }]
      }
    }
    dispatch(setSegments(segments))
  }, [data?.body, dispatch, envData.summarizeEnable, envData.words])

  // 每秒更新当前视频时间
  useInterval(() => {
    window.parent.postMessage({type: 'getCurrentTime'}, '*')
  }, 500)

  // show translated text in the video
  useEffect(() => {
    if (hideOnDisableAutoTranslate && !autoTranslate) {
      window.parent.postMessage({type: 'updateTransResult'}, '*')
      return
    }

    const transResult = curIdx?transResults[curIdx]:undefined
    if (transResult?.code === '200' && transResult.data) {
      window.parent.postMessage({type: 'updateTransResult', result: transResult.data}, '*')
    } else {
      window.parent.postMessage({type: 'updateTransResult'}, '*')
    }
  }, [autoTranslate, curIdx, hideOnDisableAutoTranslate, transResults])
}

export default useSubtitleService
