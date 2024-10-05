import { useCallback, useEffect, useMemo } from 'react'
import {
  MESSAGE_TARGET_APP,
  MESSAGE_TARGET_EXTENSION,
  MESSAGE_TARGET_INJECT,
} from '@/const'
import { callServer, PostMessagePayload, PostMessageResponse } from 'postmessage-promise'
import { Waiter } from '@kky002/kky-util'
import PortMessageHandler from './PortMessageHandler'

const debug = (...args: any[]) => {
  console.debug('[App Messaging]', ...args)
}

let portMessageHandlerInit: boolean = false
let portMessageHandler: PortMessageHandler<MessageData, MessageResult> | undefined
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
      const pmh = new PortMessageHandler<MessageData, MessageResult>(messageHandler, port)
  
      //get tabId from url params
      let tabId = window.location.search.split('tabId=')[1]
      if (!tabId) {
        pmh.startListen()
        pmh.init('app')
        portMessageHandlerInit = true
      }else {
        pmh.startListen()
        pmh.init('app', parseInt(tabId))
        portMessageHandlerInit = true
      }
  
      return pmh
    }
  }, [messageHandler, port])

  // connect to inject
  // useEffect(() => {
  //   let destroyFunc: (() => void) | undefined

  //   const serverObject = {
  //     server: window.parent, // openedWindow / window.parent / window.opener;
  //     origin: '*', // target-window's origin or *
  //   }
  //   const options = {}
  //   callServer(serverObject, options).then(e => {
  //     const { postMessage, listenMessage, destroy } = e
  //     postInjectMessage = postMessage
  //     destroyFunc = destroy

  //     listenMessage((method, params, sendResponse) => {
  //       debug('inject => ', method, params)

  //       const success = messageHandler(method, params, {
  //         from: 'inject',
  //         event: {
  //           method,
  //           params,
  //         },
  //       })
  //       sendResponse({
  //         success,
  //         code: success ? 200 : 500
  //       })
  //     })

  //     debug('message ready')
  //   }).catch(console.error)

  //   return () => {
  //     destroyFunc?.()
  //   }
  // }, [messageHandler])

  // const extensionMessageCallback = useCallback((event: MessageData, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  //   debug((sender.tab != null) ? `tab ${sender.tab.url??''} => ` : 'extension => ', JSON.stringify(event))

  //   // check event target
  //   if (!event || event.target !== MESSAGE_TARGET_APP) return

  //   messageHandler(event.method, event.params, {
  //     from: 'extension',
  //     event,
  //     sender,
  //   })
  // }, [messageHandler])

  // // listen for message
  // useEffect(() => {
  //   chrome.runtime.onMessage.addListener(extensionMessageCallback)
  //   return () => {
  //     chrome.runtime.onMessage.removeListener(extensionMessageCallback)
  //   }
  // }, [extensionMessageCallback])
}

export default useMessageService
