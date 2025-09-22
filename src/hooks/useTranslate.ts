import {useAppDispatch, useAppSelector} from './redux'
import {useCallback} from 'react'
import {
  addTaskId,
  addTransResults,
  delTaskId,
  mergeAskInfo,
  setLastSummarizeTime,
  setLastTransTime,
  setSummaryContent,
  setSummaryError,
  setSummaryStatus,
  setReviewAction,
  setTempData
} from '../redux/envReducer'
import {
  LANGUAGE_DEFAULT,
  LANGUAGES_MAP,
  PROMPT_DEFAULTS,
  PROMPT_TYPE_ASK,
  PROMPT_TYPE_TRANSLATE,
  SUMMARIZE_LANGUAGE_DEFAULT,
  SUMMARIZE_THRESHOLD,
  SUMMARIZE_TYPES,
  TRANSLATE_COOLDOWN,
  TRANSLATE_FETCH_DEFAULT,
} from '../consts/const'
import toast from 'react-hot-toast'
import {useMemoizedFn} from 'ahooks/es'
import {extractJsonArray, extractJsonObject, getModel} from '../utils/bizUtil'
import {formatTime} from '../utils/util'
import { useMessage } from './useMessageService'
const useTranslate = () => {
  const dispatch = useAppDispatch()
  const data = useAppSelector(state => state.env.data)
  const curIdx = useAppSelector(state => state.env.curIdx)
  const lastTransTime = useAppSelector(state => state.env.lastTransTime)
  const transResults = useAppSelector(state => state.env.transResults)
  const envData = useAppSelector(state => state.env.envData)
  const language = LANGUAGES_MAP[envData.language??LANGUAGE_DEFAULT]
  const summarizeLanguage = LANGUAGES_MAP[envData.summarizeLanguage??SUMMARIZE_LANGUAGE_DEFAULT]
  const title = useAppSelector(state => state.env.title)
  const reviewed = useAppSelector(state => state.env.tempData.reviewed)
  const reviewAction = useAppSelector(state => state.env.reviewAction)
  const reviewActions = useAppSelector(state => state.env.tempData.reviewActions)
  const {sendExtension} = useMessage(!!envData.sidePanel)
  /**
   * 获取下一个需要翻译的行
   * 会检测冷却
   */
  const getFetch = useCallback(() => {
    if (data?.body != null && data.body.length > 0) {
      const curIdx_ = curIdx ?? 0

      // check lastTransTime
      if (lastTransTime && Date.now() - lastTransTime < TRANSLATE_COOLDOWN) {
        return
      }

      let nextIdleIdx
      for (let i = curIdx_; i < data.body.length; i++) {
        if (transResults[i] == null) {
          nextIdleIdx = i
          break
        }
      }
      if (nextIdleIdx != null && nextIdleIdx - curIdx_ <= Math.ceil((envData.fetchAmount??TRANSLATE_FETCH_DEFAULT)/2)) {
        return nextIdleIdx
      }
    }
  }, [curIdx, data?.body, envData.fetchAmount, lastTransTime, transResults])

  const addTask = useCallback(async (startIdx: number) => {
    if ((data?.body) != null) {
      const lines: string[] = data.body.slice(startIdx, startIdx + (envData.fetchAmount??TRANSLATE_FETCH_DEFAULT)).map((item: any) => item.content)
      if (lines.length > 0) {
        const linesMap: {[key: string]: string} = {}
        lines.forEach((line, idx) => {
          linesMap[(idx + 1)+''] = line
        })
        let lineStr = JSON.stringify(linesMap).replaceAll('\n', '')
        lineStr = '```' + lineStr + '```'

        let prompt: string = envData.prompts?.[PROMPT_TYPE_TRANSLATE]??PROMPT_DEFAULTS[PROMPT_TYPE_TRANSLATE]
        // replace params
        prompt = prompt.replaceAll('{{language}}', language.name)
        prompt = prompt.replaceAll('{{title}}', title??'')
        prompt = prompt.replaceAll('{{subtitles}}', lineStr)

        const taskDef: TaskDef = {
          type: 'chatComplete',
          serverUrl: envData.serverUrl,
          data: {
            model: getModel(envData),
            messages: [
              {
                role: 'user',
                content: prompt,
              }
            ],
            temperature: 0.25,
            n: 1,
            stream: false,
          },
          extra: {
            type: 'translate',
            apiKey: envData.apiKey,
            startIdx,
            size: lines.length,
          }
        }
        console.debug('addTask', taskDef)
        dispatch(setLastTransTime(Date.now()))
        // addTransResults
        const result: { [key: number]: TransResult } = {}
        lines.forEach((line, idx) => {
          result[startIdx + idx] = {
            // idx: startIdx + idx,
          }
        })
        dispatch(addTransResults(result))
        const task = await sendExtension(null, 'ADD_TASK', {taskDef})
        dispatch(addTaskId(task.id))
      }
    }
  }, [data?.body, envData, language.name, title, dispatch, sendExtension])

  const addSummarizeTask = useCallback(async (type: SummaryType, segment: Segment) => {
    // review action
    if (reviewed === undefined && !reviewAction) {
      dispatch(setReviewAction(true))
      dispatch(setTempData({
        reviewActions: (reviewActions ?? 0) + 1
      }))
    }

    if (segment.text.length >= SUMMARIZE_THRESHOLD) {
      let subtitles = ''
      for (const item of segment.items) {
        subtitles += formatTime(item.from) + ' ' + item.content + '\n'
      }
      // @ts-expect-error
      const promptType: keyof typeof PROMPT_DEFAULTS = SUMMARIZE_TYPES[type].promptType
      let prompt: string = envData.prompts?.[promptType]??PROMPT_DEFAULTS[promptType]
      // replace params
      prompt = prompt.replaceAll('{{language}}', summarizeLanguage.name)
      prompt = prompt.replaceAll('{{title}}', title??'')
      prompt = prompt.replaceAll('{{subtitles}}', subtitles)
      prompt = prompt.replaceAll('{{segment}}', segment.text)

      const taskDef: TaskDef = {
        type: 'chatComplete',
        serverUrl: envData.serverUrl,
        data: {
          model: getModel(envData),
          messages: [
            {
              role: 'user',
              content: prompt,
            }
          ],
          temperature: 0.5,
          n: 1,
          stream: false,
        },
        extra: {
          type: 'summarize',
          summaryType: type,
          startIdx: segment.startIdx,
          apiKey: envData.apiKey,
        }
      }
      console.debug('addSummarizeTask', taskDef)
      dispatch(setSummaryStatus({segmentStartIdx: segment.startIdx, type, status: 'pending'}))
      dispatch(setLastSummarizeTime(Date.now()))
      const task = await sendExtension(null, 'ADD_TASK', {taskDef})
      dispatch(addTaskId(task.id))
    }
  }, [dispatch, envData, reviewAction, reviewActions, reviewed, sendExtension, summarizeLanguage.name, title])

  const addAskTask = useCallback(async (id: string, segment: Segment, question: string) => {
    if (segment.text.length >= SUMMARIZE_THRESHOLD) {
      let prompt: string = envData.prompts?.[PROMPT_TYPE_ASK]??PROMPT_DEFAULTS[PROMPT_TYPE_ASK]
      // replace params
      prompt = prompt.replaceAll('{{language}}', summarizeLanguage.name)
      prompt = prompt.replaceAll('{{title}}', title??'')
      prompt = prompt.replaceAll('{{segment}}', segment.text)
      prompt = prompt.replaceAll('{{question}}', question)

      const taskDef: TaskDef = {
        type: 'chatComplete',
        serverUrl: envData.serverUrl,
        data: {
          model: getModel(envData),
          messages: [
            {
              role: 'user',
              content: prompt,
            }
          ],
          temperature: 0.5,
          n: 1,
          stream: false,
        },
        extra: {
          type: 'ask',
          // startIdx: segment.startIdx,
          apiKey: envData.apiKey,
          askId: id,
        }
      }
      console.debug('addAskTask', taskDef)
      dispatch(mergeAskInfo({
        id,
        status: 'pending'
      }))
      const task = await sendExtension(null, 'ADD_TASK', {taskDef})
      dispatch(addTaskId(task.id))
    }
  }, [dispatch, envData, sendExtension, summarizeLanguage.name, title])

  const handleTranslate = useMemoizedFn((task: Task, content: string) => {
    let map: {[key: string]: string} = {}
    try {
      content = extractJsonObject(content)
      map = JSON.parse(content)
    } catch (e) {
      console.debug(e)
    }
    const {startIdx, size} = task.def.extra
    if (startIdx != null) {
      const result: { [key: number]: TransResult } = {}
      for (let i = 0; i < size; i++) {
        const item = map[(i + 1)+'']
        if (item) {
          result[startIdx + i] = {
            // idx: startIdx + i,
            code: '200',
            data: item,
          }
        } else {
          result[startIdx + i] = {
            // idx: startIdx + i,
            code: '500',
          }
        }
      }
      dispatch(addTransResults(result))
      console.debug('addTransResults', map, size)
    }
  })

  const handleSummarize = useMemoizedFn((task: Task, content?: string) => {
    const summaryType = task.def.extra.summaryType
    content = summaryType === 'brief'?extractJsonObject(content??''):extractJsonArray(content??'')
    let obj
    try {
      obj = JSON.parse(content)
    } catch (e) {
      task.error = 'failed'
    }

    dispatch(setSummaryContent({
      segmentStartIdx: task.def.extra.startIdx,
      type: summaryType,
      content: obj,
    }))
    dispatch(setSummaryStatus({segmentStartIdx: task.def.extra.startIdx, type: summaryType, status: 'done'}))
    dispatch(setSummaryError({segmentStartIdx: task.def.extra.startIdx, type: summaryType, error: task.error}))
    console.debug('setSummary', task.def.extra.startIdx, summaryType, obj, task.error)
  })

  const handleAsk = useMemoizedFn((task: Task, content?: string) => {
    dispatch(mergeAskInfo({
      id: task.def.extra.askId,
      content,
      status: 'done',
      error: task.error,
    }))

    console.debug('setAsk', content, task.error)
  })

  const getTask = useCallback(async (taskId: string) => {
    const taskResp = await sendExtension(null, 'GET_TASK', {taskId})
    if (taskResp.code === 'ok') {
      console.debug('getTask', taskResp.task)
      const task: Task = taskResp.task
      const taskType: string | undefined = task.def.extra?.type
      const content = task.resp?.choices?.[0]?.message?.content?.trim()
      if (task.status === 'done') {
        // 异常提示
        if (task.error) {
          toast.error(task.error)
        }
        // 删除任务
        dispatch(delTaskId(taskId))
        // 处理结果
        if (taskType === 'translate') { // 翻译
          handleTranslate(task, content)
        } else if (taskType === 'summarize') { // 总结
          handleSummarize(task, content)
        } else if (taskType === 'ask') { // 总结
          handleAsk(task, content)
        }
      }
    } else {
      dispatch(delTaskId(taskId))
    }
  }, [dispatch, handleAsk, handleSummarize, handleTranslate, sendExtension])

  return {getFetch, getTask, addTask, addSummarizeTask, addAskTask}
}

export default useTranslate
