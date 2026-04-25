import React, {useMemo} from 'react'
import {useAppSelector} from '../hooks/redux'
import {getDisplay, getFontSizeClass, getTransText} from '../utils/bizUtil'
import {TRANS_DISPLAY_DUAL} from '../consts/const'
import classNames from 'classnames'

const CompactSegmentItem = (props: {
  item: TranscriptItem
  idx: number
  isIn: boolean
  last: boolean
  moveCallback: (event: any) => void
  move2Callback: (event: any) => void
}) => {
  const {item, idx, last, isIn, moveCallback, move2Callback} = props
  const transResult = useAppSelector(state => state.env.transResults[idx])
  const envData = useAppSelector(state => state.env.envData)
  const fontSize = useAppSelector(state => state.env.envData.fontSize)
  const customFontSize = useAppSelector(state => state.env.envData.customFontSize)
  const autoTranslate = useAppSelector(state => state.env.autoTranslate)
  const transText = useMemo(() => getTransText(transResult, envData.hideOnDisableAutoTranslate, autoTranslate), [autoTranslate, envData.hideOnDisableAutoTranslate, transResult])
  const display = useMemo(() => getDisplay(envData.transDisplay, item.content, transText), [envData.transDisplay, item.content, transText])

  const fontSizeClass = getFontSizeClass(fontSize)
  const isDualMode = envData.transDisplay === TRANS_DISPLAY_DUAL

  const fontSizeStyle = useMemo(() => {
    if (fontSize === 'custom' && customFontSize) {
      return { fontSize: `${customFontSize}px` }
    }
    return {}
  }, [fontSize, customFontSize])

  return <div className={classNames('inline', fontSizeClass)} style={fontSizeStyle}>
    <span className={'pl-1 pr-0.5 py-0.5 cursor-pointer rounded-sm hover:bg-base-200'} onClick={moveCallback} onDoubleClick={move2Callback}>
      <text className={classNames('font-medium', isIn ? 'text-primary underline' : '')}>{display.main}</text>
      {display.sub && <text className='desc'>{isDualMode ? ` | ${display.sub}` : `(${display.sub})`}</text>}
    </span>
    <span className='text-base-content/75'>{!last && ','}</span>
  </div>
}

export default CompactSegmentItem
