import { setAuthor, setChapters, setCtime, setCurFetched, setCurInfo, setData, setInfos, setTitle, setUrl } from '@/redux/envReducer'
import { useAppDispatch, useAppSelector } from './redux'
import { AllAPPMessages, AllExtensionMessages, AllInjectMessages } from '@/message-typings'
import { useMessaging, useMessagingService } from '@kky002/kky-message'
import { useMemoizedFn } from 'ahooks'

const useMessageService = () => {
  const dispatch = useAppDispatch()
  const envData = useAppSelector((state) => state.env.envData)

  // methods
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
      dispatch(setChapters(params.chapters))
      dispatch(setInfos(params.infos))
      dispatch(setUrl(params.url))
      dispatch(setTitle(params.title))
      dispatch(setCtime(params.ctime))
      dispatch(setAuthor(params.author))
      console.debug('video title: ', params.title)
    },
  }))

  useMessagingService(!!envData.sidePanel, methodsFunc)
}

export default useMessageService
export const useMessage = useMessaging<AllExtensionMessages, AllInjectMessages>
