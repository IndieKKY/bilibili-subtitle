const getServerUrl = (serverUrl?: string) => {
  if (!serverUrl) {
    return 'https://api.openai.com'
  }
  if (serverUrl.endsWith('/')) {
    serverUrl = serverUrl.slice(0, -1)
  }
  return serverUrl
}

export const handleChatCompleteTask = async (task: Task) => {
  const data = task.def.data
  const serverUrl = getServerUrl(task.def.serverUrl)
  const resp = await fetch(`${serverUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + task.def.extra.apiKey,
    },
    body: JSON.stringify(data),
  })
  task.resp = await resp.json()
  if (task.resp.usage) {
    return (task.resp.usage.total_tokens??0) > 0
  } else {
    throw new Error(`${task.resp.error.code as string??''} ${task.resp.error.message as string ??''}`)
  }
}

export const handleGeminiChatCompleteTask = async (task: Task) => {
  const data = task.def.data
  const resp = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': task.def.extra.geminiApiKey,
    },
    body: JSON.stringify(data),
  })
  task.resp = await resp.json()
}
