import {useAppDispatch} from './redux'
import React, {useCallback} from 'react'
import {setNeedScroll} from '../redux/envReducer'

const useSubtitle = () => {
  const dispatch = useAppDispatch()

  const move = useCallback((time: number, togglePause: boolean) => {
    window.parent.postMessage({type: 'move', time, togglePause}, '*')
  }, [])

  const scrollIntoView = useCallback((ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({behavior: 'smooth', block: 'center'})
    dispatch(setNeedScroll(false))
  }, [dispatch])

  return {move, scrollIntoView}
}

export default useSubtitle
