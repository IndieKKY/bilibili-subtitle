import { MESSAGE_TARGET_EXTENSION, MESSAGE_TARGET_INJECT, MESSAGE_TO_EXTENSION_ROUTE_MSG } from '@/consts/const'
import { injectWaiter } from './useMessageService'
import { useCallback } from 'react'
import PortMessageHandler from './PortMessageHandler'

const useMessage = () => {
    const sendExtension = useCallback(async <T = any>(method: string, params?: any) => {
        // wait
        const portMessageHandler = await injectWaiter.wait() as PortMessageHandler<MessageData, MessageResult>
        // send message
        const messageResult = await portMessageHandler.sendMessage({
            from: 'app',
            target: MESSAGE_TARGET_EXTENSION,
            method,
            params: params ?? {},
        }) as MessageResult | undefined
        if (messageResult != null) {
            if (messageResult.success) {
                return messageResult.data as T
            } else {
                throw new Error(messageResult.message)
            }
        } else {
            throw new Error('no response')
        }
    }, [])

    const sendInject = useCallback(async <T = any>(method: string, params?: any): Promise<T> => {
        return await sendExtension(MESSAGE_TO_EXTENSION_ROUTE_MSG, {
            target: MESSAGE_TARGET_INJECT,
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