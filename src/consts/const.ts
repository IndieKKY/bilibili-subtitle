export const DEFAULT_USE_PORT = false

export const EVENT_EXPAND = 'expand'

export const APP_DOM_ID = 'bilibili-subtitle'

export const IFRAME_ID = 'bilibili-subtitle-iframe'

export const STORAGE_ENV = 'bilibili-subtitle_env'
export const STORAGE_TEMP = 'bilibili-subtitle_temp'

export const PROMPT_TYPE_TRANSLATE = 'translate'
export const PROMPT_TYPE_SUMMARIZE_OVERVIEW = 'summarize_overview'
export const PROMPT_TYPE_SUMMARIZE_KEYPOINT = 'summarize_keypoint'
export const PROMPT_TYPE_SUMMARIZE_QUESTION = 'summarize_question'
export const PROMPT_TYPE_SUMMARIZE_DEBATE = 'summarize_debate'
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
  name: '辩论',
  type: PROMPT_TYPE_SUMMARIZE_DEBATE,
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
  debate: {
    name: '辩论',
    desc: '辩论',
    downloadName: '💡辩论💡',
    promptType: PROMPT_TYPE_SUMMARIZE_DEBATE,
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
  [PROMPT_TYPE_SUMMARIZE_DEBATE]: `You are a helpful assistant skilled at generating debates based on video subtitles.

## Context

The video's title: '''{{title}}'''.
The video's subtitles:

'''
{{segment}}
'''

## Command

Please play the roles of both the affirmative and negative sides to discuss the author's viewpoint.
The conversation should consist of 10 rounds(5 sentences from the affirmative side, 5 sentences from the negative side.).
The tone should be straightforward.

Answer in language '{{language}}'.

## Output format

Provide an example to illustrate the expected output:

\`\`\`json
[
    {
        "side": "pro",
        "content": "xxx"
    },
    {
        "side": "con",
        "content": "xxx"
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
export const DEFAULT_SERVER_URL_GEMINI = 'https://generativelanguage.googleapis.com/v1beta/openai/'
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
export const MODEL_DEFAULT = MODELS[0].code
export const MODEL_MAP: {[key: string]: typeof MODELS[number]} = {}
for (const model of MODELS) {
  MODEL_MAP[model.code] = model
}

export const LANGUAGES = [{
  code: 'en',
  name: 'English',
}, {
  code: 'ja',
  name: '日本語',
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
}, {
  code: 'ko',
  name: '한국어',
}, {
  code: 'hi',
  name: 'हिन्दी',
}, {
  code: 'tr',
  name: 'Türkçe',
}, {
  code: 'nl',
  name: 'Nederlands',
}, {
  code: 'pl',
  name: 'Polski',
}, {
  code: 'sv',
  name: 'Svenska',
}, {
  code: 'vi',
  name: 'Tiếng Việt',
}, {
  code: 'th',
  name: 'ไทย',
}, {
  code: 'id',
  name: 'Bahasa Indonesia',
}, {
  code: 'el',
  name: 'Ελληνικά',
}, {
  code: 'he',
  name: 'עברית',
}]
export const LANGUAGES_MAP: {[key: string]: typeof LANGUAGES[number]} = {}
for (const language of LANGUAGES) {
  LANGUAGES_MAP[language.code] = language
}

export const AI_BACKENDS: { code: AIBackendType; name: string; desc: string }[] = [
  {
    code: 'openai',
    name: 'OpenAI 兼容',
    desc: '兼容 OpenAI API 格式的后端（包括 Claude、Gemini 等）'
  },
  {
    code: 'ollama',
    name: 'Ollama 本地',
    desc: '本地运行的 Ollama 模型'
  },
  {
    code: 'generic',
    name: '通用接口',
    desc: '通用 HTTP 接口，支持自定义配置'
  }
]

export const DEFAULT_OLLAMA_URL = 'http://localhost:11434'

export const STORAGE_BOOKMARKS = 'bilibili-subtitle_bookmarks'
export const STORAGE_BOOKMARK_SEGMENTS = 'bilibili-subtitle_bookmark_segments'
export const STORAGE_CACHED_SUBTITLES = 'bilibili-subtitle_cached_subtitles'

export const EXPORT_FORMATS: { code: ExportConfig['format']; name: string; desc: string }[] = [
  { code: 'txt', name: '纯文本', desc: '简单的文本格式' },
  { code: 'srt', name: 'SRT', desc: '标准字幕格式' },
  { code: 'vtt', name: 'WebVTT', desc: '网页字幕格式' },
  { code: 'json', name: 'JSON', desc: '结构化数据格式' },
  { code: 'csv', name: 'CSV', desc: '逗号分隔值格式' }
]

export const HIGHLIGHT_CLASS = 'bg-yellow-200 dark:bg-yellow-700'
