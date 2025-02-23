import { setAuthor, setCtime, setCurFetched, setCurInfo, setData, setInfos, setTitle, setUrl } from '@/redux/envReducer'
import { useAppDispatch } from './redux'
import { AllAPPMessages, AllExtensionMessages, AllInjectMessages } from '@/message-typings'
import { DEFAULT_USE_PORT } from '@/consts/const'
import { useMessaging, useMessagingService } from '@kky002/kky-message'
import { useMemoizedFn } from 'ahooks'

const useMessageService = () => {
  const dispatch = useAppDispatch()
  
  //methods
  const methodsFunc: () => {
    [K in AllAPPMessages['method']]: (params: Extract<AllAPPMessages, { method: K }>['params'], context: MethodContext) => Promise<any>
  } = useMemoizedFn(() => ({
    SET_INFOS: async (params, context: MethodContext) => {
      dispatch(setInfos(params.infos))
      dispatch(setCurInfo(undefined))
      dispatch(setCurFetched(false))
      dispatch(setData(undefined))
    },
    SET_VIDEO_INFO: async (params, context: MethodContext) => {
      dispatch(setInfos(params.infos))
      dispatch(setUrl(params.url))
      dispatch(setTitle(params.title))
      dispatch(setCtime(params.ctime))
      dispatch(setAuthor(params.author))
      console.debug('video title: ', params.title)
    },
  }))

  useMessagingService(DEFAULT_USE_PORT, methodsFunc)
}

export default useMessageService
export const useMessage = useMessaging<AllExtensionMessages, AllInjectMessages>