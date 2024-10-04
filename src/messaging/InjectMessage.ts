import { MESSAGE_TARGET_EXTENSION, MESSAGE_TARGET_INJECT } from '@/const'
import { PostMessagePayload, PostMessageResponse, startListening } from 'postmessage-promise'

class InjectMessage {
    //类实例
    methods?: {
        [key: string]: (params: any, context: MethodContext) => Promise<any>
    }
    postMessageToApp?: (method: string, payload: PostMessagePayload) => Promise<PostMessageResponse>

    debug = (...args: any[]) => {
        console.debug('[Inject Messaging]', ...args)
    }

    /**
     * @param sendResponse No matter what is returned, this method will definitely be called.
     */
    messageHandler = (event: MessageData, sender: chrome.runtime.MessageSender | null, sendResponse: (response?: MessageResult) => void) => {
        const source = sender != null ? ((sender.tab != null) ? `tab ${sender.tab.url ?? ''}` : 'extension') : 'app'
        this.debug(`${source} => `, JSON.stringify(event))

        // check event target
        if (event.target !== MESSAGE_TARGET_INJECT) return

        const method = this.methods?.[event.method]
        if (method != null) {
            method(event.params, {
                event,
                sender,
            }).then(data => {
                // debug(`${source} <= `, event.method, JSON.stringify(data))
                return data
            }).then(data => sendResponse({
                success: true,
                code: 200,
                data,
            })).catch(err => {
                console.error(err)
                let message
                if (err instanceof Error) {
                    message = err.message
                } else if (typeof err === 'string') {
                    message = err
                } else {
                    message = 'error: ' + JSON.stringify(err)
                }
                sendResponse({
                    success: false,
                    code: 500,
                    message,
                })
            })
            return true
        } else {
            console.error('Unknown method:', event.method)
            sendResponse({
                success: false,
                code: 501,
                message: 'Unknown method: ' + event.method,
            })
        }
    }

    init(methods: {
        [key: string]: (params: any, context: MethodContext) => Promise<any>
    }) {
        this.methods = methods
        // listen message from app
        startListening({}).then(e => {
            const { postMessage, listenMessage, destroy } = e
            this.postMessageToApp = postMessage
            listenMessage((method, params, sendResponse) => {
                this.messageHandler({
                    target: MESSAGE_TARGET_INJECT,
                    method,
                    params,
                }, null, sendResponse)
            })
        }).catch(console.error)

        /**
         * listen message from extension
         * Attention: return true if you need to sendResponse asynchronously
         */
        chrome.runtime.onMessage.addListener(this.messageHandler)
    }

    sendExtension = async <T = any>(method: string, params?: any): Promise<T> => {
        return await chrome.runtime.sendMessage<MessageData, MessageResult>({
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
    }

    sendApp = async <T>(method: string, params: any): Promise<T> => {
        if (this.postMessageToApp != null) {
            const messageResult = await this.postMessageToApp(method, params) as MessageResult | undefined
            if (messageResult != null) {
                if (messageResult.success) {
                    return messageResult.data as T
                } else {
                    throw new Error(messageResult.message)
                }
            } else {
                throw new Error('no response')
            }
        } else {
            throw new Error('error: postMessageToApp is not initialized')
        }
    }

}

export default InjectMessage