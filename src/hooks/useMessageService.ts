import {useCallback, useContext, useEffect} from 'react'
import {
  MESSAGE_TARGET_APP,
  MESSAGE_TARGET_EXTENSION,
  MESSAGE_TARGET_INJECT,
  MESSAGE_TO_APP_SET_INFOS,
  MESSAGE_TO_APP_SET_VIDEO_INFO,
} from '@/const'
import {debug} from '@/util/biz_util'
import {callServer, PostMessagePayload, PostMessageResponse} from 'postmessage-promise'
import {useAppDispatch} from '../hooks/redux'
import {Waiter} from '@kky002/kky-util'
import {setInfos, setTitle, setUrl, setCurInfo, setCurFetched, setData} from '@/redux/envReducer'

let postInjectMessage: (method: string, params: PostMessagePayload) => Promise<PostMessageResponse> | undefined

export const injectWaiter = new Waiter<typeof postInjectMessage>(() => ({
  finished: postInjectMessage != null,
  data: postInjectMessage
}), 100, 15000)

const useMessageService = () => {
  const dispatch = useAppDispatch()
  const path = 'app' //useAppSelector(state => state.env.path)

  const messageHandler = useCallback((method: string, params: any, from: string, context: any): boolean => {
    switch (method) {
      case MESSAGE_TO_APP_SET_INFOS:
        dispatch(setInfos(params.infos))
        dispatch(setCurInfo(undefined))
        dispatch(setCurFetched(false))
        dispatch(setData(undefined))
        break
      case MESSAGE_TO_APP_SET_VIDEO_INFO:
        dispatch(setInfos(params.infos))
        dispatch(setUrl(params.url))
        dispatch(setTitle(params.title))
        console.debug('video title: ', params.title)
        break
      default:
        debug('unknown message method: ', method)
        return false
    }
    return true
  }, [dispatch])

  // connect to inject
  useEffect(() => {
    if (path !== 'app') return

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
  }, [messageHandler, path])

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
