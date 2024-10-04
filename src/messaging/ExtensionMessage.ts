import { MESSAGE_TARGET_EXTENSION } from '@/const'

class ExtensionMessage {
  methods?: {
    [key: string]: (params: any, context: MethodContext) => Promise<any>
  }

  debug = (...args: any[]) => {
    console.debug('[Extension Messaging]', ...args)
  }
  
  init = (methods: {
    [key: string]: (params: any, context: MethodContext) => Promise<any>
  }) => {
    this.methods = methods

    /**
     * Note: Return true when sending a response asynchronously.
     */
    chrome.runtime.onMessage.addListener((event: MessageData, sender: chrome.runtime.MessageSender, sendResponse: (result: any) => void) => {
      this.debug((sender.tab != null) ? `tab ${sender.tab.url ?? ''} => ` : 'extension => ', event)

      // check event target
      if (event.target !== MESSAGE_TARGET_EXTENSION) return

      const method = this.methods?.[event.method]
      if (method != null) {
        method(event.params, {
          from: event.from,
          event,
          sender,
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
    })
  }

  broadcastMessage = async (ignoreTabIds: number[] | undefined | null, target: string, method: string, params?: any) => {
    const tabs = await chrome.tabs.query({
      discarded: false,
    })
    for (const tab of tabs) {
      try {
        if (tab.id && ((ignoreTabIds == null) || !ignoreTabIds.includes(tab.id))) {
          await chrome.tabs.sendMessage(tab.id, {target, method, params})
        }
      } catch (e) {
        console.error('send message to tab error', tab.id, e)
      }
    }
  }
}

export default ExtensionMessage