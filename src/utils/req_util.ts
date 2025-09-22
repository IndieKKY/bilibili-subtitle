export interface Result {
  success: boolean
  code: string
  message?: string
  data?: any
}

/**
 * handle the business logic of response
 *
 * if the response is not ok, handle it and throw an error,
 * otherwise, do nothing
 */
export const handleResp = async (resp: Response, data: Result, errorHandler?: (err: Error) => void) => {
  errorHandler = errorHandler ?? (() => {})
  if (resp.ok) {
    // 处理返回数据
    if (!data.success) {
      const error = new Error(data.message)
      // @ts-expect-error
      error._respData = data
      errorHandler(error)
      throw error
    }
  } else {
    if (resp.status === 401) {
      const error1 = new Error('未登录')
      errorHandler(error1)
      throw error1
    } else if (resp.status === 403) {
      const error1 = new Error('没有权限')
      errorHandler(error1)
      throw error1
    } else {
      const error1 = new Error(`异常(状态码: ${resp.status})`)
      errorHandler(error1)
      throw error1
    }
  }
}
