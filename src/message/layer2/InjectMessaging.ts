import { TAG_TARGET_APP } from '../const'
import { ExtensionMessage, InjectMessage, AppMessage, MethodContext, MessagingExtensionMessages, L2ReqMsg, L2ResMsg } from '../typings'
import { handleRes } from '../util'

class InjectMessaging<AllExtensionMessagesType extends ExtensionMessage, AllInjectMessagesType extends InjectMessage, AllAPPMessagesType extends AppMessage> {
  defaultUsePort: boolean
  port?: chrome.runtime.Port
  // l1protocol?: Layer1Protocol<L2ReqMsg, L2ResMsg>
  // 类实例
  methods?: {
    [K in AllInjectMessagesType['method']]: (params: Extract<AllInjectMessagesType, { method: K }>['params'], context: MethodContext) => Promise<any>
  }

  constructor(defaultUsePort: boolean) {
    this.defaultUsePort = defaultUsePort
  }

  debug = (...args: any[]) => {
    console.debug('[Inject Messaging]', ...args)
  }

  messageHandler = async (req: L2ReqMsg): Promise<L2ResMsg> => {
    this.debug(`[${req.from}] ${req.method}`, JSON.stringify(req))

    const method = this.methods?.[req.method as keyof typeof this.methods]
    if (method != null) {
      return await method(req.params, {
        from: req.from,
        event: req,
        // sender,
      }).then(data => {
        // debug(`${source} <= `, event.method, JSON.stringify(data))
        return {
          code: 200,
          data,
        }
      }).catch(err => {
        console.error(err)
        let msg
        if (err instanceof Error) {
          msg = err.message
        } else if (typeof err === 'string') {
          msg = err
        } else {
          msg = 'error: ' + JSON.stringify(err)
        }
        return {
          code: 500,
          msg,
        }
      })
    } else {
      return {
        code: 501,
        msg: 'Unknown method: ' + req.method,
      }
    }
  }

  init(methods: {
    [K in AllInjectMessagesType['method']]: (params: Extract<AllInjectMessagesType, { method: K }>['params'], context: MethodContext) => Promise<any>
  }) {
    this.methods = methods
    chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
      // check target
      if (req.target!== 'inject') {
        return false
      }

      this.messageHandler(req).then(res => {
        sendResponse(res)
      })
      return true
    })
  }

  sendExtension = async <M extends AllExtensionMessagesType | MessagingExtensionMessages, K extends M['method']>(method: K, params?: Extract<M, { method: K }>['params']): Promise<Extract<M, { method: K }>['return']> => {
    return await chrome.runtime.sendMessage({
      from: 'inject',
      target: 'extension',
      method,
      params: params ?? {},
    }).then(handleRes)
  }

  sendApp = async <M extends AllAPPMessagesType, K extends M['method']>(usePort: boolean | null, method: K, params?: Extract<M, { method: K }>['params']): Promise<Extract<M, { method: K }>['return']> => {
    if (usePort === null) {
      usePort = this.defaultUsePort
    }
    return await this.sendExtension('_ROUTE' as any, {
      usePort,
      tag: TAG_TARGET_APP,
      method,
      params,
    })
  }
}

export default InjectMessaging
