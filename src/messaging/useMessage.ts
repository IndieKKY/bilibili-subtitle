import { MESSAGE_TARGET_EXTENSION, MESSAGE_TARGET_INJECT } from '@/consts/const'
import { injectWaiter } from './useMessageService'
import { useCallback } from 'react'
import Layer1Protocol from './Layer1Protocol'
import { L2ReqMsg, L2ResMsg, MESSAGE_TO_EXTENSION_ROUTE_MSG, TAG_TARGET_INJECT } from './const'

const useMessage = () => {
    const sendExtension = useCallback(async <T = any>(method: string, params?: any) => {
        // wait
        const pmh = await injectWaiter.wait() as Layer1Protocol<L2ReqMsg, L2ResMsg>
        // send message
        const res = await pmh.sendMessage({
            from: 'app',
            method,
            params: params ?? {},
        })
        if (res.code === 200) {
            return res.data as T
        } else {
            throw new Error(res.msg)
        }
    }, [])

    const sendInject = useCallback(async <T = any>(method: string, params?: any): Promise<T> => {
        return await sendExtension(MESSAGE_TO_EXTENSION_ROUTE_MSG, {
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

export default useMessage