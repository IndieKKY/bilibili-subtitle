import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {find} from 'lodash-es'
import {getDevData} from '../util/biz_util'
import {SERVER_URL_OPENAI, TOTAL_HEIGHT_DEF} from '../const'

interface EnvState {
  envData: EnvData
  envReady: boolean

  fold: boolean // fold app
  foldAll?: boolean // fold all segments
  page?: string
  autoTranslate?: boolean
  autoScroll?: boolean
  checkAutoScroll?: boolean
  curOffsetTop?: number
  compact?: boolean // 是否紧凑视图
  floatKeyPointsSegIdx?: number // segment的startIdx

  noVideo?: boolean
  totalHeight: number
  curIdx?: number // 从0开始
  needScroll?: boolean
  currentTime?: number
  downloadType?: string
  infos?: any[]
  curInfo?: any
  curFetched?: boolean
  data?: Transcript
  uploadedTranscript?: Transcript
  segments?: Segment[]
  title?: string
  curSummaryType: SummaryType

  taskIds?: string[]
  transResults: {[key: number]: TransResult}
  lastTransTime?: number
  lastSummarizeTime?: number
}

const initialState: EnvState = {
  envData: {
    serverUrl: SERVER_URL_OPENAI,
    translateEnable: true,
    summarizeEnable: true,
    theme: 'light',
  },
  totalHeight: TOTAL_HEIGHT_DEF,
  autoScroll: true,
  currentTime: import.meta.env.VITE_ENV === 'web-dev'? 30: undefined,
  envReady: false,
  fold: true,
  data: import.meta.env.VITE_ENV === 'web-dev'? getDevData(): undefined,
  transResults: {},
  curSummaryType: 'overview',
}

