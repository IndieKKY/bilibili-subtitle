import { msgWaiter } from './useMessagingService'
import { useCallback } from 'react'
import Layer1Protocol from '../layer1/Layer1Protocol'
import { L2ReqMsg, L2ResMsg, TAG_TARGET_INJECT } from '../const'

const useMessaging = () => {
    const sendExtension = useCallback(async <M extends AllExtensionMessages | MessagingExtensionMessages, K extends M['method']>(method: K, params?: Extract<M, { method: K }>['params']): Promise<Extract<M, { method: K }>['return']> => {
        // wait
        const pmh = await msgWaiter.wait() as Layer1Protocol<L2ReqMsg, L2ResMsg>
        // send message
        const res = await pmh.sendMessage({
            from: 'app',
            method,
            params: params ?? {},
        })
        if (res.code === 200) {
            return res.data
        } else {
            throw new Error(res.msg)
        }
    }, [])

    const sendInject = useCallback(async <M extends AllInjectMessages, K extends M['method']>(method: K, params?: Extract<M, { method: K }>['params']): Promise<Extract<M, { method: K }>['return']> => {
        return await sendExtension('ROUTE', {
            tags: [TAG_TARGET_INJECT],
            method,
            params: params ?? {},
        })
    }, [])

    return {
        sendExtension,
        sendInject
    }
}

export default useMessaging
