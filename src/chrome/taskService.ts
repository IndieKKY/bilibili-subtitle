import {TASK_EXPIRE_TIME} from '../consts/const'
import {handleChatCompleteTask} from './openaiService'

export const tasksMap = new Map<string, Task>()

export const handleTask = async (task: Task) => {
  console.debug(`处理任务: ${task.id} (type: ${task.def.type})`)
  try {
    task.status = 'running'
    switch (task.def.type) {
      case 'chatComplete':
        await handleChatCompleteTask(task)
        break
      default:
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        throw new Error(`任务类型不支持: ${task.def.type}`)
    }

    console.debug(`处理任务成功: ${task.id} (type: ${task.def.type})`)
  } catch (e: any) {
    task.error = e.message
    console.debug(`处理任务失败: ${task.id} (type: ${task.def.type})`, e.message)
  }
  task.status = 'done'
  task.endTime = Date.now()
}

export const initTaskService = () => {
  // 处理任务: tasksMap
  setInterval(() => {
    for (const [_, task] of tasksMap) {
      if (task.status === 'pending') {
        handleTask(task).catch(console.error)
        break
      } else if (task.status === 'running') {
        break
      }
    }
  }, 1000)
  // 检测清理tasksMap
  setInterval(() => {
    const now = Date.now()

    for (const [taskId, task] of tasksMap) {
      if (task.startTime < now - TASK_EXPIRE_TIME) {
        tasksMap.delete(taskId)
        console.debug(`清理任务: ${task.id} (type: ${task.def.type})`)
      }
    }
  }, 10000)
}
