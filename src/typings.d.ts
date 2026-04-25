interface MethodContext {
  from: 'extension' | 'inject' | 'app'
  event: any
  tabId?: number
  // sender?: chrome.runtime.MessageSender | null
}

interface EnvData {
  sidePanel?: boolean
  manualInsert?: boolean // 是否手动插入字幕列表
  autoExpand?: boolean
  flagDot?: boolean

  // ai backend
  backend?: AIBackendType

  // openai
  apiKey?: string
  serverUrl?: string
  model?: string
  customModel?: string
  customModelTokens?: number

  translateEnable?: boolean
  language?: string
  hideOnDisableAutoTranslate?: boolean
  transDisplay?: 'target' | 'originPrimary' | 'targetPrimary'
  fetchAmount?: number
  summarizeEnable?: boolean
  summarizeLanguage?: string
  words?: number
  summarizeFloat?: boolean
  theme?: 'system' | 'light' | 'dark'
  fontSize?: 'normal' | 'large'

  // chapter
  chapterMode?: boolean // 是否启用章节模式，undefined/null/true表示启用，false表示禁用

  // search
  searchEnabled?: boolean
  cnSearchEnabled?: boolean

  // ask
  askEnabled?: boolean

  prompts?: {
    [key: string]: string
  }
}

interface TempData {
  curSummaryType: SummaryType
  downloadType?: string
  compact?: boolean // 是否紧凑视图
  reviewActions?: number // 点击或总结行为达到一定次数后，显示评分（一个视频最多只加1次）
  reviewed?: boolean // 是否点击过评分,undefined: 不显示；true: 已点击；false: 未点击(需要显示)
}

interface TaskDef {
  type: 'chatComplete'
  serverUrl?: string
  backend?: AIBackendType
  data: any
  extra?: any
}

interface Task {
  id: string
  startTime: number
  endTime?: number
  def: TaskDef

  status: 'pending' | 'running' | 'done'
  error?: string
  resp?: any
}

interface TransResult {
  // idx: number
  code?: '200' | '500'
  data?: string
}

type ShowElement = string | JSX.Element | undefined

interface Transcript {
  body: TranscriptItem[]
}

interface TranscriptItem {
  from: number
  to: number
  content: string

  idx: number
}

interface Chapter {
  from: number
  to: number
  content: string // 标题
}

interface Segment {
  items: TranscriptItem[]
  startIdx: number // 从1开始
  endIdx: number
  text: string
  fold?: boolean
  chapterTitle?: string // 章节标题
  summaries: {
    [type: string]: Summary
  }
}

interface OverviewItem {
  time: string
  emoji: string
  key: string
}

interface Summary {
  type: SummaryType

  status: SummaryStatus
  error?: string
  content?: any
}

interface AskInfo {
  id: string
  fold?: boolean
  question: string
  status: SummaryStatus
  error?: string
  content?: string
}

type PartialOfAskInfo = Partial<PartOfAskInfo>

/**
 * 概览
 */
interface OverviewSummary extends Summary {
  content?: OverviewItem[]
}

/**
 * 要点
 */
interface KeypointSummary extends Summary {
  content?: string[]
}

/**
 * 总结
 */
interface BriefSummary extends Summary {
  content?: {
    summary: string
  }
}

type SummaryStatus = 'init' | 'pending' | 'done'
type SummaryType = 'overview' | 'keypoint' | 'brief' | 'question' | 'debate'

interface DebateMessage {
  side: 'pro' | 'con'
  content: string
}

interface DebateProps {
  messages: DebateMessage[]
}

type AIBackendType = 'openai' | 'ollama' | 'generic'

interface AIModelConfig {
  backend: AIBackendType
  serverUrl?: string
  apiKey?: string
  model?: string
  customModel?: string
  customModelTokens?: number
}

interface BookmarkItem {
  id: string
  videoId: string
  videoTitle?: string
  segmentStartIdx?: number
  itemIdx?: number
  from: number
  to: number
  content: string
  translatedContent?: string
  createdAt: number
  note?: string
}

interface BookmarkSegment {
  id: string
  videoId: string
  videoTitle?: string
  segmentStartIdx: number
  startIdx: number
  endIdx: number
  items: TranscriptItem[]
  createdAt: number
  note?: string
}

interface CachedSubtitle {
  videoId: string
  videoTitle?: string
  cid: string
  lan: string
  lanDoc: string
  subtitleUrl: string
  data: Transcript
  cachedAt: number
}

interface ExportConfig {
  format: 'txt' | 'srt' | 'vtt' | 'json' | 'csv'
  includeTime: boolean
  includeTranslation: boolean
  includeNotes: boolean
}
