export const MESSAGE_TARGET_EXTENSION = 'BilibiliExtension'
export const MESSAGE_TARGET_INJECT = 'BilibiliInject'
export const MESSAGE_TARGET_APP = 'BilibiliAPP'

export const MESSAGE_TO_EXTENSION_ROUTE_MSG = 'routeMsg'
export const MESSAGE_TO_EXTENSION_ADD_TASK = 'addTask'
export const MESSAGE_TO_EXTENSION_GET_TASK = 'getTask'
export const MESSAGE_TO_EXTENSION_SHOW_FLAG = 'showFlag'

export const MESSAGE_TO_INJECT_TOGGLE_DISPLAY = 'toggleDisplay'
export const MESSAGE_TO_INJECT_FOLD = 'fold'
export const MESSAGE_TO_INJECT_MOVE = 'move'
export const MESSAGE_TO_INJECT_PLAY = 'play'
export const MESSAGE_TO_INJECT_DOWNLOAD_AUDIO = 'downloadAudio'
export const MESSAGE_TO_INJECT_GET_VIDEO_STATUS = 'getVideoStatus'
export const MESSAGE_TO_INJECT_GET_VIDEO_ELEMENT_INFO = 'getVideoElementInfo'
export const MESSAGE_TO_INJECT_REFRESH_VIDEO_INFO = 'refreshVideoInfo'
export const MESSAGE_TO_INJECT_UPDATETRANSRESULT = 'updateTransResult'
export const MESSAGE_TO_INJECT_HIDE_TRANS = 'hideTrans'
export const MESSAGE_TO_INJECT_GET_SUBTITLE = 'getSubtitle'

export const MESSAGE_TO_APP_SET_INFOS = 'setInfos'
export const MESSAGE_TO_APP_SET_VIDEO_INFO = 'setVideoInfo'

export const EVENT_EXPAND = 'expand'

export const APP_DOM_ID = 'bilibili-subtitle'

export const IFRAME_ID = 'bilibili-subtitle-iframe'

export const STORAGE_ENV = 'bilibili-subtitle_env'
export const STORAGE_TEMP = 'bilibili-subtitle_temp'

export const PROMPT_TYPE_TRANSLATE = 'translate'
export const PROMPT_TYPE_SUMMARIZE_OVERVIEW = 'summarize_overview'
export const PROMPT_TYPE_SUMMARIZE_KEYPOINT = 'summarize_keypoint'
export const PROMPT_TYPE_SUMMARIZE_QUESTION = 'summarize_question'
export const PROMPT_TYPE_SUMMARIZE_BRIEF = 'summarize_brief'
export const PROMPT_TYPE_ASK = 'ask'
export const PROMPT_TYPES = [{
  name: '翻译',
  type: PROMPT_TYPE_TRANSLATE,
}, {
  name: '概览',
  type: PROMPT_TYPE_SUMMARIZE_OVERVIEW,
}, {
  name: '要点',
  type: PROMPT_TYPE_SUMMARIZE_KEYPOINT,
}, {
  name: '总结',
  type: PROMPT_TYPE_SUMMARIZE_BRIEF,
}, {
  name: '问题',
  type: PROMPT_TYPE_SUMMARIZE_QUESTION,
}, {
  name: '提问',
  type: PROMPT_TYPE_ASK,
}]

export const SUMMARIZE_TYPES = {
  brief: {
    name: '总结',
    desc: '一句话总结',
    downloadName: '💡视频总结💡',
    promptType: PROMPT_TYPE_SUMMARIZE_BRIEF,
  },
  overview: {
    name: '概览',
    desc: '可定位到视频位置',
    downloadName: '💡视频概览💡',
    promptType: PROMPT_TYPE_SUMMARIZE_OVERVIEW,
  },
  keypoint: {
    name: '要点',
    desc: '完整的要点提取',
    downloadName: '💡视频要点💡',
    promptType: PROMPT_TYPE_SUMMARIZE_KEYPOINT,
  },
  question: {
    name: '问题',
    desc: '常见问题',
    downloadName: '💡常见问题💡',
    promptType: PROMPT_TYPE_SUMMARIZE_QUESTION,
  },
}

