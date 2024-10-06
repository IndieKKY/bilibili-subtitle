interface Message<T = any, R = any> {
    method: string
    params: T
    return: R
}

interface ExtensionMessage<T = any> extends Message<T> {
}

interface InjectMessage<T = any> extends Message<T> {
}

interface AppMessage<T = any> extends Message<T> {
}





interface ExtensionHandshakeMessage extends ExtensionMessage<{ tabId?: number, tags: string[] }> {
    method: 'HANDSHAKE';
}

interface ExtensionRouteMessage extends ExtensionMessage<{ tags: string[], method: string, params: any }> {
    method: 'ROUTE';
}

type MessagingExtensionMessages = ExtensionHandshakeMessage | ExtensionRouteMessage
