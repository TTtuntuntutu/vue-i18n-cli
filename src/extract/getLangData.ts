/**
 * @author harden
 * @desc 获取语言文件：语言维度和文件维度
 */
import * as fs from 'fs'
import * as globby from 'globby'
import { I18N_GLOB } from '../const'
import { flatten } from '../utils'

/**
 * 获取文件对应语言的key集合
 */
function getFileLangData(fileName: string): Record<string, unknown> {
  if (fs.existsSync(fileName)) {
    return getLangJson(fileName)
  } else {
    return {}
  }
}

/**
 * 获取文件 Json
 * @param fileName 文件名
 */
function getLangJson(fileName) {
  const obj = fs.readFileSync(fileName, { encoding: 'utf8' })
  let jsObj = {}

  try {
    jsObj = eval('(' + obj + ')')
  } catch (err) {
    console.log(obj)
    console.error(err)
  }
  return jsObj
}

function getLangData(lang: string) {
  const paths = globby.sync(I18N_GLOB[lang])

  const langObj = paths.reduce((prev, curr) => {
    const filename = curr
      .split('/')
      .pop()
      .replace(/\.json?$/, '')

    const fileContent = getLangJson(curr)
    const jsObj = fileContent

    if (Object.keys(jsObj).length === 0) {
      console.log(`\`${curr}\` 解析失败，该文件包含的文案无法自动补全`)
    }

    return {
      ...prev,
      [filename]: jsObj,
    }
  }, {})

  return langObj
}

function getFlattenLangData(lang = 'zh'): Record<string, string> {
  const langObj = getLangData(lang)
  const finalLangObj = flatten(langObj)
  return finalLangObj
}

export { getFlattenLangData, getFileLangData }
