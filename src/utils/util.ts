import {SyntheticEvent} from 'react'
import {omitBy} from 'lodash-es'

export const isEdgeBrowser = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  return userAgent.includes('edg/') && !userAgent.includes('edge/')
}

/**
 * 将总秒数格式化为 MM:SS 或 HH:MM:SS 格式的字符串。
 * 如果时间小于 1 小时，则使用 MM:SS 格式。
 * 如果时间大于或等于 1 小时，则使用 HH:MM:SS 格式。
 *
 * @param time 总秒数 (number)
 * @returns string 格式化后的时间字符串 ('MM:SS' 或 'HH:MM:SS')
 */
export const formatTime = (time: number): string => {
  // 1. 输入验证和处理 0 或负数的情况
  if (typeof time !== 'number' || isNaN(time) || time <= 0) {
    return '00:00' // 对于无效输入、0 或负数，返回 '00:00'
  }

  // 取整确保我们处理的是整数秒
  const totalSeconds = Math.floor(time)

  // 2. 计算小时、分钟和秒
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  // 3. 格式化各个部分，确保是两位数 (例如 0 -> '00', 5 -> '05', 10 -> '10')
  const formattedSeconds = seconds.toString().padStart(2, '0')
  const formattedMinutes = minutes.toString().padStart(2, '0')

  // 4. 根据是否有小时来决定最终格式
  if (hours > 0) {
    const formattedHours = hours.toString().padStart(2, '0')
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`
  } else {
    return `${formattedMinutes}:${formattedSeconds}`
  }
}

/**
 * @param time 2.82
 */
export const formatSrtTime = (time: number) => {
  if (!time) return '00:00:00,000'

  const hours = Math.floor(time / 60 / 60)
  const minutes = Math.floor(time / 60 % 60)
  const seconds = Math.floor(time % 60)
  const ms = Math.floor((time % 1) * 1000)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`
}

/**
 * @param time 2.82
 */
export const formatVttTime = (time: number) => {
  if (!time) return '00:00:00.000'

  const hours = Math.floor(time / 60 / 60)
  const minutes = Math.floor(time / 60 % 60)
  const seconds = Math.floor(time % 60)
  const ms = Math.floor((time % 1) * 1000)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
}

export const preventFunc = (e: SyntheticEvent) => {
  e.preventDefault()
}

export const stopPopFunc = (e: SyntheticEvent) => {
  e.stopPropagation()
}

/**
 * @return yyyy-MM-dd
 */
export const getDay = (timeInMills: number) => {
  const date = new Date(timeInMills)
  return date.toISOString().substring(0, 10)
}

export const styleNames = (style: Object): Object => {
  return omitBy(style, (k: any) => k === undefined || k === null || k === false)
}

/**
 * 处理json数据，递归删除所有__开头的属性名
 * @return 本身
 */
export const handleJson = (json: any) => {
  for (const key in json) {
    if (key.startsWith('__')) { // 删除属性
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete json[key]
    } else {
      const value = json[key]
      if (typeof value === 'object') {
        handleJson(value)
      }
    }
  }
  return json
}

/**
 * 连接url
 */
export const combineUrl = (parentPath: string, path?: string) => {
  if (!path) {
    return parentPath
  }

  let splashCnt = 0
  if (parentPath.endsWith('/')) {
    splashCnt++
  }
  if (path.startsWith('/')) {
    splashCnt++
  }
  if (splashCnt === 1) {
    return parentPath+path
  } else if (splashCnt === 2) {
    return parentPath+path.slice(1)
  } else {
    return parentPath+'/'+path
  }
}

/**
 * 获取图标url
 */
export const getIconUrl = (bookmarkUrlStr: string, icon?: string) => {
  let bookmarkUrl
  try {
    bookmarkUrl = new URL(fixUrl(bookmarkUrlStr))
  } catch (e) {
    console.error(e)
    return icon
  }
  if (icon) {
    if (icon.startsWith('//')) {
      return combineUrl(bookmarkUrl.protocol, icon)
    } else if (icon.startsWith('/')) {
      return combineUrl(bookmarkUrl.origin, icon)
    } else if (icon.startsWith('http://') || icon.startsWith('https://')) {
      return icon
    } else {
      return combineUrl(bookmarkUrl.origin, icon)
    }
  }
}

export const getTimeBeforeShow = (waitTime: number) => {
  const MINUTE = 60*1000
  const HOUR = 60*MINUTE
  const DAY = 24*HOUR
  const YEAR = 365*DAY

  const year = Math.floor(waitTime/YEAR)
  const day = Math.floor((waitTime%YEAR)/DAY)
  const hour = Math.floor((waitTime%DAY)/HOUR)
  const minute = Math.floor((waitTime%HOUR)/MINUTE)

  if (year > 0) {
    return `${year}年前`
  }
  if (day > 0) {
    return `${day}天前`
  }
  if (hour > 0) {
    return `${hour}小时前`
  }
  if (minute > 0) {
    return `${minute}分钟前`
  }

  return '刚刚'
}

export const getTimeAfterShow = (waitTime: number) => {
  const MINUTE = 60*1000
  const HOUR = 60*MINUTE
  const DAY = 24*HOUR

  const day = Math.floor(waitTime/DAY)
  const hour = Math.floor((waitTime%DAY)/HOUR)
  const minute = Math.floor((waitTime%HOUR)/MINUTE)

  if (day > 0) {
    return `${day}天后`
  }
  if (hour > 0) {
    return `${hour}小时后`
  }
  if (minute > 0) {
    return `${minute}分钟后`
  }

  return '马上'
}

/**
 * 'yyyy-MM-DD HH:mm:ss'
 */
export const getDateTimeFormat = (data: Date) => {
  const year = data.getFullYear()
  const month = data.getMonth()+1
  const day = data.getDate()
  const hour = data.getHours()
  const minute = data.getMinutes()
  const second = data.getSeconds()
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

/**
 * 'yyyy-MM-DD'
 */
export const getDateFormat = (data: Date) => {
  const year = data.getFullYear()
  const month = data.getMonth()+1
  const day = data.getDate()
  return `${year}-${month}-${day}`
}

export const isInRect = (x: number, y: number, rect: DOMRect) => {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}

export interface RemovedParamUrl {
  newUrl: string
  paramValue?: string
  paramValues: {[key: string]: string}
}

/**
 * 移除url里的参数
 * 如果有paramName，则extraRemoveParamNames里的一起移除
 */
export const removeUrlParams = (url: string, paramName: string, extraRemoveParamNames?: string[]): RemovedParamUrl => {
  const params = new URL(url).searchParams
  const paramValue = params.get(paramName)
  params.delete(paramName)
  const paramValues: {[key: string]: string} = {}
  if (paramValue) {
    for (const paramName_ of extraRemoveParamNames??[]) {
      const value = params.get(paramName_)
      if (value) {
        paramValues[paramName_] = value
      }
      params.delete(paramName_)
    }
  }
  const newSearch = params.toString()
  const base = url.split('?')[0]
  const newUrl = base + (newSearch ? ('?' + newSearch) : '')
  console.log(`[removeUrlParams]${paramName}: ${paramValue??''} (${url} -> ${newUrl})`)
  return {
    newUrl,
    paramValue: paramValue??undefined,
    paramValues,
  }
}

export const getFaviconUrl = (url: string) => {
  try {
    if (url) {
      const urlObj = new URL(url)
      return `${urlObj.origin}/favicon.ico`
    }
  } catch (e) {
  }
}

export const fixUrl = (url: string | undefined, defaultSchema?: string) => {
  if (url) {
    const urlLower = url.toLowerCase()
    if (!urlLower.startsWith('http://') && !urlLower.startsWith('https://') && !urlLower.startsWith('chrome://') && !urlLower.startsWith('edge://')) {
      url = (defaultSchema??'http')+'://'+url
    }

    if (url) {
      try {
        const urlObj = new URL(url)
        return urlObj.toString()
      } catch (e) {
        console.error(e)
      }
    }
  }

  return ''
}

export const getNameFromUrl = (url: string) => {
  const urlObj = new URL(url)
  return urlObj.hostname
}

export const orElse = <T>(value: T, defaultValue: T) => {
  // string
  if (value instanceof String) {
    return value.length > 0 ? value : defaultValue
  }
  return value ?? defaultValue
}

export const orElses = <T>(...values: T[]) => {
  for (const value of values) {
    // string
    if (value instanceof String) {
      if (value.length > 0) {
        return value
      } else {
        continue
      }
    }
    // other
    if (value) {
      return value
    }
  }
}

/**
 * 从url中获取参数
 */
export const getQuery = (name: string) => {
  const search = window.location.search
  const reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i')
  const r = search.substr(1).match(reg)
  if (r != null) {
    return decodeURIComponent(r[2])
  }
  return null
}

export const hasStr = (list: string | string[] | undefined | null, str: string) => {
  if (list) {
    if (typeof list === 'string') {
      return list === str
    } else {
      return list.includes(str)
    }
  }
  return false
}

/**
 * 导出文本内容(按utf-8编码导出)
 * @param filename 如'data.json'
 */
export const exportFile = (content: string, filename: string) => {
  const element = document.createElement('a')
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content))
  element.setAttribute('download', filename)

  element.style.display = 'none'
  document.body.appendChild(element)

  element.click()

  document.body.removeChild(element)
}

