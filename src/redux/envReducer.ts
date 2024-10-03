import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {find, findIndex} from 'lodash-es'
import {DEFAULT_SERVER_URL_OPENAI, TOTAL_HEIGHT_DEF} from '../const'

interface EnvState {
  envData: EnvData
  envReady: boolean

  tempData: TempData
  tempReady: boolean

  fold: boolean // fold app
  foldAll?: boolean // fold all segments
  page?: string
  autoTranslate?: boolean
  autoScroll?: boolean
  checkAutoScroll?: boolean
  curOffsetTop?: number
  floatKeyPointsSegIdx?: number // segment的startIdx

  noVideo?: boolean
  totalHeight: number
  curIdx?: number // 从0开始
  needScroll?: boolean
  currentTime?: number
  infos?: any[]
  curInfo?: any
  curFetched?: boolean
  data?: Transcript
  uploadedTranscript?: Transcript
  segments?: Segment[]
  url?: string
  title?: string

  taskIds?: string[]
  transResults: { [key: number]: TransResult }
  lastTransTime?: number
  lastSummarizeTime?: number

  // ask
  asks: AskInfo[]

  /**
   * 是否输入中（中文）
   */
  inputting: boolean

  searchText: string
  searchResult: Record<string, boolean>

  //当前视频是否计算过操作
  reviewAction: boolean
}

const initialState: EnvState = {
  envData: {
    serverUrl: DEFAULT_SERVER_URL_OPENAI,
    translateEnable: true,
    summarizeEnable: true,
    autoExpand: true,
    theme: 'light',
    searchEnabled: true,
  },
  tempData: {
    curSummaryType: 'overview',
  },
  totalHeight: TOTAL_HEIGHT_DEF,
  autoScroll: true,
  envReady: false,
  tempReady: false,
  fold: true,
  transResults: {},

  inputting: false,

  searchText: '',
  searchResult: {},

  asks: [],

  reviewAction: false,
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
    setTempData: (state, action: PayloadAction<Partial<TempData>>) => {
      state.tempData = {
        ...state.tempData,
        ...action.payload,
      }
    },
    setReviewAction: (state, action: PayloadAction<boolean>) => {
      state.reviewAction = action.payload
    },
    setTempReady: (state) => {
      state.tempReady = true
    },
    setSearchText: (state, action: PayloadAction<string>) => {
      state.searchText = action.payload
    },
    setSearchResult: (state, action: PayloadAction<Record<string, boolean>>) => {
      state.searchResult = action.payload
    },
    setFloatKeyPointsSegIdx: (state, action: PayloadAction<number | undefined>) => {
      state.floatKeyPointsSegIdx = action.payload
    },
    setFoldAll: (state, action: PayloadAction<boolean>) => {
      state.foldAll = action.payload
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
      state.taskIds = [...(state.taskIds ?? []), action.payload]
    },
    delTaskId: (state, action: PayloadAction<string>) => {
      state.taskIds = state.taskIds?.filter(id => id !== action.payload)
    },
    addTransResults: (state, action: PayloadAction<{ [key: number]: TransResult }>) => {
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
    addAskInfo: (state, action: PayloadAction<AskInfo>) => {
      state.asks.push(action.payload)
    },
    delAskInfo: (state, action: PayloadAction<string>) => {
      state.asks = state.asks.filter(ask => ask.id !== action.payload)
    },
    mergeAskInfo: (state, action: PayloadAction<PartialOfAskInfo>) => {
      const idx = findIndex(state.asks, {id: action.payload.id})
      if (idx >= 0) {
        state.asks[idx] = {
          ...state.asks[idx],
          ...action.payload,
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
    setNeedScroll: (state, action: PayloadAction<boolean>) => {
      state.needScroll = action.payload
    },
    setCurrentTime: (state, action: PayloadAction<number | undefined>) => {
      state.currentTime = action.payload
    },
    setUrl: (state, action: PayloadAction<string | undefined>) => {
      state.url = action.payload
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
    setInputting: (state, action: PayloadAction<boolean>) => {
      state.inputting = action.payload
    },
  },
})

export const {
  setUrl,
  setTempReady,
  setTempData,
  setUploadedTranscript,
  setTotalHeight,
  setCheckAutoScroll,
  setCurOffsetTop,
  setFloatKeyPointsSegIdx,
  setFoldAll,
  setSegmentFold,
  setSummaryContent,
  setSummaryStatus,
  setSummaryError,
  setTitle,
  setSegments,
  setLastSummarizeTime,
  setPage,
  setLastTransTime,
  clearTransResults,
  addTransResults,
  addTaskId,
  delTaskId,
  setTaskIds,
  setAutoTranslate,
  setAutoScroll,
  setNoVideo,
  setReviewAction,
  setNeedScroll,
  setCurIdx,
  setEnvData,
  setEnvReady,
  setCurrentTime,
  setInfos,
  setCurInfo,
  setCurFetched,
  setData,
  setFold,
  setSearchText,
  setSearchResult,
  setInputting,
  addAskInfo,
  delAskInfo,
  mergeAskInfo,
} = slice.actions

export default slice.reducer
