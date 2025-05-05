import {DEFAULT_SERVER_URL_OPENAI} from '../consts/const'

const getServerUrl = (serverUrl?: string) => {
  if (!serverUrl) {
    return DEFAULT_SERVER_URL_OPENAI
  }
  if (serverUrl.endsWith('/')) {
    serverUrl = serverUrl.slice(0, -1)
  }
  //如果serverUrl不以/vxxx结尾，则添加/v1
  if (!/\/v\d+$/.test(serverUrl.toLowerCase())) {
    serverUrl += '/v1'
  }
  return serverUrl
}

export const handleChatCompleteTask = async (task: Task) => {
  const data = task.def.data
  const serverUrl = getServerUrl(task.def.serverUrl)
  const resp = await fetch(`${serverUrl}/chat/completions`, {
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

  console.log("sending data to gemini ", data);

  const resp = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent', {
  // const resp = await fetch('https://ve.pp.ua:54/mock/gemini/resp.json', { // fuyc test data
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': task.def.extra.geminiApiKey,
    },
    // mode: 'no-cors', // fuyc. not work for real calling
    body: JSON.stringify(data),
  })

  task.resp = await resp.json()

  console.log("got gemini resp ", resp);
}
