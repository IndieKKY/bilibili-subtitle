import {v4} from 'uuid'
import {handleTask, initTaskService, tasksMap} from './taskService'
import { MESSAGE_TO_EXTENSION_ADD_TASK, MESSAGE_TO_EXTENSION_CLOSE_SIDE_PANEL, MESSAGE_TO_EXTENSION_GET_TASK, MESSAGE_TO_EXTENSION_SHOW_FLAG, MESSAGE_TO_INJECT_TOGGLE_DISPLAY, STORAGE_ENV} from '@/consts/const'
import ExtensionMessaging from '@/messaging/layer2/ExtensionMessaging'
import { TAG_TARGET_INJECT } from '@/messaging/const'

const setBadgeOk = async (tabId: number, ok: boolean) => {
  await chrome.action.setBadgeText({
    text: ok ? '✓' : '',
    tabId,
  })
  await chrome.action.setBadgeBackgroundColor({
    color: '#3245e8',
    tabId,
  })
  await chrome.action.setBadgeTextColor({
    color: '#ffffff',
    tabId,
  })
}

const closeSidePanel = async () => {
  chrome.sidePanel.setOptions({
    enabled: false,
  })
  chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: false,
  })
}

const methods: {
  [key: string]: (params: any, context: MethodContext) => Promise<any>
} = {
  [MESSAGE_TO_EXTENSION_CLOSE_SIDE_PANEL]: async (params, context) => {
    closeSidePanel()
  },
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
  [MESSAGE_TO_EXTENSION_SHOW_FLAG]: async (params, context) => {
    await setBadgeOk(context.tabId!, params.show)
  },
}
// 初始化backgroundMessage
const extensionMessaging = new ExtensionMessaging()
extensionMessaging.init(methods)

chrome.runtime.onMessage.addListener((event: MessageData, sender: chrome.runtime.MessageSender, sendResponse: (result: any) => void) => {
  // debug((sender.tab != null) ? `tab ${sender.tab.url ?? ''} => ` : 'extension => ', event)

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
})

//点击扩展图标
chrome.action.onClicked.addListener(async (tab) => {
  chrome.storage.sync.get(STORAGE_ENV, (envDatas) => {
    const envDataStr = envDatas[STORAGE_ENV]
    const envData = envDataStr ? JSON.parse(envDataStr) : {}
    if (envData.sidePanel) {
      chrome.sidePanel.setOptions({
        enabled: true,
        tabId: tab.id!,
        path: '/sidepanel.html?tabId=' + tab.id,
      })
      chrome.sidePanel.setPanelBehavior({
        openPanelOnActionClick: true,
      })
      chrome.sidePanel.open({
        tabId: tab.id!,
      })
    } else {
      closeSidePanel()
      extensionMessaging.broadcastMessageExact([tab.id!], [TAG_TARGET_INJECT], MESSAGE_TO_INJECT_TOGGLE_DISPLAY).catch(console.error)
    }
  })
})

initTaskService()
