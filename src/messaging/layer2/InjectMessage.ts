import { MESSAGE_TARGET_INJECT } from '@/consts/const'
import Layer1Protocol from '../layer1/Layer1Protocol'
import { L2ReqMsg, L2ResMsg, MESSAGE_TO_EXTENSION_HANDSHAKE, MESSAGE_TO_EXTENSION_ROUTE_MSG, TAG_TARGET_APP, TAG_TARGET_INJECT } from '../const'

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
        // if (req.target !== MESSAGE_TARGET_INJECT) return Promise.resolve({
        //     success: false,
        //     code: 501,
        //     message: 'Target Error: ' + req.target,
        // })

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
                let msg
                if (err instanceof Error) {
                    msg = err.message
                } else if (typeof err === 'string') {
                    msg = err
                } else {
                    msg = 'error: ' + JSON.stringify(err)
                }
                return {
                    code: 500,
                    msg,
                }
            })
        } else {
            return {
                code: 501,
                msg: 'Unknown method: ' + req.method,
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
            method: MESSAGE_TO_EXTENSION_HANDSHAKE,
            params: {
                type: 'inject',
                tags: [TAG_TARGET_INJECT],
            },
        })
    }

    sendExtension = async <T = any>(method: string, params?: any): Promise<T> => {
        return await this.portMessageHandler!.sendMessage({
            from: 'inject',
            method,
            params: params ?? {},
        }).then((res) => {
            if (res.code === 200) {
                return res.data as T
            } else {
                throw new Error(res.msg)
            }
        })
    }

    sendApp = async <T>(method: string, params: any): Promise<T> => {
        if (method === 'setVideoInfo') {
            console.log('sendApp>>>', method, params)
        }
        return this.sendExtension(MESSAGE_TO_EXTENSION_ROUTE_MSG, {
            tags: [TAG_TARGET_APP],
            method,
            params,
        })
    }

}

export default InjectMessage