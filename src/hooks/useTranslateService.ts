import {useAppDispatch, useAppSelector} from './redux'
import {useEffect} from 'react'
import {clearTransResults} from '../redux/envReducer'
import {useInterval, useMemoizedFn} from 'ahooks'
import useTranslate from './useTranslate'

/**
 * Service是单例，类似后端的服务概念
 */
const useTranslateService = () => {
  const dispatch = useAppDispatch()
  const autoTranslate = useAppSelector(state => state.env.autoTranslate)
  const data = useAppSelector(state => state.env.data)
  const taskIds = useAppSelector(state => state.env.taskIds)
  const curIdx = useAppSelector(state => state.env.curIdx)
  const {getFetch, addTask, getTask} = useTranslate()

  // data变化时清空翻译结果
  useEffect(() => {
    dispatch(clearTransResults())
    console.debug('清空翻译结果')
  }, [data, dispatch])

  // autoTranslate开启时立即查询
  const addTaskNow = useMemoizedFn(() => {
    addTask(curIdx??0).catch(console.error)
  })
  useEffect(() => {
    if (autoTranslate) {
      addTaskNow()
      console.debug('立即查询翻译')
    }
  }, [autoTranslate, addTaskNow])

  // 每3秒检测翻译
  useInterval(async () => {
    if (autoTranslate) {
      const fetchStartIdx = getFetch()
      if (fetchStartIdx != null) {
        await addTask(fetchStartIdx)
      }
    }
  }, 3000)

  // 每0.5秒检测获取结果
  useInterval(async () => {
    if (taskIds != null) {
      for (const taskId of taskIds) {
        await getTask(taskId)
      }
    }
  }, 500)
}

export default useTranslateService
