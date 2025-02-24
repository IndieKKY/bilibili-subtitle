import React from 'react'
import { useAppSelector } from '../hooks/redux'
import { openOptionsPage } from '../utils/chromeUtils'

const ApiKeyReminder: React.FC = () => {
  const apiKey = useAppSelector(state => state.env.envData.apiKey)
  const geminiApiKey = useAppSelector(state => state.env.envData.geminiApiKey)
  const aiType = useAppSelector(state => state.env.envData.aiType)

  if ((aiType === 'gemini' && geminiApiKey) || (aiType !== 'gemini' && apiKey)) {
    return null
  }

  return (
    <div className="flex items-center justify-between p-2 bg-yellow-100 text-yellow-800 text-sm rounded-md">
      <span>请先设置API密钥以使用总结及翻译功能</span>
      <button
        className="px-2 py-1 bg-yellow-200 hover:bg-yellow-300 rounded text-xs font-medium transition-colors"
        onClick={openOptionsPage}
      >
        设置 →
      </button>
    </div>
  )
}

export default ApiKeyReminder
