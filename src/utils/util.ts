import {SyntheticEvent} from 'react'

export const isEdgeBrowser = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('edg/') && !userAgent.includes('edge/');
}

export const formatTime = (time: number) => {
  if (!time) return '00:00'

  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
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
