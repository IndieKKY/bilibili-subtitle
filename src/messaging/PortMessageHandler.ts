//暂时没用到

// 创建一个 PortMessageHandler 类，用于持久监听 port 并通过消息 ID 处理响应，支持超时
class PortMessageHandler<Req = any, Res = any> {
    private port: chrome.runtime.Port
    private timeout: number
    private messageMap: Map<string, { resolve: (value: Res) => void, timer: number }>

    constructor(port: chrome.runtime.Port, timeout = 30000) {  // 默认超时 30 秒
      this.port = port;
      this.timeout = timeout;
      this.messageMap = new Map();
      
      // 持久监听 port.onMessage
      this.port.onMessage.addListener((msg) => {
        const { id, ...response } = msg;
        if (this.messageMap.has(id)) {
          const { resolve, timer } = this.messageMap.get(id)!;
          // 清除超时定时器
          clearTimeout(timer);
          // 通过 ID 找到对应的 Promise 并 resolve
          resolve(response);
          // 处理完毕后，移除该消息 ID
          this.messageMap.delete(id);
        }
      });
    }
  
    // 使用 Promise 发送消息并等待响应，支持超时
    sendMessage(message: Req): Promise<Res> {
      const messageId = this._generateUniqueId();
      
      return new Promise((resolve, reject) => {
        // 设置一个超时定时器
        const timer = setTimeout(() => {
          // 超时后执行 reject 并从 Map 中删除
          this.messageMap.delete(messageId);
          reject(new Error(`Request timed out after ${this.timeout / 1000} seconds`));
        }, this.timeout);
  
        // 将 resolve 和 timer 函数与消息 ID 绑定，存入 Map
        this.messageMap.set(messageId, { resolve, timer });
  
        // 发送消息，并附带 ID
        this.port.postMessage({ ...message, id: messageId });
      });
    }
  
    // 生成唯一 ID（简单示例，可以使用更复杂的生成策略）
    _generateUniqueId() {
      return Math.random().toString(36).substr(2, 9);
    }
  }

  export default PortMessageHandler