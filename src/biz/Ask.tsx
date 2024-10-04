import {AiOutlineCloseCircle, BsDashSquare, BsPlusSquare, FaQuestion} from 'react-icons/all'
import classNames from 'classnames'
import Markdown from '../components/Markdown'
import React, {useCallback} from 'react'
import {delAskInfo, mergeAskInfo, setTempData} from '../redux/envReducer'
import {useAppDispatch, useAppSelector} from '../hooks/redux'
import toast from 'react-hot-toast'
import useTranslate from '../hooks/useTranslate'

const Ask = (props: {
  ask: AskInfo
}) => {
  const {ask} = props
  const dispatch = useAppDispatch()
  const envData = useAppSelector(state => state.env.envData)
  const fontSize = useAppSelector(state => state.env.envData.fontSize)
  const segments = useAppSelector(state => state.env.segments)
  const {addAskTask} = useTranslate()

  const onRegenerate = useCallback(() => {
    const apiKey = envData.aiType === 'gemini'?envData.geminiApiKey:envData.apiKey
    if (apiKey) {
      if (segments != null && segments.length > 0) {
        addAskTask(ask.id, segments[0], ask.question).catch(console.error)
      }
    } else {
      toast.error('请先在选项页面设置ApiKey!')
    }
  }, [addAskTask, ask.id, ask.question, envData.aiType, envData.apiKey, envData.geminiApiKey, segments])

  const onAskFold = useCallback(() => {
    dispatch(mergeAskInfo({
      id: ask.id,
      fold: !ask.fold
    }))
  }, [ask, dispatch])

  const onClose = useCallback(() => {
    dispatch(delAskInfo(ask.id))
  }, [ask, dispatch])

  return <div className='shadow bg-base-200 my-0.5 mx-1.5 p-1.5 rounded flex flex-col justify-center items-center'>
    <div className='w-full relative flex justify-center min-h-[20px]'>
      <div className='absolute left-0 top-0 bottom-0 text-xs select-none flex-center desc'>
        {ask.fold
          ? <BsPlusSquare className='cursor-pointer' onClick={onAskFold}/> :
          <BsDashSquare className='cursor-pointer' onClick={onAskFold}/>}
      </div>
      <button className='absolute right-0 top-0 bottom-0 btn btn-ghost btn-xs btn-circle text-base-content/75' onClick={onClose}>
        <AiOutlineCloseCircle/>
      </button>
      <div className="tabs">
        <a className="tab tab-lifted tab-xs tab-disabled cursor-default"></a>
        <a className='tab tab-lifted tab-xs tab-active'><FaQuestion/>提问</a>
        <a className="tab tab-lifted tab-xs tab-disabled cursor-default"></a>
      </div>
    </div>
    {!ask.fold && ask.question && <div className='text-sm font-medium max-w-[90%]'>{ask.question}</div>}
    {!ask.fold && ask.content &&
      <div className={classNames('font-medium max-w-[90%] mt-1', fontSize === 'large' ? 'text-sm' : 'text-xs')}>
        <Markdown content={ask.content}/>
      </div>}
    {!ask.fold && <button disabled={ask.status !== 'done'}
                         className={classNames('btn btn-link btn-xs', ask.status === 'pending' && 'loading')}
                         onClick={onRegenerate}>{ask.status === 'pending' ? '生成中' : '重新生成'}</button>}
    {!ask.fold && ask.error && <div className='text-xs text-error'>{ask.error}</div>}
  </div>
}

export default Ask
