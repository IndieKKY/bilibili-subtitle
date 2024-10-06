import { MESSAGE_TARGET_INJECT, MESSAGE_TO_EXTENSION_ROUTE_MSG } from '@/consts/const'
import Layer1Protocol from './Layer1Protocol'

export type PortContext = {
  id: string
  name: string
  port: chrome.runtime.Port
  portMessageHandler: Layer1Protocol
  ready: boolean

  tabId?: number
  type?: 'inject' | 'app'
}

class ExtensionMessage {
  portIdToPort: Map<string, PortContext> = new Map()
  methods?: {
    [key: string]: (params: any, context: MethodContext) => Promise<any>
  }
  innerMethods?: {
    [key: string]: (params: any, context: MethodContext) => Promise<any>
  }

  debug = (...args: any[]) => {
    console.debug('[Extension Messaging]', ...args)
  }
  
  init = (methods: {
    [key: string]: (params: any, context: MethodContext) => Promise<any>
  }) => {
    this.innerMethods = {
      [MESSAGE_TO_EXTENSION_ROUTE_MSG]: (params: any, context: MethodContext) => {
        return this.broadcastMessageExact([context.tabId!], params.target, params.method, params.params)
      }
    }
    this.methods = {...this.innerMethods, ...methods}

    const handler = async (event: MessageData, portContext: PortContext): Promise<MessageResult> => {
      const { tabId } = portContext
      const method = this.methods?.[event.method]
      if (method != null) {
        return method(event.params, {
          from: event.from,
          event,
          tabId,
          // sender: portContext.port.sender,
        }).then(data => ({
          success: true,
          code: 200,
          data,
        })).catch(err => {
          console.error(err)
          return {
            success: false,
            code: 500,
            message: err.message,
          }
        })
      } else {
        return {
          success: false,
          code: 501,
          message: 'Unknown method: ' + event.method,
        }
      }
    }

    chrome.runtime.onConnect.addListener((port: chrome.runtime.Port) => {
      this.debug('onConnect', port)

      const id = crypto.randomUUID()
      const name = port.name
      const portMessageHandler = new Layer1Protocol<MessageData, MessageResult>(async (value: MessageData) => {
        // 初始化消息
        if (value.method === '_init') {
          const type = value.params.type
          let tabId = value.params.tabId

          //get current tabId
          if (tabId == null) {
            const tabs = await chrome.tabs.query({
              active: true,
              currentWindow: true,
            })
            tabId = tabs[0]?.id
          }

          portContext.tabId = tabId
          portContext.type = type
          portContext.ready = true

          return {
            success: true,
            code: 200,
          } as MessageResult
        }

        // 处理消息
        return handler(value, portContext)
      }, port)
      const portContext: PortContext = {id, name, port, portMessageHandler, ready: false}
      this.portIdToPort.set(id, portContext)

      // 监听断开连接
      port.onDisconnect.addListener(() => {
        this.portIdToPort.delete(id)
        this.debug('onDisconnect', id)
      })
    })
  }

  broadcastMessageExact = async (tabIds: number[], target: string, method: string, params?: any) => {
    const targetType = target === MESSAGE_TARGET_INJECT ? 'inject' : 'app'
    let resp: MessageResult | undefined
    for (const portContext of this.portIdToPort.values()) {
      if (tabIds.includes(portContext.tabId!)) {
        if (targetType === portContext.type) {
          try {
            const messageData: MessageData = {target, method, params, from: 'extension'}
            resp = await portContext.portMessageHandler.sendMessage(messageData)
          } catch (e) {
            console.error('send message to port error', portContext.id, e)
          }
        }
      }
    }
    return resp?.data
  }

  broadcastMessage = async (ignoreTabIds: number[] | undefined | null, target: string, method: string, params?: any) => {
    const tabs = await chrome.tabs.query({
      discarded: false,
    })
    const tabIds: number[] = tabs.map(tab => tab.id).filter(tabId => tabId != null) as number[]
    const filteredTabIds: number[] = tabIds.filter(tabId => !ignoreTabIds?.includes(tabId))
    await this.broadcastMessageExact(filteredTabIds, target, method, params)
  }
}

export default ExtensionMessage