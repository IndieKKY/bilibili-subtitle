import {useEffect} from 'react'
import {useMemoizedFn} from 'ahooks/es'
import {useAppSelector} from './redux'
import useSubtitle from './useSubtitle'

const useKeyService = () => {
  const curIdx = useAppSelector(state => state.env.curIdx)
  const data = useAppSelector(state => state.env.data)
  const {move} = useSubtitle()

  const onKeyDown = useMemoizedFn((e: KeyboardEvent) => {
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
