import {useEffect} from 'react'
import {useMemoizedFn} from 'ahooks/es'
import {useAppDispatch, useAppSelector} from './redux'
import useSubtitle from './useSubtitle'
import {setInputting} from '../redux/envReducer'

const useKeyService = () => {
  const dispatch = useAppDispatch()
  const inputting = useAppSelector(state => state.env.inputting)
  const curIdx = useAppSelector(state => state.env.curIdx)
  const data = useAppSelector(state => state.env.data)
  const {move} = useSubtitle()

  // 输入中
  useEffect(() => {
    const onInputtingStart = (e: CompositionEvent) => {
      dispatch(setInputting(true))
    }
    const onInputtingEnd = (e: CompositionEvent) => {
      dispatch(setInputting(false))
    }

    document.addEventListener('compositionstart', onInputtingStart)
    document.addEventListener('compositionend', onInputtingEnd)
    return () => {
      document.removeEventListener('compositionstart', onInputtingStart)
      document.removeEventListener('compositionend', onInputtingEnd)
    }
  }, [dispatch])

  const onKeyDown = useMemoizedFn((e: KeyboardEvent) => {
    // 当前在输入中（如中文输入法）
    if (inputting) {
      return
    }

    // 有按其他控制键时，不触发
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      return
    }

    let cursorInInput = false
    if (document.activeElement != null) {
      const tagName = document.activeElement.tagName
      if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
        cursorInInput = true
      }
    }
    let prevent = false

    // up arrow
    if (e.key === 'ArrowUp') {
      if (curIdx && (data != null) && !cursorInInput) {
        prevent = true
        const newCurIdx = Math.max(curIdx - 1, 0)
        move(data.body[newCurIdx].from, false)
      }
    }
    // down arrow
    if (e.key === 'ArrowDown') {
      if (curIdx !== undefined && (data != null) && !cursorInInput) {
        prevent = true
        const newCurIdx = Math.min(curIdx + 1, data.body.length - 1)
        move(data.body[newCurIdx].from, false)
      }
    }

    // 阻止默认事件
    if (prevent) {
      e.preventDefault()
      e.stopPropagation()
    }
  })

  // 检测快捷键
  useEffect(() => {
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onKeyDown])
}

export default useKeyService
