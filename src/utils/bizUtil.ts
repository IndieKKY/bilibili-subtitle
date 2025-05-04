import {APP_DOM_ID, CUSTOM_MODEL_TOKENS, MODEL_DEFAULT, MODEL_MAP, SUMMARIZE_TYPES} from '../consts/const'
import {isDarkMode} from '@kky002/kky-util'
import toast from 'react-hot-toast'
import {findIndex} from 'lodash-es'
export const debug = (...args: any[]) => {
  console.debug('[APP]', ...args)
}

/**
 * 获取译文
 */
export const getTransText = (transResult: TransResult, hideOnDisableAutoTranslate: boolean | undefined, autoTranslate: boolean | undefined) => {
  if (transResult && (!transResult.code || transResult.code === '200') && (autoTranslate === true || !hideOnDisableAutoTranslate) && transResult.data) {
    return transResult.data
  }
}

export const getDisplay = (transDisplay_: EnvData['transDisplay'], content: string, transText: string | undefined) => {
  const transDisplay = transDisplay_ ?? 'originPrimary'
  let main, sub
  // main
  if (transText && (transDisplay === 'targetPrimary' || transDisplay === 'target')) {
    main = transText
  } else {
    main = content
  }
  // sub
  switch (transDisplay) {
    case 'originPrimary':
      sub = transText
      break
    case 'targetPrimary':
      if (transText) {
        sub = content
      }
      break
    default:
      break
  }
  // return
  return {
    main,
    sub,
  }
}

export const getWholeText = (items: string[]) => {
  return items.join(',').replaceAll('\n', ' ')
}

export const getLastTime = (seconds: number) => {
  if (seconds > 60 * 60) {
    return `${Math.floor(seconds / 60 / 60)}小时`
  }
  if (seconds > 60) {
    return `${Math.floor(seconds / 60)}分钟`
  }
  return `${Math.floor(seconds)}秒`
}

/**
 * 00:00:00
 */
