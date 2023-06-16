import React, {PropsWithChildren, useCallback, useMemo, useState} from 'react'
import {setEnvData, setPage} from '../redux/envReducer'
import {useAppDispatch, useAppSelector} from '../hooks/redux'
import {
  HEADER_HEIGHT,
  LANGUAGE_DEFAULT,
  LANGUAGES,
  MODEL_DEFAULT,
  MODELS,
  PAGE_MAIN,
  PROMPT_DEFAULTS,
  PROMPT_TYPES,
  SERVER_URL_THIRD,
  SUMMARIZE_LANGUAGE_DEFAULT,
  TRANSLATE_FETCH_DEFAULT,
  TRANSLATE_FETCH_MAX,
  TRANSLATE_FETCH_MIN,
  TRANSLATE_FETCH_STEP,
  WORDS_DEFAULT,
  WORDS_MAX,
  WORDS_MIN,
  WORDS_STEP
} from '../const'
import {IoWarning} from 'react-icons/all'
import classNames from 'classnames'
import toast from 'react-hot-toast'
import {useBoolean, useEventTarget} from 'ahooks'
import {useEventChecked} from '@kky002/kky-hooks'

const Section = (props: {
  title: ShowElement
  htmlFor?: string
} & PropsWithChildren) => {
  const {title, htmlFor, children} = props
  return <div className='flex flex-col gap-1'>
    <label className='font-medium desc-lighter text-xs' htmlFor={htmlFor}>{title}</label>
    <div className='flex flex-col gap-1 rounded py-2 px-2 bg-base-200/75'>{children}</div>
  </div>
}

const FormItem = (props: {
  title: ShowElement
  tip?: string
  htmlFor?: string
} & PropsWithChildren) => {
  const {title, tip, htmlFor, children} = props
  return <div className='flex items-center gap-2'>
    <div className={classNames('basis-3/12 flex-center', tip && 'tooltip tooltip-right z-[100] underline underline-offset-2 decoration-dashed')} data-tip={tip}>
      <label className='font-medium desc' htmlFor={htmlFor}>{title}</label>
    </div>
    <div className='basis-9/12 flex items-center'>
      {children}
    </div>
  </div>
}

