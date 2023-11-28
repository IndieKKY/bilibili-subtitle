import React, {useMemo} from 'react'
import {formatTime} from '../util/util'
import {useAppSelector} from '../hooks/redux'
import {getDisplay, getTransText} from '../util/biz_util'
import classNames from 'classnames'

const NormalSegmentItem = (props: {
  item: TranscriptItem
  idx: number
  isIn: boolean
  moveCallback: (event: any) => void
}) => {
  const {item, idx, isIn, moveCallback} = props
  const transResult = useAppSelector(state => state.env.transResults[idx])
  const envData = useAppSelector(state => state.env.envData)
  const fontSize = useAppSelector(state => state.env.envData.fontSize)
  const autoTranslate = useAppSelector(state => state.env.autoTranslate)
  const transText = useMemo(() => getTransText(transResult, envData.hideOnDisableAutoTranslate, autoTranslate), [autoTranslate, envData.hideOnDisableAutoTranslate, transResult])
  const display = useMemo(() => getDisplay(envData.transDisplay, item.content, transText), [envData.transDisplay, item.content, transText])

  return <div className={classNames('flex py-0.5 cursor-pointer rounded-sm hover:bg-base-200', fontSize === 'large'?'text-sm':'text-xs')}
              onClick={moveCallback}>
    <div className='desc w-[66px] flex justify-center'>{formatTime(item.from)}</div>
    <div className={'flex-1'}>
      <div className={classNames('font-medium', isIn ? 'text-primary underline' : '')}>{display.main}</div>
      {display.sub && <div className='desc'>{display.sub}</div>}
    </div>
  </div>
}

export default NormalSegmentItem