export const getTimeDisplay = (seconds: number) => {
  const h = Math.floor(seconds / 60 / 60)
  const m = Math.floor(seconds / 60 % 60)
  const s = Math.floor(seconds % 60)
  return `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
}

export const isSummaryEmpty = (summary: Summary) => {
  if (summary.type === 'overview') {
    const content: OverviewItem[] = summary.content??[]
    return content.length === 0
  } else if (summary.type === 'keypoint') {
    const content: string[] = summary.content??[]
    return content.length === 0
  } else if (summary.type === 'brief') {
    const content: string[] = summary.content??''
    return content.length === 0
  } else if (summary.type === 'question') {
    const content: any[] = summary.content??[]
    return content.length === 0
  } else if (summary.type === 'debate') {
    const content: Array<{ side: string, content: string }> = summary.content ?? []
    return content.length === 0
  }
  return true
}

export const getSummaryStr = (summary: Summary) => {
  let s = ''
  if (summary.type === 'overview') {
    const content: OverviewItem[] = summary.content ?? []
    for (const overviewItem of content) {
      s += (overviewItem.emoji ?? '') + overviewItem.time + ' ' + overviewItem.key + '\n'
    }
  } else if (summary.type === 'keypoint') {
    const content: string[] = summary.content ?? []
    for (const keypoint of content) {
      s += '- ' + keypoint + '\n'
    }
  } else if (summary.type === 'brief') {
    const content: { summary: string } = summary.content ?? {
      summary: ''
    }
    s += content.summary + '\n'
  } else if (summary.type === 'question') {
    const content: Array<{ q: string, a: string }> = summary.content ?? []
    s += content.map(item => {
      return item.q + '\n' + item.a + '\n'
    }).join('\n')
  } else if (summary.type === 'debate') {
    const content: Array<{ side: string, content: string }> = summary.content ?? []
    s += content.map(item => {
      return (item.side === 'pro'?'正方：':'反方：') + item.content + '\n'
    }).join('\n')
  }
  return s
}

export const getServerUrl = (serverUrl?: string) => {
  if (!serverUrl) {
    return 'https://api.openai.com'
  }
  if (serverUrl.endsWith('/')) {
    serverUrl = serverUrl.slice(0, -1)
  }
  return serverUrl
}

export const getModel = (envData: EnvData) => {
  if (envData.model === 'custom') {
    return envData.customModel
  } else {
    return envData.model
  }
}

export const getModelMaxTokens = (envData: EnvData) => {
  if (envData.model === 'custom') {
    return envData.customModelTokens??CUSTOM_MODEL_TOKENS
  } else {
    return MODEL_MAP[envData.model??MODEL_DEFAULT]?.tokens??4000
  }
}

export const setTheme = (theme: EnvData['theme']) => {
  const appRoot = document.getElementById(APP_DOM_ID)
  if (appRoot != null) {
    // system
    theme = theme ?? 'system'
    if (!theme || theme === 'system') {
      theme = isDarkMode() ? 'dark' : 'light'
    }

    appRoot.setAttribute('data-theme', theme)
    if (theme === 'dark') {
      appRoot.classList.add('dark')
      appRoot.classList.remove('light')
    } else {
      appRoot.classList.add('light')
      appRoot.classList.remove('dark')
    }
  }
}

export const getSummarize = (title: string | undefined, segments: Segment[] | undefined, type: SummaryType): [boolean, string] => {
  if (segments == null) {
    return [false, '']
  }

  let content = `${SUMMARIZE_TYPES[type]?.downloadName ?? ''}\n\n`
  let success = false
  for (const segment of segments) {
    const summary = segment.summaries[type]
    if (summary && !isSummaryEmpty(summary)) {
      success = true
      content += getSummaryStr(summary)
    } else {
      if (segment.items.length > 0) {
        content += `${getTimeDisplay(segment.items[0].from)} `
      }
      content += '未总结\n'
    }
  }

  content += '\n--- 哔哩哔哩字幕列表扩展'

  if (!success) {
    toast.error('未找到总结')
  }

  return [success, content]
}

/**
 * 将 MM:SS 或 HH:MM:SS 格式的时间字符串转换为总秒数。
 * @param time '03:10' 或 '01:03:10' 格式的时间字符串
 * @returns number 总秒数，如果格式无效则返回 0 或 NaN (根据下面选择)。
 *                 建议添加更严格的错误处理，例如抛出错误。
 */
export const parseStrTimeToSeconds = (time: string): number => {
  // 1. 基本输入验证 (可选但推荐)
  if (!time || typeof time !== 'string') {
    console.warn(`Invalid input type for time: ${typeof time}`);
    return 0; // 或者 return NaN;
  }

  const parts = time.split(':');
  const partCount = parts.length;

  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  try {
    if (partCount === 2) {
      // 格式: MM:SS
      minutes = parseInt(parts[0]);
      seconds = parseInt(parts[1]);
    } else if (partCount === 3) {
      // 格式: HH:MM:SS
      hours = parseInt(parts[0]);
      minutes = parseInt(parts[1]);
      seconds = parseInt(parts[2]);
    } else {
      // 格式无效
      console.warn(`Invalid time format: "${time}". Expected MM:SS or HH:MM:SS.`);
      return 0; // 或者 return NaN;
    }

    // 2. 验证解析出的部分是否为有效数字
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
        console.warn(`Invalid numeric values in time string: "${time}"`);
        return 0; // 或者 return NaN;
    }

    // 3. 计算总秒数
    return hours * 3600 + minutes * 60 + seconds;

  } catch (error) {
    // 捕获潜在的错误 (虽然在此逻辑中不太可能，但以防万一)
    console.error(`Error parsing time string: "${time}"`, error);
    return 0; // 或者 return NaN;
  }
};

/**
 * @param time '00:04:11,599' or '00:04:11.599' or '04:11,599' or '04:11.599'
 * @return seconds, 4.599
 */
export const parseTime = (time: string): number => {
  const separator = time.includes(',') ? ',' : '.'
  const parts = time.split(':')
  const ms = parts[parts.length-1].split(separator)
  if (parts.length === 3) {
    return parseInt(parts[0]) * 60 * 60 + parseInt(parts[1]) * 60 + parseInt(ms[0]) + parseInt(ms[1]) / 1000
  } else {
    return parseInt(parts[0]) * 60 + parseInt(ms[0]) + parseInt(ms[1]) / 1000
  }
}

export const parseTranscript = (filename: string, text: string | ArrayBuffer): Transcript => {
  const items: TranscriptItem[] = []
  // convert /r/n to /n
  text = (text as string).trim().replace(/\r\n/g, '\n')
  // .srt:
  if (filename.toLowerCase().endsWith('.srt')) {
    const lines = text.split('\n\n')
    for (const line of lines) {
      try {
        const linesInner = line.trim().split('\n')
        if (linesInner.length >= 3) {
          const time = linesInner[1].split(' --> ')
          const from = parseTime(time[0])
          const to = parseTime(time[1])
          const content = linesInner.slice(2).join('\n')
          items.push({
            from,
            to,
            content,
            idx: items.length,
          })
        }
      } catch (e) {
        console.error('parse error', line)
      }
    }
  }
  // .vtt:
  if (filename.toLowerCase().endsWith('.vtt')) {
    const lines = text.split('\n\n')
    for (const line of lines) {
      const lines = line.split('\n')
      const timeIdx = findIndex(lines, (line) => line.includes('-->'))
      if (timeIdx >= 0) {
        const time = lines[timeIdx].split(' --> ')
        const from = parseTime(time[0])
        const to = parseTime(time[1])
        const content = lines.slice(timeIdx + 1).join('\n')
        items.push({
          from,
          to,
          content,
          idx: items.length,
        })
      }
    }
  }
  // return
  return {
    body: items,
  }
}

export const extractJsonObject = (content: string) => {
  // get content between ``` and ```
  const start = content.indexOf('```')
  const end = content.lastIndexOf('```')
  if (start >= 0 && end >= 0) {
    if (start === end) { // 异常情况
      if (content.startsWith('```')) {
        content = content.slice(3)
      } else {
        content = content.slice(0, -3)
      }
    } else {
      content = content.slice(start + 3, end)
    }
  }
  // get content between { and }
  const start2 = content.indexOf('{')
  const end2 = content.lastIndexOf('}')
  if (start2 >= 0 && end2 >= 0) {
    content = content.slice(start2, end2 + 1)
  }
  return content
}

export const extractJsonArray = (content: string) => {
  // get content between ``` and ```
  const start = content.indexOf('```')
  const end = content.lastIndexOf('```')
  if (start >= 0 && end >= 0) {
    if (start === end) { // 异常情况
      if (content.startsWith('```')) {
        content = content.slice(3)
      } else {
        content = content.slice(0, -3)
      }
    } else {
      content = content.slice(start + 3, end)
    }
  }
  // get content between [ and ]
  const start3 = content.indexOf('[')
  const end3 = content.lastIndexOf(']')
  if (start3 >= 0 && end3 >= 0) {
    content = content.slice(start3, end3 + 1)
  }
  return content
}
