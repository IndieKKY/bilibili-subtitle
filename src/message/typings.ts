// 请求信息
export interface L2ReqMsg {
  from: 'extension' | 'inject' | 'app'
  target: 'extension' | 'inject' | 'app'
  method: string
  params?: any
}

// 响应信息
export interface L2ResMsg<L2Res = any> {
  code: number
  msg?: string
  data?: L2Res
}

export interface Message<T = any, R = any> {
  method: string
  params: T
  return: R
}

export interface ExtensionMessage<T = any, R = any> extends Message<T, R> {
}

export interface InjectMessage<T = any, R = any> extends Message<T, R> {
}

export interface AppMessage<T = any, R = any> extends Message<T, R> {
}

export interface MethodContext {
  from: 'extension' | 'inject' | 'app'
  event: any
  tabId?: number
  // sender?: chrome.runtime.MessageSender | null
}

export interface ExtensionHandshakeMessage extends ExtensionMessage<{ tabId?: number, tag: string }> {
  method: '_HANDSHAKE'
}

export interface ExtensionRouteMessage extends ExtensionMessage<{ usePort: boolean, tag: string, method: string, params: any }> {
  method: '_ROUTE'
}

export type MessagingExtensionMessages = ExtensionHandshakeMessage | ExtensionRouteMessage
