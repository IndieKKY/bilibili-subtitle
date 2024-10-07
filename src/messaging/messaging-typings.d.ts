interface Message<T = any, R = any> {
    method: string
    params: T
    return: R
}

interface ExtensionMessage<T = any, R = any> extends Message<T, R> {
}

interface InjectMessage<T = any, R = any> extends Message<T, R> {
}

interface AppMessage<T = any, R = any> extends Message<T, R> {
}





interface ExtensionHandshakeMessage extends ExtensionMessage<{ tabId?: number, tags: string[] }> {
    method: '_HANDSHAKE';
}

interface ExtensionRouteMessage extends ExtensionMessage<{ tags: string[], method: string, params: any }> {
    method: '_ROUTE';
}

type MessagingExtensionMessages = ExtensionHandshakeMessage | ExtensionRouteMessage
