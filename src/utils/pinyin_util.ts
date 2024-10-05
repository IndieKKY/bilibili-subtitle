import pinyin from 'tiny-pinyin'
import {uniq} from 'lodash-es'

/**
 * pinyin的返回结果
 */
interface Ret {
  type: 1 | 2 | 3
  source: string
  target: string
}

interface Phase {
  pinyin: boolean
  list: Ret[]
}

/**
 * 获取Phase列表(中英文分离列表)
 */
export const getPhases = (str: string) => {
  const rets = pinyin.parse(str)

  const phases: Phase[] = []
  let curPinyin_ = false
  let curPhase_: Ret[] = []
  const addCurrentPhase = () => {
    if (curPhase_.length > 0) {
      phases.push({
        pinyin: curPinyin_,
        list: curPhase_,
      })
    }
  }

  // 遍历rets
  for (const ret of rets) {
    const newPinyin = ret.type === 2
    // 如果跟旧的pinyin类型不同，先保存旧的
    if (newPinyin !== curPinyin_) {
      addCurrentPhase()
      // 重置
      curPinyin_ = newPinyin
      curPhase_ = []
    }
    // 添加新的
    curPhase_.push(ret)
  }
  // 最后一个
  addCurrentPhase()

  return phases
}

/**
 * 获取原子字符列表，如 tool tab 汉 字
 */
export const getAtoms = (str: string) => {
  const phases = getPhases(str)

  const atoms = []
  for (const phase of phases) {
    if (phase.pinyin) { // all words
      atoms.push(...phase.list.map(e => e.source).filter(e => e))
    } else { // split
      atoms.push(...(phase.list.map((e: any) => e.source).join('').match(/\w+/g)??[]).filter((e: string) => e))
    }
  }

  return atoms
}

const fixStrs = (atoms: string[]) => {
  // 小写
  atoms = atoms.map(e => e.toLowerCase())

  // 去重
  atoms = uniq(atoms)

  // 返回
  return atoms
}

export const getWords = (str: string) => {
  // 获取全部原子字符
  const atoms = getAtoms(str)
  // fix
  return fixStrs(atoms)
}

/**
 * 我的世界Minecraft => ['wodeshijie', 'deshijie', 'shijie', 'jie'] + ['wdsj', 'dsj', 'sj', 'j']
 *
 * 1. only handle pinyin, other is ignored
 */
export const getWordsPinyin = (str: string) => {
  let result: string[] = []

  for (const phase of getPhases(str)) {
    // only handle pinyin
    if (phase.pinyin) { // 我的世界
      // 获取全部原子字符
      // 我的世界 => [我, 的, 世, 界]
      const atoms: string[] = []
      atoms.push(...phase.list.map(e => e.source).filter(e => e))
      // 获取全部子串
      // [我, 的, 世, 界] => [我的世界, 的世界, 世界, 界]
      const allSubStr = []
      for (let i = 0; i < atoms.length; i++) {
        allSubStr.push(atoms.slice(i).join(''))
      }
      // pinyin version
      const pinyinList = allSubStr.map((e: string) => pinyin.convertToPinyin(e))
      result.push(...pinyinList)
      // pinyin first version
      const pinyinFirstList = allSubStr.map((e: string) => pinyin.parse(e).map((e: any) => e.type === 2?e.target[0]:null).filter(e => !!e).join(''))
      result.push(...pinyinFirstList)
    }
  }

  // fix
  result = fixStrs(result)

  return result
}
