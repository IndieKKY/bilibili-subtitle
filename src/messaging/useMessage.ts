import { MESSAGE_TARGET_EXTENSION } from '@/const'
import { injectWaiter } from './useMessageService'
import { useCallback } from 'react'

const useMessage = () => {
    const sendExtension = useCallback(async <T = any>(method: string, params?: any) => {
        return await chrome.runtime.sendMessage<MessageData, MessageResult>({
            from: 'app',
            target: MESSAGE_TARGET_EXTENSION,
            method,
            params: params ?? {},
        }).then((messageResult) => {
            if (messageResult.success) {
                return messageResult.data as T
            } else {
                throw new Error(messageResult.message)
            }
        })
    }, [])

    const sendInject = useCallback(async <T = any>(method: string, params?: any) => {
        // wait
        const postInjectMessage = await injectWaiter.wait()
        // send message
        const messageResult = await postInjectMessage(method, params) as MessageResult | undefined
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

    return {
        sendExtension,
        sendInject
    }
}

export default useMessage