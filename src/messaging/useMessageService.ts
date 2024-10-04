import {useCallback, useEffect} from 'react'
import {
  MESSAGE_TARGET_APP,
  MESSAGE_TARGET_EXTENSION,
  MESSAGE_TARGET_INJECT,
} from '@/const'
import {callServer, PostMessagePayload, PostMessageResponse} from 'postmessage-promise'
import {Waiter} from '@kky002/kky-util'

const debug = (...args: any[]) => {
  console.debug('[App Messaging]', ...args)
}

let postInjectMessage: (method: string, params: PostMessagePayload) => Promise<PostMessageResponse> | undefined

export const injectWaiter = new Waiter<typeof postInjectMessage>(() => ({
  finished: postInjectMessage != null,
  data: postInjectMessage
}), 100, 15000)

const useMessageService = (methods?: {
  [key: string]: (params: any, from: string, context: MethodContext) => boolean
}) => {
  const messageHandler = useCallback((method: string, params: any, from: string, context: any): boolean => {
    const handler = methods?.[method]
    if (handler != null) {
      return handler(params, from, context)
    }else {
      debug('unknown message method: ', method)
      return false
    }
  }, [methods])

  // connect to inject
  useEffect(() => {
    let destroyFunc: (() => void) | undefined

    const serverObject = {
      server: window.parent, // openedWindow / window.parent / window.opener;
      origin: '*', // target-window's origin or *
    }
    const options = {}
    callServer(serverObject, options).then(e => {
      const { postMessage, listenMessage, destroy } = e
      postInjectMessage = postMessage
      destroyFunc = destroy

      listenMessage((method, params, sendResponse) => {
        debug('inject => ', method, params)

        const success = messageHandler(method, params, MESSAGE_TARGET_INJECT, {})
        sendResponse({
          success,
          code: success ? 200 : 500
        })
      })

      debug('message ready')
    }).catch(console.error)

    return () => {
      destroyFunc?.()
    }
  }, [messageHandler])

  const extensionMessageCallback = useCallback((event: MessageData, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    debug((sender.tab != null) ? `tab ${sender.tab.url??''} => ` : 'extension => ', JSON.stringify(event))

    // check event target
    if (!event || event.target !== MESSAGE_TARGET_APP) return

    messageHandler(event.method, event.params, MESSAGE_TARGET_EXTENSION, {
      sender
    })
  }, [messageHandler])

  // listen for message
  useEffect(() => {
    chrome.runtime.onMessage.addListener(extensionMessageCallback)
    return () => {
      chrome.runtime.onMessage.removeListener(extensionMessageCallback)
    }
  }, [extensionMessageCallback])
}

export default useMessageService
