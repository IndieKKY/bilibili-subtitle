import { MESSAGE_TARGET_INJECT } from '@/consts/const'
import Layer1Protocol from './Layer1Protocol'
import { L2ReqMsg, L2ResMsg, MESSAGE_TO_EXTENSION_HANDSHAKE, MESSAGE_TO_EXTENSION_ROUTE_MSG } from './const'

export type PortContext = {
  id: string
  name: string
  port: chrome.runtime.Port
  portMessageHandler: Layer1Protocol
  ready: boolean

  tabId?: number // 所属tab
  tags?: string[] // 标签，用来筛选消息发送目标
}

export type L2MethodHandler = (params: any, context: MethodContext, portContext: PortContext) => Promise<any>
export type L2MethodHandlers = {
  [key: string]: L2MethodHandler
}

class ExtensionMessage {
  portIdToPort: Map<string, PortContext> = new Map()
  methods?: L2MethodHandlers

  debug = (...args: any[]) => {
    console.debug('[Extension Messaging]', ...args)
  }

  init = (methods: L2MethodHandlers) => {
    const innerMethods: L2MethodHandlers = {
      [MESSAGE_TO_EXTENSION_HANDSHAKE]: async (params: any, context: MethodContext, portContext: PortContext) => {
        const tags = params.tags
        let tabId = params.tabId

        //get current tabId
        if (tabId == null) {
          const tabs = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          })
          tabId = tabs[0]?.id
        }

        portContext.tabId = tabId
        portContext.tags = tags
        portContext.ready = true
      },
      [MESSAGE_TO_EXTENSION_ROUTE_MSG]: async (params: any, context: MethodContext) => {
        return this.broadcastMessageExact([context.tabId!], params.tags, params.method, params.params)
      },
    }

    this.methods = { ...innerMethods, ...methods }

    chrome.runtime.onConnect.addListener((port: chrome.runtime.Port) => {
      this.debug('onConnect', port)

      const id = crypto.randomUUID()
      const name = port.name
      // 创建消息处理器
      const portMessageHandler = new Layer1Protocol<L2ReqMsg, L2ResMsg>(async (req: L2ReqMsg) => {
        const { tabId } = portContext
        const method = this.methods?.[req.method]
        if (method != null) {
          return method(req.params, {
            from: req.from,
            event: req,
            tabId,
            // sender: portContext.port.sender,
          }, portContext).then(data => ({
            code: 200,
            data,
          })).catch(err => {
            console.error(err)
            return {
              code: 500,
              msg: err.message,
            }
          })
        } else {
          return {
            code: 501,
            msg: 'Unknown method: ' + req.method,
          }
        }
      }, port)
      // 创建portContext
      const portContext: PortContext = { id, name, port, portMessageHandler, ready: false }
      this.portIdToPort.set(id, portContext)

      // 监听断开连接
      port.onDisconnect.addListener(() => {
        this.debug('onDisconnect', id)
        this.portIdToPort.delete(id)
      })
    })
  }

  //tags 如果为null，则不检查tags，如果为空数组，则不会发送消息
  //返回：最后一个响应(因此如果只发送给一个tab，则返回的是该tab的响应)
  broadcastMessageExact = async (tabIds: number[], tags: string[] | null, method: string, params?: any) => {
    // 如果tags为空数组，则不会发送消息
    if (tags != null && tags.length === 0) {
      return
    }

    let res: L2ResMsg | undefined
    for (const portContext of this.portIdToPort.values()) {
      //check tabId
      if (tabIds.includes(portContext.tabId!)) {
        //check tags
        if (tags == null || tags.some(tag => portContext.tags?.includes(tag))) {
          try {
            const req: L2ReqMsg = { method, params, from: 'extension' }
            res = await portContext.portMessageHandler.sendMessage(req)
          } catch (e) {
            console.error('send message to port error', portContext.id, e)
          }
        }
      }
    }
    return res?.data
  }

  broadcastMessage = async (ignoreTabIds: number[] | undefined | null, tags: string[], method: string, params?: any) => {
    const tabs = await chrome.tabs.query({
      discarded: false,
    })
    const tabIds: number[] = tabs.map(tab => tab.id).filter(tabId => tabId != null) as number[]
    const filteredTabIds: number[] = tabIds.filter(tabId => !ignoreTabIds?.includes(tabId))
    await this.broadcastMessageExact(filteredTabIds, tags, method, params)
  }
}

export default ExtensionMessage