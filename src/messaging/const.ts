// 请求信息
export type L2ReqMsg = {
    from: 'extension' | 'inject' | 'app'
    method: string
    params?: any
}

// 响应信息
export type L2ResMsg<L2Res = any> = {
  code: number
  msg?: string
  data?: L2Res
}

export const MESSAGE_TO_EXTENSION_HANDSHAKE = '_handshake'
export const MESSAGE_TO_EXTENSION_ROUTE_MSG = '_routeMsg'

export const TAG_TARGET_INJECT = 'target:inject'
export const TAG_TARGET_APP = 'target:app'
