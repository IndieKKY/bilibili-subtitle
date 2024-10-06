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

// 处理函数
type Handler<L1Req = any, L1Res = any> = (req: L1Req) => Promise<L1Res>

// 创建一个 Layer1Protocol 类，用于持久监听 port 并通过消息 ID 处理响应，支持超时
class Layer1Protocol<L1Req = any, L1Res = any> {
  private port: chrome.runtime.Port
  private timeout: number
  private requests: Map<string, { resolve: (value: L1Res) => void, reject: (reason?: any) => void, timer: number }>
  private handler: Handler<L1Req, L1Res>

  constructor(handler: Handler<L1Req, L1Res>, port: chrome.runtime.Port, timeout = 30000) {  // 默认超时 30 秒
    this.port = port;
    this.timeout = timeout;
    this.requests = new Map();
    this.handler = handler

    // 开始监听
    this.port.onMessage.addListener(this._messageListener);
  }

  // 生成唯一 ID（简单示例，可以使用更复杂的生成策略）
  private _generateUniqueId() {
    return crypto.randomUUID()
  }

  private _messageListener = (msg: ReqMsg<L1Req, L1Res>) => {
    const { id, type, req, res } = msg;
    if (type === 'req') {
      this.handler(req!).then(res => {
        const response: RespMsg<L1Res> = {
          code: 200,
          data: res
        }
        this.port.postMessage({ id, type: 'res', res: response });
      }).catch(error => {//业务错误
        const response: RespMsg<L1Res> = {
          code: 500,
          msg: error instanceof Error ? error.message : String(error),
        }
        this.port.postMessage({ id, type: 'res', res: response });
      });
    } else if (type === 'res') {
      if (this.requests.has(id)) {
        const { resolve, reject, timer } = this.requests.get(id)!;
        // 清除超时定时器
        clearTimeout(timer);
        // 移除消息 ID
        this.requests.delete(id);
        // 通过 ID 找到对应的 Promise 并 resolve
        if (res!.code === 200) {
          resolve(res!.data!);
        } else {//业务错误
          reject(new Error(`${res!.code}: ${res!.msg || 'Unknown error'}`));
        }
      } else {
        console.error('unknown response message id: ', id)
      }
    } else {//语法格式错误
      console.error('unknown message type: ', type)
    }
  }

  dispose() {
    this.port.onMessage.removeListener(this._messageListener);
    this.requests.forEach(({ timer }) => clearTimeout(timer));
    this.requests.clear();
  }

  // 使用 Promise 发送消息并等待响应，支持超时
  sendMessage(req: L1Req): Promise<L1Res> {
    const id = this._generateUniqueId();

    return new Promise<L1Res>((resolve, reject) => {
      // 设置一个超时定时器
      const timer = setTimeout(() => {
        // 超时后执行 reject 并从 Map 中删除
        this.requests.delete(id);
        reject(new Error(`Request timed out after ${this.timeout / 1000} seconds`));
      }, this.timeout);

      // 将 resolve 和 timer 函数与消息 ID 绑定，存入 Map
      this.requests.set(id, { resolve, reject, timer });

      // 发送消息，并附带 ID
      this.port.postMessage({ id, type: 'req', req });
    });
  }
}

export default Layer1Protocol