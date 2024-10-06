import { MESSAGE_TARGET_INJECT } from '@/consts/const'
import Layer1Protocol from './Layer1Protocol'
import { L2ReqMsg, L2ResMsg, MESSAGE_TO_EXTENSION_ROUTE_MSG } from './const'


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

  debug = (...args: any[]) => {
    console.debug('[Extension Messaging]', ...args)
  }
  
  init = (methods: {
    [key: string]: (params: any, context: MethodContext) => Promise<any>
  }) => {
    const innerMethods = {
      [MESSAGE_TO_EXTENSION_ROUTE_MSG]: (params: any, context: MethodContext) => {
        return this.broadcastMessageExact([context.tabId!], params.target, params.method, params.params)
      }
    }

    this.methods = {...innerMethods, ...methods}

    const handler = async (req: L2ReqMsg, portContext: PortContext): Promise<L2ResMsg> => {
      const { tabId } = portContext
      const method = this.methods?.[req.method]
      if (method != null) {
        return method(req.params, {
          from: req.from,
          event: req,
          tabId,
          // sender: portContext.port.sender,
        }).then(data => ({
          code: 200,
          data,
        })).catch(err => {
          console.error(err)
          return {
            code: 500,
            message: err.message,
          }
        })
      } else {
        return {
          code: 501,
          message: 'Unknown method: ' + req.method,
        }
      }
    }

    chrome.runtime.onConnect.addListener((port: chrome.runtime.Port) => {
      this.debug('onConnect', port)

      const id = crypto.randomUUID()
      const name = port.name
      const portMessageHandler = new Layer1Protocol<L2ReqMsg, L2ResMsg>(async (req: L2ReqMsg) => {
        // 初始化消息
        if (req.method === '_init') {
          const type = req.params.type
          let tabId = req.params.tabId

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
            code: 200,
          } as L2ResMsg
        }

        // 处理消息
        return handler(req, portContext)
      }, port)
      const portContext: PortContext = {id, name, port, portMessageHandler, ready: false}
      this.portIdToPort.set(id, portContext)

      // 监听断开连接
      port.onDisconnect.addListener(() => {
        this.debug('onDisconnect', id)
        this.portIdToPort.delete(id)
      })
    })
  }

  //返回：最后一个响应(因此如果只发送给一个tab，则返回的是该tab的响应)
  broadcastMessageExact = async (tabIds: number[], target: string, method: string, params?: any) => {
    const targetType = target === MESSAGE_TARGET_INJECT ? 'inject' : 'app'
    let res: L2ResMsg | undefined
    for (const portContext of this.portIdToPort.values()) {
      if (tabIds.includes(portContext.tabId!)) {
        if (targetType === portContext.type) {
          try {
            const req: L2ReqMsg = {target, method, params, from: 'extension'}
            res = await portContext.portMessageHandler.sendMessage(req)
          } catch (e) {
            console.error('send message to port error', portContext.id, e)
          }
        }
      }
    }
    return res?.data
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