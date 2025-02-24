import React, {useCallback, useEffect, useMemo} from 'react'
import 'tippy.js/dist/tippy.css'
import {useAppDispatch, useAppSelector} from './hooks/redux'
import {setEnvData, setEnvReady, setTempData, setTempReady} from './redux/envReducer'
import {cloneDeep} from 'lodash-es'
import {STORAGE_ENV, STORAGE_TEMP} from './consts/const'
import OptionsPage from './pages/OptionsPage'
import {handleJson} from '@kky002/kky-util'
import {useLocalStorage} from '@kky002/kky-hooks'
import {Toaster} from 'react-hot-toast'
import useMessageService from './hooks/useMessageService'
import MainPage from './pages/MainPage'

function App() {
  const dispatch = useAppDispatch()
  const envData = useAppSelector(state => state.env.envData)
  const tempData = useAppSelector(state => state.env.tempData)
  const path = useAppSelector(state => state.env.path)
  const envReady = useAppSelector(state => state.env.envReady)
  const tempReady = useAppSelector(state => state.env.tempReady)

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

  // services
  useMessageService()

  return <div>
    <Toaster position={path === 'app'?'bottom-center':'top-center'}/>
    {path === 'app' && <MainPage/>}
    {path === 'options' && envReady && tempReady && <OptionsPage/>}
  </div>
}

export default App
