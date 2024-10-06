// 请求信息
type ReqMsg<L1Req = any, L1Res = any> = {
  id: string
  // 类型
  type: 'req' | 'res'
  // 请求
  req?: L1Req
  // 响应
  res?: RespMsg<L1Res>
}

// 响应信息
type RespMsg<T = any> = {
  code: number
  data?: T
  msg?: string
}

// 创建一个 Layer1Protocol 类，用于持久监听 port 并通过消息 ID 处理响应，支持超时
class Layer1Protocol<L1Req = any, L1Res = any> {
  private port: chrome.runtime.Port
  private timeout: number
  private requests: Map<string, { resolve: (value: L1Res) => void, timer: number }>
  private handler: (value: L1Req) => Promise<L1Res>

  constructor(handler: (value: L1Req) => Promise<L1Res>, port: chrome.runtime.Port, timeout = 30000) {  // 默认超时 30 秒
    this.port = port;
    this.timeout = timeout;
    this.requests = new Map();
    this.handler = handler

    this._startListen()
  }

  // 生成唯一 ID（简单示例，可以使用更复杂的生成策略）
  _generateUniqueId() {
    return crypto.randomUUID()
  }

  _startListen() {
    // 持久监听 port.onMessage
    this.port.onMessage.addListener((msg: ReqMsg<L1Req, L1Res>) => {
      const { id, type, req, res } = msg;
      if (type === 'req') {
        this.handler(req!).then(res => {
          const response: RespMsg<L1Res> = {
            code: 200,
            msg: 'success',
            data: res
          }
          this.port.postMessage({ id, type: 'res', res: response });
        }).catch(error => {
          const response: RespMsg<L1Res> = {
            code: 500,
            msg: error.message,
          }
          this.port.postMessage({ id, type: 'res', res: response });
        });
      } else if (type === 'res') {
        if (this.requests.has(id)) {
          const { resolve, timer } = this.requests.get(id)!;
          // 清除超时定时器
          clearTimeout(timer);
          // 移除消息 ID
          this.requests.delete(id);
          // 通过 ID 找到对应的 Promise 并 resolve
          resolve(res!.data!);
        }else {
          console.error('unknown response message id: ', id)
        }
      } else {
        console.error('unknown message type: ', type)
      }
    });
  }

  // 使用 Promise 发送消息并等待响应，支持超时
  sendMessage(req: L1Req): Promise<L1Res> {
    const id = this._generateUniqueId();

    return new Promise((resolve, reject) => {
      // 设置一个超时定时器
      const timer = setTimeout(() => {
        // 超时后执行 reject 并从 Map 中删除
        this.requests.delete(id);
        reject(new Error(`Request timed out after ${this.timeout / 1000} seconds`));
      }, this.timeout);

      // 将 resolve 和 timer 函数与消息 ID 绑定，存入 Map
      this.requests.set(id, { resolve, timer });

      // 发送消息，并附带 ID
      this.port.postMessage({ id, type: 'req', req });
    });
  }
}

export default Layer1Protocol