const Settings = () => {
  const dispatch = useAppDispatch()
  const envData = useAppSelector(state => state.env.envData)
  const {value: autoExpandValue, onChange: setAutoExpandValue} = useEventChecked(envData.autoExpand)
  // const {value: autoScrollValue, onChange: setAutoScrollValue} = useEventChecked(envData.autoScroll)
  const {value: translateEnableValue, onChange: setTranslateEnableValue} = useEventChecked(envData.translateEnable)
  const {value: summarizeEnableValue, onChange: setSummarizeEnableValue} = useEventChecked(envData.summarizeEnable)
  const {value: summarizeFloatValue, onChange: setSummarizeFloatValue} = useEventChecked(envData.summarizeFloat)
  const [apiKeyValue, { onChange: onChangeApiKeyValue }] = useEventTarget({initialValue: envData.apiKey??''})
  const [serverUrlValue, setServerUrlValue] = useState(envData.serverUrl)
  const [languageValue, { onChange: onChangeLanguageValue }] = useEventTarget({initialValue: envData.language??LANGUAGE_DEFAULT})
  const [modelValue, { onChange: onChangeModelValue }] = useEventTarget({initialValue: envData.model??MODEL_DEFAULT})
  const [summarizeLanguageValue, { onChange: onChangeSummarizeLanguageValue }] = useEventTarget({initialValue: envData.summarizeLanguage??SUMMARIZE_LANGUAGE_DEFAULT})
  const [hideOnDisableAutoTranslateValue, setHideOnDisableAutoTranslateValue] = useState(envData.hideOnDisableAutoTranslate)
  const [themeValue, setThemeValue] = useState(envData.theme)
  const [fontSizeValue, setFontSizeValue] = useState(envData.fontSize)
  const [transDisplayValue, setTransDisplayValue] = useState(envData.transDisplay)
  const [wordsValue, setWordsValue] = useState<number | undefined>(envData.words??WORDS_DEFAULT)
  const [fetchAmountValue, setFetchAmountValue] = useState(envData.fetchAmount??TRANSLATE_FETCH_DEFAULT)
  const [moreFold, {toggle: toggleMoreFold}] = useBoolean(true)
  const [promptsFold, {toggle: togglePromptsFold}] = useBoolean(true)
  const fold = useAppSelector(state => state.env.fold)
  const totalHeight = useAppSelector(state => state.env.totalHeight)
  const [promptsValue, setPromptsValue] = useState<{[key: string]: string}>(envData.prompts??{})
  const wordsList = useMemo(() => {
    const list = []
    for (let i = WORDS_MIN; i <= WORDS_MAX; i += WORDS_STEP) {
      list.push(i)
    }
    return list
  }, [])
  const transFetchAmountList = useMemo(() => {
    const list = []
    for (let i = TRANSLATE_FETCH_MIN; i <= TRANSLATE_FETCH_MAX; i += TRANSLATE_FETCH_STEP) {
      list.push(i)
    }
    return list
  }, [])

  const onChangeHideOnDisableAutoTranslate = useCallback((e: any) => {
    setHideOnDisableAutoTranslateValue(e.target.checked)
  }, [])

  const onSave = useCallback(() => {
    dispatch(setEnvData({
      autoExpand: autoExpandValue,
      apiKey: apiKeyValue,
      serverUrl: serverUrlValue,
      model: modelValue,
      translateEnable: translateEnableValue,
      language: languageValue,
      hideOnDisableAutoTranslate: hideOnDisableAutoTranslateValue,
      theme: themeValue,
      transDisplay: transDisplayValue,
      summarizeEnable: summarizeEnableValue,
      summarizeFloat: summarizeFloatValue,
      summarizeLanguage: summarizeLanguageValue,
      words: wordsValue,
      fetchAmount: fetchAmountValue,
      fontSize: fontSizeValue,
      prompts: promptsValue,
    }))
    dispatch(setPage(PAGE_MAIN))
    toast.success('保存成功')
  }, [modelValue, promptsValue, fontSizeValue, apiKeyValue, autoExpandValue, dispatch, fetchAmountValue, hideOnDisableAutoTranslateValue, languageValue, serverUrlValue, summarizeEnableValue, summarizeFloatValue, summarizeLanguageValue, themeValue, transDisplayValue, translateEnableValue, wordsValue])

  const onCancel = useCallback(() => {
    dispatch(setPage(PAGE_MAIN))
  }, [dispatch])

  const onFetchAmountChange = useCallback((e: any) => {
    setFetchAmountValue(parseInt(e.target.value))
  }, [])

  const onWordsChange = useCallback((e: any) => {
    setWordsValue(parseInt(e.target.value))
  }, [])

  const onSel1 = useCallback(() => {
    setTransDisplayValue('originPrimary')
  }, [])

  const onSel2 = useCallback(() => {
    setTransDisplayValue('targetPrimary')
  }, [])

  const onSel3 = useCallback(() => {
    setTransDisplayValue('target')
  }, [])

  const onSelTheme1 = useCallback(() => {
    setThemeValue('system')
  }, [])

  const onSelTheme2 = useCallback(() => {
    setThemeValue('light')
  }, [])

  const onSelTheme3 = useCallback(() => {
    setThemeValue('dark')
  }, [])

  const onSelFontSize1 = useCallback(() => {
    setFontSizeValue('normal')
  }, [])

  const onSelFontSize2 = useCallback(() => {
    setFontSizeValue('large')
  }, [])

  return <div className='text-sm overflow-y-auto' style={{
    height: fold?undefined:`${totalHeight-HEADER_HEIGHT}px`,
  }}>
    <div className="flex flex-col gap-3 p-2">
      <Section title='通用配置'>
        <FormItem title='自动展开' htmlFor='autoExpand' tip='是否视频有字幕时自动展开字幕列表'>
          <input id='autoExpand' type='checkbox' className='toggle toggle-primary' checked={autoExpandValue}
                 onChange={setAutoExpandValue}/>
        </FormItem>
        <FormItem title='主题'>
          <div className="btn-group">
            <button onClick={onSelTheme1} className={classNames('btn btn-xs no-animation', (!themeValue || themeValue === 'system')?'btn-active':'')}>系统</button>
            <button onClick={onSelTheme2} className={classNames('btn btn-xs no-animation', themeValue === 'light'?'btn-active':'')}>浅色</button>
            <button onClick={onSelTheme3} className={classNames('btn btn-xs no-animation', themeValue === 'dark'?'btn-active':'')}>深色</button>
          </div>
        </FormItem>
        <FormItem title='字体大小'>
          <div className="btn-group">
            <button onClick={onSelFontSize1} className={classNames('btn btn-xs no-animation', (!fontSizeValue || fontSizeValue === 'normal')?'btn-active':'')}>普通</button>
            <button onClick={onSelFontSize2} className={classNames('btn btn-xs no-animation', fontSizeValue === 'large'?'btn-active':'')}>加大</button>
          </div>
        </FormItem>
      </Section>
      <Section title='openai配置'>
        <FormItem title='ApiKey' htmlFor='apiKey'>
          <input id='apiKey' type='text' className='input input-sm input-bordered w-full' placeholder='sk-xxx' value={apiKeyValue} onChange={onChangeApiKeyValue}/>
        </FormItem>
        <FormItem title='服务器' htmlFor='serverUrl'>
          <input id='serverUrl' type='text' className='input input-sm input-bordered w-full' placeholder='服务器地址,默认使用官方地址' value={serverUrlValue} onChange={e => setServerUrlValue(e.target.value)}/>
        </FormItem>
        <div className='flex justify-center'>
          <a className='link text-xs' onClick={toggleMoreFold}>{moreFold?'点击查看说明':'点击折叠说明'}</a>
        </div>
        {!moreFold && <div>
          <ul className='pl-3 list-decimal desc text-xs'>
            <li>官方服务器需要科学上网才能访问</li>
            <li>官方网址：<a className='link' href='https://platform.openai.com/' target='_blank' rel="noreferrer">openai.com</a></li>
            <li>支持官方代理(使用官方ApiKey)：<a className='link' onClick={() => setServerUrlValue(SERVER_URL_THIRD)} rel='noreferrer'>点击设置</a></li>
            <li>支持代理(配合ApiKey)：<a className='link' href='https://api2d.com/' target='_blank' rel="noreferrer">api2d</a> | <a className='link' onClick={() => setServerUrlValue('https://openai.api2d.net')} rel='noreferrer'>点击设置</a></li>
            <li>支持代理(配合ApiKey)：<a className='link' href='https://openaimax.com/' target='_blank' rel="noreferrer">OpenAI-Max</a> | <a className='link' onClick={() => setServerUrlValue('https://api.openaimax.com')} rel='noreferrer'>点击设置</a></li>
            <li>支持代理(配合ApiKey)：<a className='link' href='https://openai-sb.com/' target='_blank' rel="noreferrer">OpenAI-SB</a> | <a className='link' onClick={() => setServerUrlValue('https://api.openai-sb.com')} rel='noreferrer'>点击设置</a></li>
            <li>支持代理(配合ApiKey)：<a className='link' href='https://www.ohmygpt.com/' target='_blank' rel="noreferrer">OhMyGPT</a> | <a className='link' onClick={() => setServerUrlValue('https://api.ohmygpt.com')} rel='noreferrer'>点击设置</a></li>
            <li>支持代理(配合ApiKey)：<a className='link' href='https://aiproxy.io/' target='_blank' rel="noreferrer">AIProxy</a> | <a className='link' onClick={() => setServerUrlValue('https://api.aiproxy.io')} rel='noreferrer'>点击设置</a></li>
            <li>支持代理(配合ApiKey)：<a className='link' href='https://key-rental.bowen.cool/' target='_blank' rel="noreferrer">Key Rental</a> | <a className='link' onClick={() => setServerUrlValue('https://key-rental-api.bowen.cool/openai')} rel='noreferrer'>点击设置</a></li>
            <li>支持其他第三方代理，有问题可加群交流</li>
          </ul>
        </div>}
        <FormItem title='模型选择' htmlFor='modelSel' tip='注意，不同模型有不同价格'>
          <select id='modelSel' className="select select-sm select-bordered" value={modelValue} onChange={onChangeModelValue}>
            {MODELS.map(model => <option key={model.code} value={model.code}>{model.name}</option>)}
          </select>
        </FormItem>
        <div className='flex justify-center'>
          <a className='link text-xs' onClick={togglePromptsFold}>{promptsFold?'点击查看提示词':'点击折叠提示词'}</a>
        </div>
        {!promptsFold && <div>
          {PROMPT_TYPES.map((item, idx) => <FormItem key={item.type} title={<div>
            <div>{item.name}</div>
            <div className='link text-xs' onClick={() => {
              setPromptsValue({
                ...promptsValue,
                // @ts-expect-error
                [item.type]: PROMPT_DEFAULTS[item.type]??''
              })
            }}>点击填充默认</div>
          </div>} htmlFor={`prompt-${item.type}`}>
            <textarea id={`prompt-${item.type}`} className='mt-2 textarea input-bordered w-full' placeholder='留空使用默认提示词' value={promptsValue[item.type]??''} onChange={(e) => {
              setPromptsValue({
                ...promptsValue,
                [item.type]: e.target.value
              })
            }}/>
          </FormItem>)}
        </div>}
      </Section>
      <Section title={<div className='flex items-center'>
        翻译配置
        {!apiKeyValue && <div className='tooltip tooltip-right ml-1' data-tip='未设置ApiKey无法使用'>
          <IoWarning className='text-sm text-warning'/>
        </div>}
      </div>}>
        <FormItem title='启用翻译' htmlFor='translateEnable'>
          <input id='translateEnable' type='checkbox' className='toggle toggle-primary' checked={translateEnableValue}
                 onChange={setTranslateEnableValue}/>
        </FormItem>
        <FormItem title='目标语言' htmlFor='language'>
          <select id='language' className="select select-sm select-bordered" value={languageValue} onChange={onChangeLanguageValue}>
            {LANGUAGES.map(language => <option key={language.code} value={language.code}>{language.name}</option>)}
          </select>
        </FormItem>
        <FormItem title='翻译条数' tip='每次翻译条数'>
          <div className='flex-1 flex flex-col'>
            <input type="range" min={TRANSLATE_FETCH_MIN} max={TRANSLATE_FETCH_MAX} step={TRANSLATE_FETCH_STEP} value={fetchAmountValue} className="range range-primary" onChange={onFetchAmountChange} />
            <div className="w-full flex justify-between text-xs px-2">
              {transFetchAmountList.map(amount => <span key={amount}>{amount}</span>)}
            </div>
          </div>
        </FormItem>
        <FormItem title='翻译显示'>
          <div className="btn-group">
            <button onClick={onSel1} className={classNames('btn btn-xs no-animation', (!transDisplayValue || transDisplayValue === 'originPrimary')?'btn-active':'')}>原文为主</button>
            <button onClick={onSel2} className={classNames('btn btn-xs no-animation', transDisplayValue === 'targetPrimary'?'btn-active':'')}>翻译为主</button>
            <button onClick={onSel3} className={classNames('btn btn-xs no-animation', transDisplayValue === 'target'?'btn-active':'')}>仅翻译</button>
          </div>
        </FormItem>
        <FormItem title='隐藏翻译' tip='取消自动翻译时,隐藏已翻译内容' htmlFor='hideOnDisableAutoTranslate'>
          <input id='hideOnDisableAutoTranslate' type='checkbox' className='toggle toggle-primary' checked={hideOnDisableAutoTranslateValue}
                 onChange={onChangeHideOnDisableAutoTranslate}/>
        </FormItem>
      </Section>
      <Section title={<div className='flex items-center'>
        总结配置
        {!apiKeyValue && <div className='tooltip tooltip-right ml-1' data-tip='未设置ApiKey无法使用'>
          <IoWarning className='text-sm text-warning'/>
        </div>}
      </div>}>
        <FormItem title='启用总结' htmlFor='summarizeEnable'>
          <input id='summarizeEnable' type='checkbox' className='toggle toggle-primary' checked={summarizeEnableValue}
                 onChange={setSummarizeEnableValue}/>
        </FormItem>
        <FormItem title='浮动窗口' htmlFor='summarizeFloat' tip='当前总结离开视野时,是否显示浮动窗口'>
          <input id='summarizeFloat' type='checkbox' className='toggle toggle-primary' checked={summarizeFloatValue}
                 onChange={setSummarizeFloatValue}/>
        </FormItem>
        <FormItem title='总结语言' htmlFor='summarizeLanguage'>
          <select id='summarizeLanguage' className="select select-sm select-bordered" value={summarizeLanguageValue} onChange={onChangeSummarizeLanguageValue}>
            {LANGUAGES.map(language => <option key={language.code} value={language.code}>{language.name}</option>)}
          </select>
        </FormItem>
        <FormItem htmlFor='words' title='分段字数' tip='注意，不同模型有不同字数限制'>
          <div className='flex-1 flex flex-col'>
            <input id='words' type='number' className='input input-sm input-bordered w-full' placeholder='默认2000' value={wordsValue} onChange={e => setWordsValue(e.target.value?parseInt(e.target.value):undefined)}/>
            {/* <input type="range" min={WORDS_MIN} max={WORDS_MAX} step={WORDS_STEP} value={wordsValue} className="range range-primary" onChange={onWordsChange} /> */}
            {/* <div className="w-full flex justify-between text-xs px-2"> */}
            {/*  {wordsList.map(words => <span key={words}>{words}</span>)} */}
            {/* </div> */}
          </div>
        </FormItem>
      </Section>
      <div className='flex justify-center gap-5'>
        <button className='btn btn-primary btn-sm' onClick={onSave}>保存</button>
        <button className='btn btn-sm' onClick={onCancel}>取消</button>
      </div>
    </div>
  </div>
}

export default Settings
