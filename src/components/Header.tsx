import {IoIosArrowUp} from 'react-icons/all'
import {useCallback} from 'react'
import {useAppDispatch, useAppSelector} from '../hooks/redux'
import {find, remove} from 'lodash-es'
import {setCurFetched, setCurInfo, setData, setInfos, setUploadedTranscript} from '../redux/envReducer'
import MoreBtn from './MoreBtn'
import classNames from 'classnames'
import {parseTranscript} from '../utils/biz_util'

const Header = (props: {
  foldCallback: () => void
}) => {
  const {foldCallback} = props
  const dispatch = useAppDispatch()
  const infos = useAppSelector(state => state.env.infos)
  const curInfo = useAppSelector(state => state.env.curInfo)
  const fold = useAppSelector(state => state.env.fold)
  const uploadedTranscript = useAppSelector(state => state.env.uploadedTranscript)

  const upload = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.vtt,.srt'
    input.onchange = (e: any) => {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result
        if (text) {
          const infos_ = [...(infos??[])]
          // const blob = new Blob([text], {type: 'text/plain'})
          // const url = URL.createObjectURL(blob)
          // remove old if exist
          remove(infos_, {id: 'uploaded'})
          // add new
          const tarInfo = {id: 'uploaded', subtitle_url: 'uploaded', lan_doc: '上传的字幕'}
          infos_.push(tarInfo)
          // set
          const transcript = parseTranscript(file.name, text)
          dispatch(setInfos(infos_))
          dispatch(setCurInfo(tarInfo))
          dispatch(setCurFetched(true))
          dispatch(setUploadedTranscript(transcript))
          dispatch(setData(transcript))
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [dispatch, infos])

  const selectCallback = useCallback((e: any) => {
    if (e.target.value === 'upload') {
      upload()
      return
    }

    const tarInfo = find(infos, {subtitle_url: e.target.value})
    if (curInfo?.id !== tarInfo?.id) {
      dispatch(setCurInfo(tarInfo))
      if (tarInfo && tarInfo.subtitle_url === 'uploaded') {
        dispatch(setCurFetched(true))
        dispatch(setData(uploadedTranscript))
      } else {
        dispatch(setCurFetched(false))
      }
    }
  }, [curInfo?.id, dispatch, infos, upload, uploadedTranscript])

  const preventCallback = useCallback((e: any) => {
    e.stopPropagation()
  }, [])

  const onUpload = useCallback((e: any) => {
    e.stopPropagation()
    upload()
  }, [upload])

  return <div className='rounded-[6px] bg-[#f1f2f3] dark:bg-base-100 h-[44px] flex justify-between items-center cursor-pointer' onClick={foldCallback}>
    <div className='shrink-0 flex items-center'>
      <span className='shrink-0 text-[15px] font-medium pl-[16px] pr-[14px]'>字幕列表</span>
      <MoreBtn placement={'right-start'}/>
    </div>
    <div className='flex gap-0.5 items-center mr-[16px]'>
      {(infos == null) || infos.length <= 0
        ?<div className='text-xs desc'>
          <button className='btn btn-xs btn-link' onClick={onUpload}>上传(vtt/srt)</button>
          (未找到字幕)
      </div>
        :<select disabled={!infos || infos.length <= 0} className='select select-ghost select-xs line-clamp-1' value={curInfo?.subtitle_url} onChange={selectCallback} onClick={preventCallback}>
          {infos?.map((item: any) => <option key={item.id} value={item.subtitle_url}>{item.lan_doc}</option>)}
          <option key='upload' value='upload'>上传(vtt/srt)</option>
        </select>}
      <IoIosArrowUp className={classNames('shrink-0 desc transform ease-in duration-300', fold?'rotate-180':'')}/>
    </div>
  </div>
}

export default Header
