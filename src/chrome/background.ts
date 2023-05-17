import {v4} from 'uuid'
import {handleTask, initTaskService, tasksMap} from './taskService'

/**
 * 消息处理入口
 * 注意：需要异步sendResponse时返回true
 */
chrome.runtime.onMessage.addListener((event, sender, sendResponse) => {
  console.debug('收到请求: ', event)
  if (event.type === 'p') { // 发出http请求
    const {url, options} = event
    // 发出请求
    fetch('http://localhost:27081/oproxy/p', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        options,
      }),
    }).then(async res => await res.json()).then(sendResponse).catch(console.error)
    return true
  } else if (event.type === 'syncGet') { // sync.get
    chrome.storage.sync.get(event.keys, data => {
      sendResponse(data)
    })
    return true
  } else if (event.type === 'syncSet') { // sync.set
    chrome.storage.sync.set(event.items).catch(console.error)
  } else if (event.type === 'syncRemove') { // sync.remove
    chrome.storage.sync.remove(event.keys).catch(console.error)
  } else if (event.type === 'addTask') {
    // 新建任务
    const task: Task = {
      id: v4(),
      startTime: Date.now(),
      status: 'pending',
      def: event.taskDef,
    }
    tasksMap.set(task.id, task)

    // 立即触发任务
    handleTask(task).catch(console.error)

    // 返回任务信息
    sendResponse(task)
  } else if (event.type === 'getTask') {
    // 返回任务信息
    const taskId = event.taskId
    const task = tasksMap.get(taskId)
    if (task == null) {
      sendResponse({
        code: 'not_found',
      })
      return
    }

    // 检测删除缓存
    if (task.status === 'done') {
      tasksMap.delete(taskId)
    }

    // 返回任务
    sendResponse({
      code: 'ok',
      task,
    })
  }
})

initTaskService()
