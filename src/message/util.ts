import { L2ResMsg } from './typings'

/**
 * 处理响应信息
 * @returns data
 */
export const handleRes = (res: L2ResMsg): any => {
  if (res.code === 200) {
    return res.data
  } else {
    throw new Error(`${res.code}: ${res.msg || 'Unknown error'}`)
  }
}
