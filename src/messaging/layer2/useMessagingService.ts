import { useCallback, useMemo } from 'react'
import { Waiter } from '@kky002/kky-util'
import Layer1Protocol from '../layer1/Layer1Protocol'
import { L2ReqMsg, L2ResMsg, TAG_TARGET_APP } from '../const'

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

const useMessagingService = <AllAPPMessagesType extends AppMessage>(methods?: {
  [K in AllAPPMessagesType['method']]: (params: Extract<AllAPPMessagesType, { method: K }>['params'], context: MethodContext) => Promise<any>
}) => {
  const messageHandler = useCallback(async (req: L2ReqMsg): Promise<L2ResMsg> => {
    debug(`[${req.from}] ${req.method}`, JSON.stringify(req))

    // // check event target
    // if (req.target !== MESSAGE_TARGET_APP) return {
    //   code: 501,
    //   msg: 'Target Error: ' + req.target,
    // }

    const method = methods?.[req.method as keyof typeof methods]
    if (method != null) {
      return method(req.params, {
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
  }, [methods])

  const port = useMemo(() => {
    return chrome.runtime.connect(import.meta.env.VITE_EXTENSION_ID, {
      name: 'bilibili-app',
    })
  }, [])
  l1protocol = useMemo(() => {
    if (messageHandler && port) {
      const pmh = new Layer1Protocol<L2ReqMsg, L2ResMsg>(messageHandler, port)
  
      //get tabId from url params
      let tabIdStr = window.location.search.split('tabId=')[1]
      let tabId = tabIdStr ? parseInt(tabIdStr) : undefined
      // 初始化
      pmh.sendMessage({
          from: 'app',
          method: 'HANDSHAKE',
          params: {
              tabId,
              tags: [TAG_TARGET_APP],
          },
      })
      l1protocolInit = true
  
      return pmh
    }
  }, [messageHandler, port])
}

export default useMessagingService
