import Layer1Protocol from '../layer1/Layer1Protocol'
import { L2ReqMsg, L2ResMsg, TAG_TARGET_APP, TAG_TARGET_INJECT } from '../const'

class InjectMessaging<AllExtensionMessagesType extends ExtensionMessage, AllInjectMessagesType extends InjectMessage, AllAPPMessagesType extends AppMessage> {
    port?: chrome.runtime.Port
    l1protocol?: Layer1Protocol<L2ReqMsg, L2ResMsg>
    //类实例
    methods?: {
        [K in AllInjectMessagesType['method']]: (params: Extract<AllInjectMessagesType, { method: K }>['params'], context: MethodContext) => Promise<any>
    }

    debug = (...args: any[]) => {
        console.debug('[Inject Messaging]', ...args)
    }

    messageHandler = async (req: L2ReqMsg): Promise<L2ResMsg> => {
        this.debug(`[${req.from}] ${req.method}`, JSON.stringify(req))

        // check event target
        // if (req.target !== MESSAGE_TARGET_INJECT) return Promise.resolve({
        //     success: false,
        //     code: 501,
        //     message: 'Target Error: ' + req.target,
        // })

        const method = this.methods?.[req.method as keyof typeof this.methods]
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
        [K in AllInjectMessagesType['method']]: (params: Extract<AllInjectMessagesType, { method: K }>['params'], context: MethodContext) => Promise<any>
    }) {
        this.methods = methods
        this.port = chrome.runtime.connect({
            name: 'bilibili-inject',
        })
        this.l1protocol = new Layer1Protocol<L2ReqMsg, L2ResMsg>(this.messageHandler, this.port)
        //握手
        this.l1protocol.sendMessage({
            from: 'inject',
            method: '_HANDSHAKE',
            params: {
                tags: [TAG_TARGET_INJECT],
            },
        })
    }

    sendExtension = async <M extends AllExtensionMessagesType | MessagingExtensionMessages, K extends M['method']>(method: K, params?: Extract<M, { method: K }>['params']): Promise<Extract<M, { method: K }>['return']> => {
        return await this.l1protocol!.sendMessage({
            from: 'inject',
            method,
            params: params ?? {},
        }).then((res) => {
            if (res.code === 200) {
                return res.data
            } else {
                throw new Error(res.msg)
            }
        })
    }

    sendApp = async <M extends AllAPPMessagesType, K extends M['method']>(method: K, params?: Extract<M, { method: K }>['params']): Promise<Extract<M, { method: K }>['return']> => {
        return this.sendExtension('_ROUTE' as any, {
            tags: [TAG_TARGET_APP],
            method,
            params,
        })
    }

}

export default InjectMessaging