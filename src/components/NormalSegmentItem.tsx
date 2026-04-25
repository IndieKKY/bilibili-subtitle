import React, {useMemo} from 'react'
import {formatTime} from '../utils/util'
import {useAppSelector} from '../hooks/redux'
import {getDisplay, getFontSizeClass, getFontSizePx, getTransText} from '../utils/bizUtil'
import {TRANS_DISPLAY_DUAL} from '../consts/const'
import classNames from 'classnames'

const NormalSegmentItem = (props: {
  item: TranscriptItem
  idx: number
  isIn: boolean
  moveCallback: (event: any) => void
  move2Callback: (event: any) => void
}) => {
  const {item, idx, isIn, moveCallback, move2Callback} = props
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

  return <div
    className={classNames('flex py-0.5 cursor-pointer rounded-sm hover:bg-base-200', fontSizeClass)}
    style={fontSizeStyle}
    onClick={moveCallback}
    onDoubleClick={move2Callback}
  >
    <div className='desc w-[66px] flex justify-center flex-shrink-0'>{formatTime(item.from)}</div>
    <div className={classNames('flex-1', isDualMode && display.sub ? 'flex flex-col gap-0.5' : '')}>
      {isDualMode && display.sub ? (
        <>
          <div className={classNames('font-medium', isIn ? 'text-primary underline' : '')}>{display.main}</div>
          <div className='desc'>{display.sub}</div>
        </>
      ) : (
        <>
          <div className={classNames('font-medium', isIn ? 'text-primary underline' : '')}>{display.main}</div>
          {display.sub && <div className='desc'>{display.sub}</div>}
        </>
      )}
    </div>
  </div>
}

export default NormalSegmentItem
