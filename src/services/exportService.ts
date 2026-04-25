import { formatTime, formatSrtTime, formatVttTime, downloadText } from '../utils/util'
import dayjs from 'dayjs'

export interface ExportOptions {
  format: 'txt' | 'srt' | 'vtt' | 'json' | 'csv'
  includeTime: boolean
  includeTranslation: boolean
  includeNotes: boolean
  transResults?: { [key: number]: TransResult }
}

export const exportSubtitle = (
  data: Transcript,
  title: string | undefined,
  url: string | undefined,
  author: string | undefined,
  ctime: number | null | undefined,
  options: ExportOptions
): string => {
  const { format, includeTime, includeTranslation, includeNotes, transResults } = options

  const time = ctime ? dayjs(ctime * 1000).format('YYYY-MM-DD HH:mm:ss') : ''

  switch (format) {
    case 'txt':
      return exportAsTxt(data, title, url, author, time, includeTime, includeTranslation, transResults)
    case 'srt':
      return exportAsSrt(data, includeTranslation, transResults)
    case 'vtt':
      return exportAsVtt(data, title, includeTranslation, transResults)
    case 'json':
      return exportAsJson(data, title, url, author, time, includeTranslation, transResults)
    case 'csv':
      return exportAsCsv(data, includeTime, includeTranslation, transResults)
    default:
      return exportAsTxt(data, title, url, author, time, includeTime, includeTranslation, transResults)
  }
}

const exportAsTxt = (
  data: Transcript,
  title: string | undefined,
  url: string | undefined,
  author: string | undefined,
  time: string,
  includeTime: boolean,
  includeTranslation: boolean,
  transResults?: { [key: number]: TransResult }
): string => {
  let content = `${title ?? '无标题'}\n${url ?? '无链接'}\n${author ?? '无作者'} ${time}\n\n`

  for (const item of data.body) {
    if (includeTime) {
      content += `[${formatTime(item.from)}] `
    }
    content += item.content

    if (includeTranslation && transResults && transResults[item.idx]?.data) {
      content += `\n  翻译: ${transResults[item.idx].data}`
    }
    content += '\n'
  }

  return content
}

const exportAsSrt = (
  data: Transcript,
  includeTranslation: boolean,
  transResults?: { [key: number]: TransResult }
): string => {
  let content = ''

  for (let i = 0; i < data.body.length; i++) {
    const item = data.body[i]
    content += `${i + 1}\n`
    content += `${formatSrtTime(item.from)} --> ${formatSrtTime(item.to)}\n`
    content += item.content

    if (includeTranslation && transResults && transResults[item.idx]?.data) {
      content += `\n${transResults[item.idx].data}`
    }
    content += '\n\n'
  }

  return content.trim()
}

const exportAsVtt = (
  data: Transcript,
  title: string | undefined,
  includeTranslation: boolean,
  transResults?: { [key: number]: TransResult }
): string => {
  let content = `WEBVTT ${title ?? ''}\n\n`

  for (let i = 0; i < data.body.length; i++) {
    const item = data.body[i]
    content += `${i + 1}\n`
    content += `${formatVttTime(item.from)} --> ${formatVttTime(item.to)}\n`
    content += item.content

    if (includeTranslation && transResults && transResults[item.idx]?.data) {
      content += `\n<lang zh>${transResults[item.idx].data}</lang>`
    }
    content += '\n\n'
  }

  return content.trim()
}

const exportAsJson = (
  data: Transcript,
  title: string | undefined,
  url: string | undefined,
  author: string | undefined,
  time: string,
  includeTranslation: boolean,
  transResults?: { [key: number]: TransResult }
): string => {
  const result = {
    title: title ?? '',
    url: url ?? '',
    author: author ?? '',
    time,
    subtitles: data.body.map(item => ({
      idx: item.idx,
      from: item.from,
      to: item.to,
      content: item.content,
      translation: includeTranslation && transResults && transResults[item.idx]?.data
        ? transResults[item.idx].data
        : undefined,
    })),
  }

  return JSON.stringify(result, null, 2)
}

const exportAsCsv = (
  data: Transcript,
  includeTime: boolean,
  includeTranslation: boolean,
  transResults?: { [key: number]: TransResult }
): string => {
  let headers = 'Index'
  if (includeTime) {
    headers += ',Start Time,End Time'
  }
  headers += ',Content'
  if (includeTranslation) {
    headers += ',Translation'
  }
  headers += '\n'

  let content = headers

  for (const item of data.body) {
    let row = `${item.idx + 1}`
    if (includeTime) {
      row += `,"${formatTime(item.from)}","${formatTime(item.to)}"`
    }
    row += `,"${escapeCsv(item.content)}"`
    if (includeTranslation && transResults && transResults[item.idx]?.data) {
      row += `,"${escapeCsv(transResults[item.idx].data!)}"`
    }
    row += '\n'
    content += row
  }

  return content
}

const escapeCsv = (str: string): string => {
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return str.replace(/"/g, '""')
  }
  return str
}

export const exportSubtitleToFile = (
  data: Transcript,
  title: string | undefined,
  url: string | undefined,
  author: string | undefined,
  ctime: number | null | undefined,
  options: ExportOptions
): void => {
  const content = exportSubtitle(data, title, url, author, ctime, options)
  const fileName = `${title ?? 'subtitle'}.${options.format}`
  downloadText(content, fileName)
}

export const exportSegments = (
  segments: Segment[],
  title: string | undefined,
  url: string | undefined,
  author: string | undefined,
  ctime: number | null | undefined,
  options: ExportOptions
): string => {
  const time = ctime ? dayjs(ctime * 1000).format('YYYY-MM-DD HH:mm:ss') : ''
  let content = ''

  if (options.format === 'txt') {
    content = `${title ?? '无标题'}\n${url ?? '无链接'}\n${author ?? '无作者'} ${time}\n\n`
    for (const segment of segments) {
      if (segment.chapterTitle) {
        content += `=== ${segment.chapterTitle} ===\n\n`
      }
      for (const item of segment.items) {
        if (options.includeTime) {
          content += `[${formatTime(item.from)}] `
        }
        content += item.content
        if (options.includeTranslation && options.transResults && options.transResults[item.idx]?.data) {
          content += `\n  翻译: ${options.transResults[item.idx].data}`
        }
        content += '\n'
      }
      content += '\n'
    }
  } else if (options.format === 'json') {
    const result = {
      title: title ?? '',
      url: url ?? '',
      author: author ?? '',
      time,
      segments: segments.map(segment => ({
        chapterTitle: segment.chapterTitle,
        startIdx: segment.startIdx,
        endIdx: segment.endIdx,
        subtitles: segment.items.map(item => ({
          idx: item.idx,
          from: item.from,
          to: item.to,
          content: item.content,
          translation: options.includeTranslation && options.transResults && options.transResults[item.idx]?.data
            ? options.transResults[item.idx].data
            : undefined,
        })),
      })),
    }
    content = JSON.stringify(result, null, 2)
  } else {
    const allItems: TranscriptItem[] = []
    for (const segment of segments) {
      allItems.push(...segment.items)
    }
    const transcript: Transcript = { body: allItems }
    content = exportSubtitle(transcript, title, url, author, ctime, options)
  }

  return content
}

export const exportSegmentsToFile = (
  segments: Segment[],
  title: string | undefined,
  url: string | undefined,
  author: string | undefined,
  ctime: number | null | undefined,
  options: ExportOptions
): void => {
  const content = exportSegments(segments, title, url, author, ctime, options)
  const fileName = `${title ?? 'subtitle'}.${options.format}`
  downloadText(content, fileName)
}
