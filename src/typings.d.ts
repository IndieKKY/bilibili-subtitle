interface EnvData {
  autoExpand?: boolean
  flagDot?: boolean

  aiType?: 'openai' | 'gemini'
  // openai
  apiKey?: string
  serverUrl?: string
  model?: string
  customModel?: string
  customModelTokens?: number
  // gemini
  geminiApiKey?: string

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
}

interface TaskDef {
  type: 'chatComplete' | 'geminiChatComplete'
  serverUrl?: string
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

interface Segment {
  items: TranscriptItem[]
  startIdx: number // 从1开始
  endIdx: number
  text: string
  fold?: boolean
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
type SummaryType = 'overview' | 'keypoint' | 'brief'
