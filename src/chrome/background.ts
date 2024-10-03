import {v4} from 'uuid'
import {handleTask, initTaskService, tasksMap} from './taskService'
import {MESSAGE_TARGET_EXTENSION, MESSAGE_TO_EXTENSION_ADD_TASK, MESSAGE_TO_EXTENSION_GET_TASK} from '@/const'

const debug = (...args: any[]) => {
  console.debug('[Extension]', ...args)
}

const methods: {
  [key: string]: (params: any, context: MethodContext) => Promise<any>
} = {
  [MESSAGE_TO_EXTENSION_ADD_TASK]: async (params, context) => {
    // 新建任务
    const task: Task = {
      id: v4(),
      startTime: Date.now(),
      status: 'pending',
      def: params.taskDef,
    }
    tasksMap.set(task.id, task)

    // 立即触发任务
    handleTask(task).catch(console.error)

    return task
  },
  [MESSAGE_TO_EXTENSION_GET_TASK]: async (params, context) => {
    // 返回任务信息
    const taskId = params.taskId
    const task = tasksMap.get(taskId)
    if (task == null) {
      return {
        code: 'not_found',
      }
    }

    // 检测删除缓存
    if (task.status === 'done') {
      tasksMap.delete(taskId)
    }

    // 返回任务
    return {
      code: 'ok',
      task,
    }
  },
}

/**
 * Note: Return true when sending a response asynchronously.
 */
chrome.runtime.onMessage.addListener((event: MessageData, sender: chrome.runtime.MessageSender, sendResponse: (result: any) => void) => {
  debug((sender.tab != null) ? `tab ${sender.tab.url ?? ''} => ` : 'extension => ', event)

  // legacy
  if (event.type === 'syncGet') { // sync.get
    chrome.storage.sync.get(event.keys, data => {
      sendResponse(data)
    })
    return true
  } else if (event.type === 'syncSet') { // sync.set
    chrome.storage.sync.set(event.items).catch(console.error)
    return
  } else if (event.type === 'syncRemove') { // sync.remove
    chrome.storage.sync.remove(event.keys).catch(console.error)
    return
  }

  // check event target
  if (event.target !== MESSAGE_TARGET_EXTENSION) return

  const method = methods[event.method]
  if (method != null) {
    method(event.params, {
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

initTaskService()