export const PROMPT_DEFAULTS = {
  [PROMPT_TYPE_TRANSLATE]: `You are a professional translator. Translate following video subtitles to language '{{language}}'.
Preserve incomplete sentence.
Translate in the same json format.
Answer in markdown json format.

video subtitles:

\`\`\`
{{subtitles}}
\`\`\``,
  [PROMPT_TYPE_SUMMARIZE_OVERVIEW]: `You are a helpful assistant that summarize key points of video subtitle.
Summarize 3 to 8 brief key points in language '{{language}}'.
Answer in markdown json format.
The emoji should be related to the key point and 1 char length.

example output format:

\`\`\`json
[
  {
    "time": "03:00",
    "emoji": "👍",
    "key": "key point 1"
  },
  {
    "time": "10:05",
    "emoji": "😊",
    "key": "key point 2"
  }
]
\`\`\`

The video's title: '''{{title}}'''.
The video's subtitles:

'''
{{subtitles}}
'''`,
  [PROMPT_TYPE_SUMMARIZE_KEYPOINT]: `You are a helpful assistant that summarize key points of video subtitle.
Summarize brief key points in language '{{language}}'.
Answer in markdown json format.

example output format:

\`\`\`json
[
  "key point 1",
  "key point 2"
]
\`\`\`

The video's title: '''{{title}}'''.
The video's subtitles:

'''
{{segment}}
'''`,
  [PROMPT_TYPE_SUMMARIZE_BRIEF]: `You are a helpful assistant that summarize video subtitle.
Summarize in language '{{language}}'.
Answer in markdown json format.

example output format:

\`\`\`json
{
  "summary": "brief summary"
}
\`\`\`

The video's title: '''{{title}}'''.
The video's subtitles:

'''
{{segment}}
'''`,
  [PROMPT_TYPE_SUMMARIZE_QUESTION]: `You are a helpful assistant that skilled at extracting questions from video subtitle.

## Context

The video's title: '''{{title}}'''.
The video's subtitles:

'''
{{segment}}
'''

## Command

Accurately extract key questions and their corresponding answers from the video subtitles based on the actual content provided. The number of questions should be between 3 and 5.

- Identify questions as sentences starting with interrogative words (e.g., "What", "How", "Why") and extract the following sentences that directly answer these questions.
- Include only those questions and answers that are relevant to the main points of the video, and ensure they cover different aspects of the video's content.
- If an answer spans multiple non-consecutive parts of the subtitles, concatenate them into a coherent response without adding any information not present in the subtitles.
- In cases where the number of potential Q&As exceeds 5, prioritize the most informative and directly answered ones.
- If clear questions and answers are not available in the subtitles, refrain from creating them and instead note the absence of direct Q&As.
- Answer in language '{{language}}'.
- Format the output in markdown json format, as specified.

## Output format

Provide an example to illustrate the expected output:

\`\`\`json
[
    {
        "q": "What is the main theme of the video?",
        "a": "The main theme of the video is explained as..."
    },
    {
        "q": "How is the topic developed?",
        "a": "The topic is developed through various examples, including..."
    }
]
\`\`\`
`,
  [PROMPT_TYPE_ASK]: `You are a helpful assistant who answers question related to video subtitles.
Answer in language '{{language}}'.

The video's title: '''{{title}}'''.
The video's subtitles:

'''
{{segment}}
'''

Question: '''{{question}}'''
Answer:
`,
}

export const TASK_EXPIRE_TIME = 15*60*1000

export const PAGE_MAIN = 'main'
export const PAGE_SETTINGS = 'settings'

export const TRANSLATE_COOLDOWN = 5*1000
export const TRANSLATE_FETCH_DEFAULT = 15
export const TRANSLATE_FETCH_MIN = 5
export const TRANSLATE_FETCH_MAX = 25
export const TRANSLATE_FETCH_STEP = 5
export const LANGUAGE_DEFAULT = 'en'

export const TOTAL_HEIGHT_MIN = 400
export const TOTAL_HEIGHT_DEF = 520
export const TOTAL_HEIGHT_MAX = 800
export const HEADER_HEIGHT = 44
export const TITLE_HEIGHT = 24
export const SEARCH_BAR_HEIGHT = 32
export const RECOMMEND_HEIGHT = 36

export const WORDS_RATE = 0.75
export const WORDS_MIN = 500
export const WORDS_MAX = 16000
export const WORDS_STEP = 500
export const SUMMARIZE_THRESHOLD = 100
export const SUMMARIZE_LANGUAGE_DEFAULT = 'cn'
export const SUMMARIZE_ALL_THRESHOLD = 5
export const ASK_ENABLED_DEFAULT = true
export const DEFAULT_SERVER_URL_OPENAI = 'https://api.openai.com'
export const CUSTOM_MODEL_TOKENS = 16385

export const MODEL_TIP = '推荐gpt-4o-mini，能力强，价格低，token上限大'
export const MODELS = [{
  code: 'gpt-4o-mini',
  name: 'gpt-4o-mini',
  tokens: 128000,
}, {
  code: 'gpt-3.5-turbo-0125',
  name: 'gpt-3.5-turbo-0125',
  tokens: 16385,
}, {
  code: 'custom',
  name: '自定义',
}]
export const GEMINI_TOKENS = 32768
export const MODEL_DEFAULT = MODELS[0].code
export const MODEL_MAP: {[key: string]: typeof MODELS[number]} = {}
for (const model of MODELS) {
  MODEL_MAP[model.code] = model
}

export const LANGUAGES = [{
  code: 'en',
  name: 'English',
}, {
  code: 'ena',
  name: 'American English',
}, {
  code: 'enb',
  name: 'British English',
}, {
  code: 'cn',
  name: '中文简体',
}, {
  code: 'cnt',
  name: '中文繁体',
}, {
  code: 'Spanish',
  name: 'español',
}, {
  code: 'French',
  name: 'Français',
}, {
  code: 'Arabic',
  name: 'العربية',
}, {
  code: 'Russian',
  name: 'русский',
}, {
  code: 'German',
  name: 'Deutsch',
}, {
  code: 'Portuguese',
  name: 'Português',
}, {
  code: 'Italian',
  name: 'Italiano',
}]
export const LANGUAGES_MAP: {[key: string]: typeof LANGUAGES[number]} = {}
for (const language of LANGUAGES) {
  LANGUAGES_MAP[language.code] = language
}