export const slice = createSlice({
  name: 'env',
  initialState,
  reducers: {
    setEnvData: (state, action: PayloadAction<EnvData>) => {
      state.envData = {
        ...state.envData,
        ...action.payload,
      }
    },
    setEnvReady: (state) => {
      state.envReady = true
    },
    setFloatKeyPointsSegIdx: (state, action: PayloadAction<number | undefined>) => {
      state.floatKeyPointsSegIdx = action.payload
    },
    setFoldAll: (state, action: PayloadAction<boolean>) => {
      state.foldAll = action.payload
    },
    setCurSummaryType: (state, action: PayloadAction<SummaryType>) => {
      state.curSummaryType = action.payload
    },
    setCompact: (state, action: PayloadAction<boolean>) => {
      state.compact = action.payload
    },
    setPage: (state, action: PayloadAction<string | undefined>) => {
      state.page = action.payload
    },
    setTotalHeight: (state, action: PayloadAction<number>) => {
      state.totalHeight = action.payload
    },
    setTaskIds: (state, action: PayloadAction<string[]>) => {
      state.taskIds = action.payload
    },
    setLastTransTime: (state, action: PayloadAction<number>) => {
      state.lastTransTime = action.payload
    },
    setLastSummarizeTime: (state, action: PayloadAction<number>) => {
      state.lastSummarizeTime = action.payload
    },
    addTaskId: (state, action: PayloadAction<string>) => {
      state.taskIds = [...(state.taskIds??[]), action.payload]
    },
    delTaskId: (state, action: PayloadAction<string>) => {
      state.taskIds = state.taskIds?.filter(id => id !== action.payload)
    },
    addTransResults: (state, action: PayloadAction<{[key: number]: TransResult}>) => {
      // 不要覆盖TransResult里code为200的
      for (const payloadKey in action.payload) {
        const payloadItem = action.payload[payloadKey]
        const stateItem = state.transResults[payloadKey]
        if (!stateItem || stateItem.code !== '200') {
          state.transResults[payloadKey] = payloadItem
        } else if (stateItem.code === '200') { // 保留data
          state.transResults[payloadKey] = {
            ...payloadItem,
            data: stateItem.data,
          }
        }
      }
    },
    setSummaryContent: (state, action: PayloadAction<{
      segmentStartIdx: number
      type: SummaryType
      content?: any
    }>) => {
      const segment = find(state.segments, {startIdx: action.payload.segmentStartIdx})
      if (segment != null) {
        let summary = segment.summaries[action.payload.type]
        if (!summary) {
          summary = {
            type: action.payload.type,
            status: 'done',
            content: action.payload.content,
          }
          segment.summaries[action.payload.type] = summary
        } else {
          summary.content = action.payload.content
        }
      }
    },
    setSummaryStatus: (state, action: PayloadAction<{
      segmentStartIdx: number
      type: SummaryType
      status: SummaryStatus
    }>) => {
      const segment = find(state.segments, {startIdx: action.payload.segmentStartIdx})
      if (segment != null) {
        let summary = segment.summaries[action.payload.type]
        if (summary) {
          summary.status = action.payload.status
        } else {
          summary = {
            type: action.payload.type,
            status: action.payload.status,
          }
          segment.summaries[action.payload.type] = summary
        }
      }
    },
    setSummaryError: (state, action: PayloadAction<{
      segmentStartIdx: number
      type: SummaryType
      error?: string
    }>) => {
      const segment = find(state.segments, {startIdx: action.payload.segmentStartIdx})
      if (segment != null) {
        let summary = segment.summaries[action.payload.type]
        if (summary) {
          summary.error = action.payload.error
        } else {
          summary = {
            type: action.payload.type,
            status: 'done',
            error: action.payload.error,
          }
          segment.summaries[action.payload.type] = summary
        }
      }
    },
    setSegmentFold: (state, action: PayloadAction<{
      segmentStartIdx: number
      fold: boolean
    }>) => {
      const segment = find(state.segments, {startIdx: action.payload.segmentStartIdx})
      if (segment != null) {
        segment.fold = action.payload.fold
      }
    },
    clearTransResults: (state) => {
      state.transResults = {}
    },
    setCurIdx: (state, action: PayloadAction<number | undefined>) => {
      state.curIdx = action.payload
    },
    setAutoTranslate: (state, action: PayloadAction<boolean>) => {
      state.autoTranslate = action.payload
    },
    setAutoScroll: (state, action: PayloadAction<boolean>) => {
      state.autoScroll = action.payload
    },
    setCheckAutoScroll: (state, action: PayloadAction<boolean>) => {
      state.checkAutoScroll = action.payload
    },
    setCurOffsetTop: (state, action: PayloadAction<number | undefined>) => {
      state.curOffsetTop = action.payload
    },
    setNoVideo: (state, action: PayloadAction<boolean>) => {
      state.noVideo = action.payload
    },
    setDownloadType: (state, action: PayloadAction<string>) => {
      state.downloadType = action.payload
    },
    setNeedScroll: (state, action: PayloadAction<boolean>) => {
      state.needScroll = action.payload
    },
    setCurrentTime: (state, action: PayloadAction<number | undefined>) => {
      state.currentTime = action.payload
    },
    setTitle: (state, action: PayloadAction<string | undefined>) => {
      state.title = action.payload
    },
    setInfos: (state, action: PayloadAction<any[]>) => {
      state.infos = action.payload
    },
    setCurInfo: (state, action: PayloadAction<any>) => {
      state.curInfo = action.payload
    },
    setCurFetched: (state, action: PayloadAction<boolean>) => {
      state.curFetched = action.payload
    },
    setData: (state, action: PayloadAction<Transcript | undefined>) => {
      state.data = action.payload
    },
    setUploadedTranscript: (state, action: PayloadAction<Transcript | undefined>) => {
      state.uploadedTranscript = action.payload
    },
    setSegments: (state, action: PayloadAction<Segment[] | undefined>) => {
      state.segments = action.payload
    },
    setFold: (state, action: PayloadAction<boolean>) => {
      state.fold = action.payload
    },
  },
})

export const { setCurSummaryType, setUploadedTranscript, setTotalHeight, setCheckAutoScroll, setCurOffsetTop, setFloatKeyPointsSegIdx, setFoldAll, setCompact, setSegmentFold, setSummaryContent, setSummaryStatus, setSummaryError, setTitle, setSegments, setLastSummarizeTime, setPage, setLastTransTime, clearTransResults, addTransResults, addTaskId, delTaskId, setTaskIds, setDownloadType, setAutoTranslate, setAutoScroll, setNoVideo, setNeedScroll, setCurIdx, setEnvData, setEnvReady, setCurrentTime, setInfos, setCurInfo, setCurFetched, setData, setFold } = slice.actions

export default slice.reducer
