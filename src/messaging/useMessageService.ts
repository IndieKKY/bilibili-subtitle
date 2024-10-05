import { useCallback, useMemo } from 'react'
import {
  MESSAGE_TARGET_APP,
} from '@/consts/const'
import { Waiter } from '@kky002/kky-util'
import Layer1Protocol from './Layer1Protocol'

const debug = (...args: any[]) => {
  console.debug('[App Messaging]', ...args)
}

let portMessageHandlerInit: boolean = false
let portMessageHandler: Layer1Protocol<MessageData, MessageResult> | undefined
// let postInjectMessage: (method: string, params: PostMessagePayload) => Promise<PostMessageResponse> | undefined

export const injectWaiter = new Waiter<any>(() => ({
  finished: portMessageHandlerInit,
  data: portMessageHandler
}), 100, 15000)

const useMessageService = (methods?: {
  [key: string]: (params: any, context: MethodContext) => Promise<any>
}) => {
  const messageHandler = useCallback(async (event: MessageData): Promise<MessageResult> => {
    debug(`${event.from} => `, JSON.stringify(event))

    // check event target
    if (event.target !== MESSAGE_TARGET_APP) return {
      success: false,
      code: 501,
      message: 'Target Error: ' + event.target,
    }

    const method = methods?.[event.method]
    if (method != null) {
      return method(event.params, {
        from: event.from,
        event,
      }).then(data => {
        // debug(`${source} <= `, event.method, JSON.stringify(data))
        return {
          success: true,
          code: 200,
          data,
        }
      }).catch(err => {
        console.error(err)
        let message
        if (err instanceof Error) {
          message = err.message
        } else if (typeof err === 'string') {
          message = err
        } else {
          message = 'error: ' + JSON.stringify(err)
        }
        return {
          success: false,
          code: 500,
          message,
        }
      })
    } else {
      return {
        success: false,
        code: 501,
        message: 'Unknown method: ' + event.method,
      }
    }
  }, [methods])

  const port = useMemo(() => {
    return chrome.runtime.connect(import.meta.env.VITE_EXTENSION_ID, {
      name: MESSAGE_TARGET_APP,
    })
  }, [])
  portMessageHandler = useMemo(() => {
    if (messageHandler && port) {
      const pmh = new Layer1Protocol<MessageData, MessageResult>(messageHandler, port)
  
      pmh.startListen()
      //get tabId from url params
      let tabIdStr = window.location.search.split('tabId=')[1]
      let tabId = tabIdStr ? parseInt(tabIdStr) : undefined
      // 初始化
      pmh.sendMessage({
          method: '_init',
          params: {
              type: 'app',
              tabId,
          },
      } as MessageData)
      portMessageHandlerInit = true
  
      return pmh
    }
  }, [messageHandler, port])
}

export default useMessageService
