import {SyntheticEvent} from 'react'

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
    return '00:00'; // 对于无效输入、0 或负数，返回 '00:00'
  }

  // 取整确保我们处理的是整数秒
  const totalSeconds = Math.floor(time);

  // 2. 计算小时、分钟和秒
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // 3. 格式化各个部分，确保是两位数 (例如 0 -> '00', 5 -> '05', 10 -> '10')
  const formattedSeconds = seconds.toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');

  // 4. 根据是否有小时来决定最终格式
  if (hours > 0) {
    const formattedHours = hours.toString().padStart(2, '0');
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  } else {
    return `${formattedMinutes}:${formattedSeconds}`;
  }
};

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
