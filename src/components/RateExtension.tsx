import React, { useState } from 'react'
import { FaStar } from 'react-icons/fa'
import { IoMdClose } from 'react-icons/io'
import { setTempData } from '../redux/envReducer'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { openUrl } from '../utils/env_util'
import { isEdgeBrowser } from '../utils/util'

const RateExtension: React.FC = () => {
  const dispatch = useAppDispatch()
  const [isHovered, setIsHovered] = useState(false)
  const reviewed = useAppSelector(state => state.env.tempData.reviewed)

  const handleRateClick = () => {
    dispatch(setTempData({
      reviewed: true
    }))
    // Chrome Web Store URL for your extension
    if (isEdgeBrowser()) {
      openUrl('https://microsoftedge.microsoft.com/addons/detail/lignnlhlpiefmcjkdkmfjdckhlaiajan')
    } else {
      openUrl('https://chromewebstore.google.com/webstore/detail/bciglihaegkdhoogebcdblfhppoilclp/reviews')
    }
  }

  if (reviewed === true || reviewed === undefined) return null

  return (
    <div className="relative bg-gradient-to-r from-primary to-secondary text-primary-content m-2 p-4 rounded-lg shadow-lg text-sm transition-all duration-300 ease-in-out hover:shadow-xl">
      <button
        onClick={() => {
          dispatch(setTempData({
            reviewed: true
          }))
        }}
        className="absolute top-2 right-2 text-primary-content opacity-70 hover:opacity-100 transition-opacity"
      >
        <IoMdClose size={20} />
      </button>
      <h3 className="text-lg font-bold mb-2 animate-pulse">喜欢这个扩展吗？</h3>
      <p className="mb-3">如果觉得有用，请给我们评分！</p>
      <button
        onClick={handleRateClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="btn btn-accent btn-sm gap-2 transition-all duration-300 ease-in-out hover:scale-105"
      >
        <FaStar className={`inline-block text-yellow-300 ${isHovered ? 'animate-spin' : ''}`} />
        去评分
        <span className="transition-transform duration-300 ease-in-out transform inline-block">
          {isHovered ? '🚀' : '→'}
        </span>
      </button>
    </div>
  )
}

export default RateExtension
