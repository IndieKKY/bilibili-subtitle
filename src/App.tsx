import React, {useCallback, useEffect, useMemo} from 'react'
import 'tippy.js/dist/tippy.css'
import {useAppDispatch, useAppSelector} from './hooks/redux'
import {setEnvData, setEnvReady, setTempData, setTempReady} from './redux/envReducer'
import {cloneDeep} from 'lodash-es'
import {STORAGE_ENV, STORAGE_TEMP} from './const'
import Settings from './biz/Settings'
import {handleJson} from '@kky002/kky-util'
import {useLocalStorage} from '@kky002/kky-hooks'
import {Toaster} from 'react-hot-toast'
import {setTheme} from './util/biz_util'
import useMessagingService from './hooks/useMessagingService'
import MainPage from './pages/MainPage'

function App() {
  const dispatch = useAppDispatch()
  const envData = useAppSelector(state => state.env.envData)
  const tempData = useAppSelector(state => state.env.tempData)
  const path = useAppSelector(state => state.env.path)

  // env数据
  const savedEnvData = useMemo(() => {
    return handleJson(cloneDeep(envData)) as EnvData
  }, [envData])
  const onLoadEnv = useCallback((data?: EnvData) => {
    if (data != null) {
      dispatch(setEnvData(data))
    }
    dispatch(setEnvReady())
  }, [dispatch])
  useLocalStorage<EnvData>('chrome_client', STORAGE_ENV, savedEnvData, onLoadEnv)

  // temp数据
  const savedTempData = useMemo(() => {
    return handleJson(cloneDeep(tempData)) as TempData
  }, [tempData])
  const onLoadTemp = useCallback((data?: TempData) => {
    if (data != null) {
      dispatch(setTempData(data))
    }
    dispatch(setTempReady())
  }, [dispatch])
  useLocalStorage<TempData>('chrome_client', STORAGE_TEMP, savedTempData, onLoadTemp)

  // theme改变时，设置主题
  useEffect(() => {
    setTheme(envData.theme)
  }, [envData.theme])

  // services
  useMessagingService()

  return <div>
    <Toaster position={path === 'app'?'bottom-center':'top-center'}/>
    {path === 'app' && <MainPage/>}
    {path === 'options' && <Settings/>}
  </div>
}

export default App
