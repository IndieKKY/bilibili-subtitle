import App from './App'
import {useEventEmitter} from 'ahooks'
import React from 'react'

export const EventBusContext = React.createContext<any>(null)

const map: { [key: string]: string } = {
  // '/close': 'close',
}

const Router = () => {
  const path = map[window.location.pathname] ?? 'app'

  if (path === 'close') {
    window.close()
  }

  // 事件总线
  const eventBus = useEventEmitter()

  return <EventBusContext.Provider value={eventBus}>
    {path === 'app' && <App/>}
  </EventBusContext.Provider>
}

export default Router
