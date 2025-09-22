import Layer1Protocol from '../layer1/Layer1Protocol'
import { TAG_TARGET_APP, TAG_TARGET_INJECT } from '../const'
import { ExtensionMessage, MethodContext, InjectMessage, AppMessage, MessagingExtensionMessages, L2ReqMsg, L2ResMsg } from '../typings'
import { handleRes } from '../util'

interface PortContext<L2ReqMsg, L2ResMsg> {
  id: string
  // name: string //暂时没什么用
  port: chrome.runtime.Port
  l1protocol: Layer1Protocol<L2ReqMsg, L2ResMsg>
  ready: boolean

  tabId?: number // 所属tab
  tag?: string // 标签，用来筛选消息发送目标
}

type L2MethodHandler<M extends ExtensionMessage, K, L2ReqMsg, L2ResMsg> = (params: Extract<M, { method: K }>['params'], context: MethodContext, portContext?: PortContext<L2ReqMsg, L2ResMsg>) => Promise<any>
type L2MethodHandlers<M extends ExtensionMessage, L2ReqMsg, L2ResMsg> = {
  [K in M['method']]: L2MethodHandler<M, K, L2ReqMsg, L2ResMsg>
}

class ExtensionMessaging<M extends ExtensionMessage, AllInjectMessagesType extends InjectMessage, AllAPPMessagesType extends AppMessage> {
  defaultUsePort: boolean
  portIdToPort: Map<string, PortContext<L2ReqMsg, L2ResMsg>> = new Map()
  methods?: L2MethodHandlers<M, L2ReqMsg, L2ResMsg>

  debug = (...args: any[]) => {
    console.debug('[Extension Messaging]', ...args)
  }

  constructor(defaultUsePort: boolean) {
    this.defaultUsePort = defaultUsePort
  }

  init = (methods: L2MethodHandlers<M, L2ReqMsg, L2ResMsg>) => {
    const innerMethods: L2MethodHandlers<MessagingExtensionMessages, L2ReqMsg, L2ResMsg> = {
      _HANDSHAKE: async (params, context: MethodContext, portContext?: PortContext<L2ReqMsg, L2ResMsg>) => {
        const tag = params.tag
        let tabId = params.tabId

        // get current tabId
        if (tabId == null) {
          const tabs = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          })
          tabId = tabs[0]?.id
        }

        // 先清理相同tabId与tag的port
        for (const portContext_ of this.portIdToPort.values()) {
          if (portContext_.tabId === tabId && portContext_.tag === tag && portContext_.id !== portContext!.id) {
            this.portIdToPort.delete(portContext_.id)
            portContext_.l1protocol.dispose()
            this.debug('clean port: ', portContext_.id)
          }
        }

        portContext!.tabId = tabId
        portContext!.tag = tag
        portContext!.ready = true

        console.debug('handshake:', portContext!.id, tabId, tag)
      },
      _ROUTE: async (params, context: MethodContext) => {
        return await this.sendMessage(params.usePort, context.tabId!, params.tag, params.method as any, params.params)
      },
    }

    this.methods = { ...innerMethods, ...methods }

    chrome.runtime.onMessage.addListener((req: L2ReqMsg, sender: chrome.runtime.MessageSender, sendResponse) => {
      this.debug('onMessage', req, sender)

      // check target
      if (req.target !== 'extension') {
        return false
      }

      const tabId = sender.tab?.id
      const method = this.methods?.[req.method as keyof typeof this.methods]
      // console.log('msg>>>', tabId, req, method != null)
      if (method != null) {
        method(req.params, {
          from: req.from,
          event: req,
          tabId,
        }).then((data) => {
          sendResponse({
            code: 200,
            data,
          })
        }).catch((err) => {
          console.error(err)
          sendResponse({
            code: 500,
            msg: err.message,
          })
        })
      } else {
        sendResponse({
          code: 501,
          msg: 'Unknown method: ' + req.method,
        })
      }
      return true
    })

    chrome.runtime.onConnect.addListener((port: chrome.runtime.Port) => {
      this.debug('onConnect', port)

      const id = crypto.randomUUID()
      // const name = port.name
      // 创建消息处理器
      const l1protocol = new Layer1Protocol<L2ReqMsg, L2ResMsg>(async (req: L2ReqMsg) => {
        const { tabId } = portContext
        const method = this.methods?.[req.method as keyof typeof this.methods]
        console.debug('ext_msg>>>', tabId, req)
        if (method != null) {
          return await method(req.params, {
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
      const portContext: PortContext<L2ReqMsg, L2ResMsg> = { id, port, l1protocol, ready: false }
      this.portIdToPort.set(id, portContext)

      // 监听断开连接
      port.onDisconnect.addListener(() => {
        this.debug('onDisconnect', id)
        this.portIdToPort.delete(id)
      })
    })
  }

  sendMessage = async <M extends AllInjectMessagesType | AllAPPMessagesType, K extends M['method']>(usePort: boolean | null, tabId: number, tag: string, method: K, params?: Extract<M, { method: K }>['params']): Promise<Extract<M, { method: K }>['return']> => {
    this.debug('sendMessage', usePort, tabId, tag, method, params)
    if (tag === TAG_TARGET_INJECT) {
      const res = await chrome.tabs.sendMessage(tabId, {
        from: 'extension',
        target: 'inject',
        method,
        params,
      })
      return handleRes(res)
    } else if (tag === TAG_TARGET_APP) {
      if (usePort === null) {
        usePort = this.defaultUsePort
      }
      if (usePort) {
        // 这里一定要返回最后一个，而不是第一个就返回，因为开发调试时，应用会启动两次，所以会有两个port，所以这里要返回最后一个
        let res: any = null
        for (const portContext of this.portIdToPort.values()) {
          // check tabId
          if (tabId === portContext.tabId!) {
            // check tag
            if (portContext.tag === tag) {
              try {
                res = await portContext.l1protocol.sendMessage({ method, params, from: 'extension', target: 'app' })
              } catch (e) {
                console.error('send message to port error', portContext.id, e)
              }
            }
          }
        }
        return res
      } else {
        const res = await chrome.tabs.sendMessage(tabId, {
          from: 'extension',
          target: 'app',
          method,
          params,
        })
        return handleRes(res)
      }
    } else {
      throw new Error('Unknown tag:' + tag)
    }
  }

  broadcastMessageExact = <M extends AllInjectMessagesType | AllAPPMessagesType, K extends M['method']>(usePort: boolean | null, tabIds: number[], tag: string, method: K, params?: Extract<M, { method: K }>['params']) => {
    for (const tabId of tabIds) {
      this.sendMessage(usePort, tabId, tag, method, params)
    }
  }

  broadcastMessage = async <M extends AllInjectMessagesType | AllAPPMessagesType, K extends M['method']>(usePort: boolean | null, ignoreTabIds: number[] | undefined | null, tag: string, method: K, params?: Extract<M, { method: K }>['params']) => {
    const tabs = await chrome.tabs.query({
      discarded: false,
    })
    const tabIds: number[] = tabs.map(tab => tab.id).filter(tabId => tabId != null) as number[]
    const filteredTabIds: number[] = tabIds.filter(tabId => !ignoreTabIds?.includes(tabId))
    this.broadcastMessageExact(usePort, filteredTabIds, tag, method, params)
  }
}

export default ExtensionMessaging
