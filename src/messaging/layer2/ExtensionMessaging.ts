import Layer1Protocol from '../layer1/Layer1Protocol'
import { L2ReqMsg, L2ResMsg } from '../const'

type PortContext<L2ReqMsg, L2ResMsg> = {
  id: string
  name: string //暂时没什么用
  port: chrome.runtime.Port
  l1protocol: Layer1Protocol<L2ReqMsg, L2ResMsg>
  ready: boolean

  tabId?: number // 所属tab
  tags?: string[] // 标签，用来筛选消息发送目标
}

type L2MethodHandler<M extends ExtensionMessage, K, L2ReqMsg, L2ResMsg> = (params: Extract<M, { method: K }>['params'], context: MethodContext, portContext: PortContext<L2ReqMsg, L2ResMsg>) => Promise<any>
type L2MethodHandlers<M extends ExtensionMessage, L2ReqMsg, L2ResMsg> = {
  [K in M['method']]: L2MethodHandler<M, K, L2ReqMsg, L2ResMsg>
}

class ExtensionMessaging<M extends ExtensionMessage, AllInjectMessagesType extends InjectMessage, AllAPPMessagesType extends AppMessage> {
  portIdToPort: Map<string, PortContext<L2ReqMsg, L2ResMsg>> = new Map()
  methods?: L2MethodHandlers<M, L2ReqMsg, L2ResMsg>

  debug = (...args: any[]) => {
    console.debug('[Extension Messaging]', ...args)
  }

  init = (methods: L2MethodHandlers<M, L2ReqMsg, L2ResMsg>) => {
    const innerMethods: L2MethodHandlers<MessagingExtensionMessages, L2ReqMsg, L2ResMsg> = {
      _HANDSHAKE: async (params, context: MethodContext, portContext: PortContext<L2ReqMsg, L2ResMsg>) => {
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
      _ROUTE: async (params, context: MethodContext) => {
        return this.broadcastMessageExact([context.tabId!], params.tags, params.method as any, params.params)
      },
    }

    this.methods = { ...innerMethods, ...methods }

    chrome.runtime.onConnect.addListener((port: chrome.runtime.Port) => {
      this.debug('onConnect', port)

      const id = crypto.randomUUID()
      const name = port.name
      // 创建消息处理器
      const l1protocol = new Layer1Protocol<L2ReqMsg, L2ResMsg>(async (req: L2ReqMsg) => {
        const { tabId } = portContext
        const method = this.methods?.[req.method as keyof typeof this.methods]
        // console.log('msg>>>', tabId, req, method != null)
        if (method != null) {
          return method(req.params, {
            from: req.from,
            event: req,
            tabId,
            // sender: portContext.port.sender,
          }, portContext).then((data) => ({
            code: 200,
            data,
          })).catch((err) => {
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
      const portContext: PortContext<L2ReqMsg, L2ResMsg> = { id, name, port, l1protocol, ready: false }
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
  broadcastMessageExact = async <M extends AllInjectMessagesType | AllAPPMessagesType, K extends M['method']>(tabIds: number[], tags: string[] | null, method: K, params?: Extract<M, { method: K }>['params']): Promise<Extract<M, { method: K }>['return']> => {
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
            res = await portContext.l1protocol.sendMessage({ method, params, from: 'extension' })
          } catch (e) {
            console.error('send message to port error', portContext.id, e)
          }
        }
      }
    }
    return res?.data
  }

  broadcastMessage = async <M extends AllInjectMessagesType | AllAPPMessagesType, K extends M['method']>(ignoreTabIds: number[] | undefined | null, tags: string[], method: K, params?: Extract<M, { method: K }>['params']): Promise<Extract<M, { method: K }>['return']> => {
    const tabs = await chrome.tabs.query({
      discarded: false,
    })
    const tabIds: number[] = tabs.map(tab => tab.id).filter(tabId => tabId != null) as number[]
    const filteredTabIds: number[] = tabIds.filter(tabId => !ignoreTabIds?.includes(tabId))
    return await this.broadcastMessageExact(filteredTabIds, tags, method, params) 
  }
}

export default ExtensionMessaging