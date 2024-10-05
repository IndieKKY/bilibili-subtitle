//暂时没用到

export type RespMsg<T = any> = {
  code: number
  data?: T
  msg?: string
}

export type PortMessageType = 'req' | 'res'

export type PortMessage<Req = any, Res = any> = {
  msgId: string
  msgType: PortMessageType
  req?: Req
  res?: RespMsg<Res>
}

// 创建一个 PortMessageHandler 类，用于持久监听 port 并通过消息 ID 处理响应，支持超时
class PortMessageHandler<Req = any, Res = any> {
  private port: chrome.runtime.Port
  private timeout: number
  private messageMap: Map<string, { resolve: (value: Res) => void, timer: number }>
  private handler: (value: Req) => Promise<Res>

  constructor(handler: (value: Req) => Promise<Res>, port: chrome.runtime.Port, timeout = 30000) {  // 默认超时 30 秒
    this.port = port;
    this.timeout = timeout;
    this.messageMap = new Map();
    this.handler = handler

    // 持久监听 port.onMessage
    this.port.onMessage.addListener((msg: PortMessage<Req, Res>) => {
      const { msgId, msgType, req, res } = msg;
      if (msgType === 'req') {
        this.handler(req!).then(res => {
          const response: RespMsg<Res> = {
            code: 200,
            msg: 'success',
            data: res
          }
          this.port.postMessage({ msgId, msgType: 'res', res: response });
        }).catch(error => {
          const response: RespMsg<Res> = {
            code: 500,
            msg: error.message,
          }
          this.port.postMessage({ msgId, msgType: 'res', res: response });
        });
      } else if (msgType === 'res') {
        if (this.messageMap.has(msgId)) {
          const { resolve, timer } = this.messageMap.get(msgId)!;
          // 清除超时定时器
          clearTimeout(timer);
          // 处理完毕后，移除该消息 ID
          this.messageMap.delete(msgId);
          // 通过 ID 找到对应的 Promise 并 resolve
          resolve(res!.data!);
        }
      }
    });
  }

  // 使用 Promise 发送消息并等待响应，支持超时
  sendMessage(req: Req): Promise<Res> {
    const msgId = this._generateUniqueId();

    return new Promise((resolve, reject) => {
      // 设置一个超时定时器
      const timer = setTimeout(() => {
        // 超时后执行 reject 并从 Map 中删除
        this.messageMap.delete(msgId);
        reject(new Error(`Request timed out after ${this.timeout / 1000} seconds`));
      }, this.timeout);

      // 将 resolve 和 timer 函数与消息 ID 绑定，存入 Map
      this.messageMap.set(msgId, { resolve, timer });

      // 发送消息，并附带 ID
      this.port.postMessage({ msgId, msgType: 'req', req });
    });
  }

  // 生成唯一 ID（简单示例，可以使用更复杂的生成策略）
  _generateUniqueId() {
    return crypto.randomUUID()
  }
}

export default PortMessageHandler