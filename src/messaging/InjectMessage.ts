import { MESSAGE_TARGET_APP, MESSAGE_TARGET_EXTENSION, MESSAGE_TARGET_INJECT } from '@/consts/const'
import Layer1Protocol from './Layer1Protocol'
import { L2ReqMsg, L2ResMsg, MESSAGE_TO_EXTENSION_ROUTE_MSG } from './const'

class InjectMessage {
    port?: chrome.runtime.Port
    portMessageHandler?: Layer1Protocol<L2ReqMsg, L2ResMsg>
    //类实例
    methods?: {
        [key: string]: (params: any, context: MethodContext) => Promise<L2ResMsg>
    }

    debug = (...args: any[]) => {
        console.debug('[Inject Messaging]', ...args)
    }

    messageHandler = async (req: L2ReqMsg): Promise<L2ResMsg> => {
        this.debug(`${req.from} => `, JSON.stringify(req))

        // check event target
        if (req.target !== MESSAGE_TARGET_INJECT) return Promise.resolve({
            success: false,
            code: 501,
            message: 'Target Error: ' + req.target,
        })

        const method = this.methods?.[req.method]
        if (method != null) {
            return method(req.params, {
                from: req.from,
                event: req,
                // sender,
            }).then(data => {
                // debug(`${source} <= `, event.method, JSON.stringify(data))
                return {
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
                    code: 500,
                    message,
                }
            })
        } else {
            return {
                code: 501,
                message: 'Unknown method: ' + req.method,
            }
        }
    }

    init(methods: {
        [key: string]: (params: any, context: MethodContext) => Promise<any>
    }) {
        this.methods = methods
        this.port = chrome.runtime.connect(import.meta.env.VITE_EXTENSION_ID, {
            name: MESSAGE_TARGET_INJECT,
        })
        this.portMessageHandler = new Layer1Protocol<L2ReqMsg, L2ResMsg>(this.messageHandler, this.port)
        this.portMessageHandler.sendMessage({
            from: 'inject',
            target: MESSAGE_TARGET_EXTENSION,
            method: '_init',
            params: {
                type: 'inject',
            },
        })
    }

    sendExtension = async <T = any>(method: string, params?: any): Promise<T> => {
        const req: L2ReqMsg = {
            from: 'inject',
            target: MESSAGE_TARGET_EXTENSION,
            method,
            params: params ?? {},
        }
        return await this.portMessageHandler!.sendMessage(req).then((res) => {
            if (res.code === 200) {
                return res.data as T
            } else {
                throw new Error(res.message)
            }
        })
    }

    sendApp = async <T>(method: string, params: any): Promise<T> => {
        if (method === 'setVideoInfo') {
            console.log('sendApp>>>', method, params)
        }
        return this.sendExtension(MESSAGE_TO_EXTENSION_ROUTE_MSG, {
            target: MESSAGE_TARGET_APP,
            method,
            params,
        })
    }

}

export default InjectMessage