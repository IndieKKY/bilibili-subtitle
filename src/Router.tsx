import App from './App'
import {useEventEmitter} from 'ahooks'
import React, { useEffect } from 'react'
import { useAppDispatch } from './hooks/redux'
import { setPath } from './redux/envReducer'

export const EventBusContext = React.createContext<any>(null)

const map: { [key: string]: string } = {
  '/options.html': 'options',
  '/sidepanel.html': 'app',
  // '/close': 'close',
}

const Router = () => {
  const path = map[window.location.pathname] ?? 'app'
  const dispatch = useAppDispatch()

  if (path === 'close') {
    window.close()
  }

  // 事件总线
  const eventBus = useEventEmitter()

  useEffect(() => {
    dispatch(setPath(path as 'app' | 'options'))
  }, [dispatch, path])

  return <EventBusContext.Provider value={eventBus}>
    {(path === 'app' || path === 'options') && <App/>}
  </EventBusContext.Provider>
}

export default Router
