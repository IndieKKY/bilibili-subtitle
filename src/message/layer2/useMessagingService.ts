import { useCallback, useEffect } from 'react'
import Waiter from '../../utils/Waiter'
import Layer1Protocol from '../layer1/Layer1Protocol'
import { sendHandshakeFromApp } from '../messagingUtil'
import { useAsyncEffect } from 'ahooks'
import { AppMessage, L2ReqMsg, L2ResMsg, MethodContext } from '../typings'

const debug = (...args: any[]) => {
  console.debug('[App Messaging]', ...args)
}

let l1protocolInit: boolean = false
let l1protocol: Layer1Protocol<L2ReqMsg, L2ResMsg> | undefined
// let postInjectMessage: (method: string, params: PostMessagePayload) => Promise<PostMessageResponse> | undefined

export const msgWaiter = new Waiter<Layer1Protocol<L2ReqMsg, L2ResMsg>>(() => ({
  finished: l1protocolInit,
  data: l1protocol!,
}), 100, 15000)

const useMessagingService = <AllAPPMessagesType extends AppMessage>(usePort: boolean, methodsFunc?: () => {
  [K in AllAPPMessagesType['method']]: (params: Extract<AllAPPMessagesType, { method: K }>['params'], context: MethodContext) => Promise<any>
}) => {
  const messageHandler = useCallback(async (req: L2ReqMsg): Promise<L2ResMsg> => {
    debug(`[${req.from}] ${req.method}`, JSON.stringify(req))

    const methods = methodsFunc?.()
    const method = methods?.[req.method as keyof typeof methods]
    if (method != null) {
      return await method(req.params, {
        from: req.from,
        event: req,
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
  }, [methodsFunc])

  // 普通
  useEffect(() => {
    const listener = (req: L2ReqMsg, sender: chrome.runtime.MessageSender, sendResponse: (res: L2ResMsg) => void) => {
      // check target
      if (req.target!== 'app') {
        return false
      }
      messageHandler(req).then(res => {
        sendResponse(res)
      })
      return true
    }
    chrome.runtime.onMessage.addListener(listener)
    return () => {
      chrome.runtime.onMessage.removeListener(listener)
    }
  }, [messageHandler])

  // port
  useAsyncEffect(async () => {
    if (messageHandler && usePort) {
      l1protocol = new Layer1Protocol<L2ReqMsg, L2ResMsg>(messageHandler)
      // 初始化
      sendHandshakeFromApp(l1protocol)
      l1protocolInit = true
    }
  }, [messageHandler, usePort])
}

export default useMessagingService
