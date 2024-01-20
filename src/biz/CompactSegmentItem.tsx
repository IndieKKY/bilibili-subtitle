import React, {useMemo} from 'react'
import {useAppSelector} from '../hooks/redux'
import {getDisplay, getTransText} from '../util/biz_util'
import classNames from 'classnames'

const CompactSegmentItem = (props: {
  item: TranscriptItem
  idx: number
  isIn: boolean
  last: boolean
  moveCallback: (event: any) => void
}) => {
  const {item, idx, last, isIn, moveCallback} = props
  const transResult = useAppSelector(state => state.env.transResults[idx])
  const envData = useAppSelector(state => state.env.envData)
  const fontSize = useAppSelector(state => state.env.envData.fontSize)
  const autoTranslate = useAppSelector(state => state.env.autoTranslate)
  const transText = useMemo(() => getTransText(transResult, envData.hideOnDisableAutoTranslate, autoTranslate), [autoTranslate, envData.hideOnDisableAutoTranslate, transResult])
  const display = useMemo(() => getDisplay(envData.transDisplay, item.content, transText), [envData.transDisplay, item.content, transText])

  return <div className={classNames('inline', fontSize === 'large'?'text-sm':'text-xs')}>
    <span className={'pl-1 pr-0.5 py-0.5 cursor-pointer rounded-sm hover:bg-base-200'} onClick={moveCallback}>
      <text className={classNames('font-medium', isIn ? 'text-primary underline' : '')}>{display.main}</text>
      {display.sub && <text className='desc'>({display.sub})</text>}</span>
    <span className='text-base-content/75'>{!last && ','}</span>
  </div>
}

export default CompactSegmentItem