export const getUrlExtension = (url: string) => {
  return url.split(/[#?]/)[0]?.split('.')?.pop()?.trim()
}

export const downloadText = (data: string, fileName: string) => {
  const blob = new Blob([data])
  // Create an object URL for the blob
  const url = URL.createObjectURL(blob)

  // Create an <a> element to use as a link to the image
  const a = document.createElement('a')
  a.href = url
  a.referrerPolicy = 'no-referrer'
  a.download = fileName

  a.style.display = 'none'
  document.body.appendChild(a)

  a.click()

  document.body.removeChild(a)
}

export const downloadImage = async (imageUrl: string, fileName?: string) => {
  if (!fileName) {
    const ext = getUrlExtension(imageUrl)
    fileName = `download.${ext??'jpg'}`
  }

  const response = await fetch(imageUrl)
  const blob = await response.blob()
  // Create an object URL for the blob
  const url = URL.createObjectURL(blob)

  // Create an <a> element to use as a link to the image
  const a = document.createElement('a')
  a.href = url
  a.referrerPolicy = 'no-referrer'
  a.download = '' // Set the file name

  a.style.display = 'none'
  document.body.appendChild(a)

  a.click()

  document.body.removeChild(a)
}

/**
 * @returns suffix, e.g. 'png'
 */
export const getSuffix = (filename: string) => {
  const pos = filename.lastIndexOf('.')
  let suffix = ''
  if (pos !== -1) {
    suffix = filename.substring(pos + 1)
  }
  return suffix
}
