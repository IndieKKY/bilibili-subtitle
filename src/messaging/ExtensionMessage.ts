import { MESSAGE_TARGET_EXTENSION, MESSAGE_TO_EXTENSION_ROUTE_MSG } from '@/consts/const'
import PortMessageHandler from './PortMessageHandler'

export type PortContext = {
  id: string
  name: string
  tabId: number
  type: 'inject' | 'app'
  port: chrome.runtime.Port
  portMessageHandler: PortMessageHandler
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

      const listener = async (firstMessage: any) => {
        console.log('firstMessage', name, firstMessage)

        let tabId = firstMessage.tabId
        let type = firstMessage.type
        if (tabId == null) {
          //get current tabId
          const tabs = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          })
          tabId = tabs[0]?.id
          console.log('current tabId: ', tabId)
        }
        if (tabId != null) {
          // @ts-ignore
          const portContext: PortContext = {id, name, tabId, port, type}
          const portMessageHandler = new PortMessageHandler<MessageData, MessageResult>(async (value: MessageData) => {
            return handler(value, portContext)
          }, port)
          portContext.portMessageHandler = portMessageHandler
          this.portIdToPort.set(id, portContext)

          // 移除监听
          port.onMessage.removeListener(listener)
          // 开始监听
          portMessageHandler.startListen()

          console.log('start listen>>>', name)
        }else {
          console.log('no tabId>>>', name)
        }
      }
      port.onMessage.addListener(listener)

      port.onDisconnect.addListener(() => {
        this.portIdToPort.delete(id)
      })
    })

    /**
     * Note: Return true when sending a response asynchronously.
     */
    // chrome.runtime.onMessage.addListener((event: MessageData, sender: chrome.runtime.MessageSender, sendResponse: (result: any) => void) => {
    //   this.debug((sender.tab != null) ? `tab ${sender.tab.url ?? ''} => ` : 'extension => ', event)

    //   // check event target
    //   if (event.target !== MESSAGE_TARGET_EXTENSION) return

    //   const method = this.methods?.[event.method]
    //   if (method != null) {
    //     method(event.params, {
    //       from: event.from,
    //       event,
    //       sender,
    //     }).then(data => sendResponse({
    //       success: true,
    //       code: 200,
    //       data,
    //     })).catch(err => {
    //       console.error(err)
    //       let message
    //       if (err instanceof Error) {
    //         message = err.message
    //       } else if (typeof err === 'string') {
    //         message = err
    //       } else {
    //         message = 'error: ' + JSON.stringify(err)
    //       }
    //       sendResponse({
    //         success: false,
    //         code: 500,
    //         message,
    //       })
    //     })
    //     return true
    //   } else {
    //     console.error('Unknown method:', event.method)
    //     sendResponse({
    //       success: false,
    //       code: 501,
    //       message: 'Unknown method: ' + event.method,
    //     })
    //   }
    // })
  }

  broadcastMessageExact = async (tabIds: number[], target: string, method: string, params?: any) => {
    //遍历portIdToPort
    const targetType = target === MESSAGE_TARGET_INJECT ? 'inject' : 'app'
    let resp: MessageResult | undefined
    for (const portContext of this.portIdToPort.values()) {
      if (tabIds.includes(portContext.tabId)) {
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