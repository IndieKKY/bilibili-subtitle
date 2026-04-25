import {
  DEFAULT_SERVER_URL_OPENAI,
  DEFAULT_OLLAMA_URL,
  AI_BACKENDS
} from '../consts/const'

export const getServerUrl = (backend: AIBackendType, serverUrl?: string, model?: string): string => {
  if (!serverUrl) {
    if (backend === 'ollama') {
      return DEFAULT_OLLAMA_URL
    }
    return DEFAULT_SERVER_URL_OPENAI
  }

  if (serverUrl.endsWith('/')) {
    serverUrl = serverUrl.slice(0, -1)
  }

  if (backend === 'ollama') {
    return serverUrl
  }

  if (serverUrl.toLowerCase().startsWith('https://generativelanguage.googleapis.com')) {
    return serverUrl
  }

  if (!/\/v\d+$/.test(serverUrl.toLowerCase())) {
    serverUrl += '/v1'
  }

  return serverUrl
}

export const getModel = (envData: EnvData): string => {
  if (envData.model === 'custom' && envData.customModel) {
    return envData.customModel
  }
  return envData.model ?? 'gpt-4o-mini'
}

export const extractJsonObject = (content: string): string => {
  if (!content) return '{}'

  content = content.trim()

  const jsonBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (jsonBlockMatch) {
    content = jsonBlockMatch[1].trim()
  }

  const firstBrace = content.indexOf('{')
  const lastBrace = content.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    content = content.substring(firstBrace, lastBrace + 1)
  }

  return content
}

export const extractJsonArray = (content: string): string => {
  if (!content) return '[]'

  content = content.trim()

  const jsonBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (jsonBlockMatch) {
    content = jsonBlockMatch[1].trim()
  }

  const firstBracket = content.indexOf('[')
  const lastBracket = content.lastIndexOf(']')
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    content = content.substring(firstBracket, lastBracket + 1)
  }

  return content
}

export const safeJsonParse = <T = any>(content: string, defaultValue: T): T => {
  try {
    return JSON.parse(content) as T
  } catch (e) {
    console.warn('JSON parse failed, using default value:', e)
    return defaultValue
  }
}

export const handleChatCompleteTask = async (task: Task): Promise<boolean> => {
  const data = task.def.data
  const backend = (task.def.extra?.backend as AIBackendType) || 'openai'
  const serverUrl = getServerUrl(backend, task.def.serverUrl, data.model)

  let url: string
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  let body: any

  if (backend === 'ollama') {
    url = `${serverUrl}/api/chat`
    body = {
      model: data.model,
      messages: data.messages,
      stream: false,
      options: {
        temperature: data.temperature ?? 0.5,
      },
    }
  } else {
    url = `${serverUrl}/chat/completions`
    if (task.def.extra?.apiKey) {
      headers['Authorization'] = 'Bearer ' + task.def.extra.apiKey
    }
    body = data
  }

  console.debug('[AIService] Request:', { url, backend, model: data.model })

  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  task.resp = await resp.json()

  if (backend === 'ollama') {
    if (task.resp.message?.content) {
      if (!task.resp.choices) {
        task.resp.choices = [{
          message: {
            content: task.resp.message.content
          }
        }]
      }
      task.resp.usage = task.resp.usage || { total_tokens: 0 }
    } else if (task.resp.error) {
      throw new Error(`${task.resp.error.code ?? ''} ${task.resp.error.message ?? ''}`)
    }
  }

  if (task.resp.usage) {
    return (task.resp.usage.total_tokens ?? 0) > 0
  } else if (task.resp.choices?.[0]?.message?.content) {
    return true
  } else {
    throw new Error(`${task.resp.error?.code ?? ''} ${task.resp.error?.message ?? ''}`)
  }
}

export const validateAIConfig = (envData: EnvData): { valid: boolean; message?: string } => {
  if (!envData.apiKey && envData.backend !== 'ollama') {
    return { valid: false, message: '请设置 API Key' }
  }

  if (envData.backend === 'ollama' && !envData.serverUrl) {
    return { valid: false, message: '请设置 Ollama 服务器地址' }
  }

  if (!envData.model) {
    return { valid: false, message: '请选择模型' }
  }

  if (envData.model === 'custom' && !envData.customModel) {
    return { valid: false, message: '请输入自定义模型名称' }
  }

  return { valid: true }
}

export { AI_BACKENDS }
