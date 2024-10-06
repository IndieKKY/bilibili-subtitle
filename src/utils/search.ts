import * as JsSearch from 'js-search'
import {uniq} from 'lodash-es'
import {getWords, getWordsPinyin} from './pinyinUtil'

const tokenize = (maxLength: number, content: string, options?: SearchOptions) => {
  const result: string[] = []

  // 最大长度
  if (content.length > maxLength) {
    content = content.substring(0, maxLength)
  }
  result.push(...getWords(content))
  // check cn
  if (options?.cnSearchEnabled) {
    result.push(...getWordsPinyin(content))
  }

  // console.debug('[Search] tokenize:', str, '=>', result)

  return uniq(result)
}

export interface SearchOptions {
  cnSearchEnabled?: boolean
}

export const Search = (uidFieldName: string, index: string, maxLength: number, options?: SearchOptions) => {
  let searchRef: JsSearch.Search | undefined// 搜索器

  /**
   * 重置索引
   */
  const reset = (documents?: Object[]) => {
    // 搜索器
    searchRef = new JsSearch.Search(uidFieldName)
    searchRef.tokenizer = {
      tokenize: (str) => {
        return tokenize(maxLength, str, options)
      }
    }
    searchRef.addIndex(index)

    // 检测添加文档
    if (documents != null) {
      searchRef.addDocuments(documents)
    }
  }

  /**
   * 添加文档
   */
  const add = (document: Object) => {
    searchRef?.addDocument(document)
  }

  /**
   * 搜索
   * @return 未去重
   */
  const search = (text: string) => {
    return searchRef?.search(text.toLowerCase())
  }

  return {reset, add, search}
}
