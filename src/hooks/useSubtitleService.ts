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
  setUrl,
  setTempData,
} from '../redux/envReducer'
import {EventBusContext} from '../Router'
import {EVENT_EXPAND, GEMINI_TOKENS, TOTAL_HEIGHT_MAX, TOTAL_HEIGHT_MIN, WORDS_MIN, WORDS_RATE} from '../consts/const'
import {useAsyncEffect, useInterval} from 'ahooks'
import {getModelMaxTokens, getWholeText} from '../utils/bizUtil'
import { useMessage } from './useMessageService'

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
  const reviewed = useAppSelector(state => state.env.tempData.reviewed)
  const reviewActions = useAppSelector(state => state.env.tempData.reviewActions)
  const {sendInject} = useMessage(!!envData.sidePanel)

  //如果reviewActions达到15次，则设置reviewed为false
  useEffect(() => {
    if (reviewed === undefined && reviewActions && reviewActions >= 15) {
      dispatch(setTempData({
        reviewed: false
      }))
    }
  }, [reviewActions, dispatch, reviewed])

  // 有数据时自动展开
  useEffect(() => {
    if ((data != null) && data.body.length > 0) {
      eventBus.emit({
        type: EVENT_EXPAND
      })
    }
  }, [data, eventBus, infos])

  // 当前未展示 & (未折叠 | 自动展开) & 有列表 => 展示第一个
  useEffect(() => {
    let autoExpand = envData.autoExpand
    // 如果显示在侧边栏，则自动展开
    if (envData.sidePanel) {
      autoExpand = true
    }
    if (!curInfo && (!fold || (envReady && autoExpand)) && (infos != null) && infos.length > 0) {
      dispatch(setCurInfo(infos[0]))
      dispatch(setCurFetched(false))
    }
  }, [curInfo, dispatch, envData.autoExpand, envReady, fold, infos])
  // 获取
  useEffect(() => {
    if (curInfo && !curFetched) {
      sendInject(null, 'GET_SUBTITLE', {info: curInfo}).then(data => {
        data?.body?.forEach((item: TranscriptItem, idx: number) => {
          item.idx = idx
        })
        // dispatch(setCurInfo(data.data.info))
        dispatch(setCurFetched(true))
        dispatch(setData(data))

        console.log('subtitle', data)
      })
    }
  }, [curFetched, curInfo])

  useAsyncEffect(async () => {
    // 初始获取列表
    sendInject(null, 'REFRESH_VIDEO_INFO', {force: true})
  }, [])

  useAsyncEffect(async () => {
    // 更新设置信息
    sendInject(null, 'GET_VIDEO_ELEMENT_INFO', {}).then(info => {
      dispatch(setNoVideo(info.noVideo))
      if (envData.sidePanel) {
        // get screen height
        dispatch(setTotalHeight(window.innerHeight))
      }else {
        dispatch(setTotalHeight(Math.min(Math.max(info.totalHeight, TOTAL_HEIGHT_MIN), TOTAL_HEIGHT_MAX)))
      }
    })
  }, [envData.sidePanel, infos])

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
            size = getModelMaxTokens(envData)*WORDS_RATE
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
  }, [data?.body, dispatch, envData])

  // 每0.5秒更新当前视频时间
  useInterval(() => {
    sendInject(null, 'GET_VIDEO_STATUS', {}).then(status => {
      dispatch(setCurrentTime(status.currentTime))
    })
  }, 500)

  // show translated text in the video
  useEffect(() => {
    if (hideOnDisableAutoTranslate && !autoTranslate) {
      sendInject(null, 'HIDE_TRANS', {})
      return
    }

    const transResult = curIdx?transResults[curIdx]:undefined
    if (transResult?.code === '200' && transResult.data) {
      sendInject(null, 'UPDATE_TRANS_RESULT', {result: transResult.data})
    } else {
      sendInject(null, 'HIDE_TRANS', {})
    }
  }, [autoTranslate, curIdx, hideOnDisableAutoTranslate, transResults])
}

export default useSubtitleService
