import { msgWaiter } from './useMessagingService'
import { useCallback, useState } from 'react'
import Layer1Protocol from '../layer1/Layer1Protocol'
import { TAG_TARGET_INJECT } from '../const'
import { sendHandshakeFromApp } from '../messagingUtil'
import { ExtensionMessage, InjectMessage, L2ReqMsg, L2ResMsg, MessagingExtensionMessages } from '../typings'
import { handleRes } from '../util'

const useMessaging = <AllExtensionMessagesType extends ExtensionMessage, AllInjectMessagesType extends InjectMessage>(defaultUsePort: boolean) => {
  const [disconnected, setDisconnected] = useState(false)

  const sendExtension = useCallback(async <M extends AllExtensionMessagesType | MessagingExtensionMessages, K extends M['method']>(usePort: boolean | null, method: K, params?: Extract<M, { method: K }>['params']): Promise<Extract<M, { method: K }>['return']> => {
    if (usePort === null) {
      usePort = defaultUsePort
    }
    if (usePort) {
      // wait
      const pmh = await msgWaiter.wait()
      if (pmh.disconnected) {
        // console.info('pmh reconnect...')
        // pmh.reconnect()
        // 初始化
        // sendHandshakeFromApp(pmh)
        setDisconnected(true)
        throw new Error('disconnected')
      }
      // send message
      console.debug('pmh_sendMessage:', method, params)
      return handleRes(await pmh.sendMessage({
        from: 'app',
        target: 'extension',
        method,
        params: params ?? {},
      }))
    } else {
      // send message
      const res = await chrome.runtime.sendMessage({
        from: 'app',
        target: 'extension',
        method,
        params: params?? {},
      })
      return handleRes(res)
    }
  }, [defaultUsePort])

  const sendInject = useCallback(async <M extends AllInjectMessagesType, K extends M['method']>(usePort: boolean | null, method: K, params?: Extract<M, { method: K }>['params']): Promise<Extract<M, { method: K }>['return']> => {
    return await sendExtension(usePort, '_ROUTE' as any, {
      usePort: false, // 路由到inject不需要port
      tag: TAG_TARGET_INJECT,
      method,
      params: params ?? {},
    })
  }, [sendExtension])

  return {
    sendExtension,
    sendInject,
    disconnected
  }
}

export default useMessaging
