import qs from 'qs'

export default class Req {
  baseUrl: string
  hasMap: boolean // 是否有map层级
  errorHandler?: (error: Error) => void

  constructor(options: {
    baseUrl: string
    enableDefaultHandler?: boolean
    hasMap?: boolean
    errorHandler?: (error: Error) => void
  }) {
    this.baseUrl = options.baseUrl
    this.hasMap = options.hasMap??false
    this.errorHandler = options.errorHandler
  }

  async req<T>(url: string, options?: { [key: string]: any }) {
    const {headers = {}, ...restOptions} = options ?? {}
    // 选项里的data转body
    if (restOptions.data) {
      restOptions.body = restOptions.data
      delete restOptions.data
    }

    return await fetch(this.baseUrl+url, {
      headers,
      ...restOptions,
    }).then(async (resp) => {
      if (resp.ok) {
        // 处理返回数据
        const data = await resp.json()
        if (!data.success) {
          const error = new Error(data.message)
          // @ts-expect-error
          error._respData = data
          if (this.errorHandler) {
            this.errorHandler(error)
          }
          throw error
        } else {
          if (this.hasMap) {
            return data.map?.data as T
          } else {
            return data.data as T
          }
        }
      } else {
        if (resp.status === 401) {
          const error1 = new Error('未登录')
          if (this.errorHandler) {
            this.errorHandler(error1)
          }
          throw error1
        } else if (resp.status === 403) {
          const error1 = new Error('没有权限')
          if (this.errorHandler) {
            this.errorHandler(error1)
          }
          throw error1
        } else {
          const error2 = new Error(`异常(状态码: ${resp.status})`)
          if (this.errorHandler) {
            this.errorHandler(error2)
          }
          throw error2
        }
      }
    })
  }

  async get<T>(url: string, options?: { [key: string]: any }) {
    return await this.req<T>(url, {
      method: 'GET',
      ...(options ?? {}),
    })
  }

  async post<T>(url: string, options?: { [key: string]: any }) {
    return await this.req<T>(url, {
      method: 'POST',
      ...options,
    })
  }

  async postForm<T>(url: string, data: object, options?: { [key: string]: any }) {
    return await this.req<T>(url, {
      ...(options??{}),
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(options?.headers??{}),
      },
      data: qs.stringify(data),
    })
  }

  async postJson<T>(url: string, data: object, options?: { [key: string]: any }) {
    return await this.req<T>(url, {
      ...(options??{}),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers??{}),
      },
      data: JSON.stringify(data),
    })
  }

  async put<T>(url: string, options?: { [key: string]: any }) {
    return await this.req<T>(url, {
      method: 'PUT',
      ...(options ?? {}),
    })
  }

  async patch<T>(url: string, options?: { [key: string]: any }) {
    return await this.req<T>(url, {
      method: 'PATCH',
      ...(options ?? {}),
    })
  }
}
