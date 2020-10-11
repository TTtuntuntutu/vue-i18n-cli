/**
 * @author Harden
 * @description 导出待翻译文件
 */

import { tsvFormatRows } from 'd3-dsv'
import * as fs from 'fs'
import { EXPORT_LANGS } from './const'
import { getFlattenLangData } from './extract/getLangData'

/**
 *
 * @param file 导出翻译文件路径
 * @param lang 指定翻译语种
 */
function exportMessages(file?: string, lang?: string): void {
  const langs = lang ? [lang] : EXPORT_LANGS
  const allMessages = getFlattenLangData()

  langs.map((lang) => {
    const existingTranslations = getFlattenLangData(lang)

    const messagesToTranslate = Object.keys(allMessages)
      .filter((key) => !existingTranslations.hasOwnProperty(key))
      .map((key) => {
        let message = allMessages[key]
        message = JSON.stringify(message).slice(1, -1)
        return [key, message, '']
      })

    if (messagesToTranslate.length === 0) {
      console.log('All the messages have been translated.')
      return
    }

    messagesToTranslate.unshift(['key', '中文', '英文'])

    const content = tsvFormatRows(messagesToTranslate)
    const sourceFile = file || `${lang}.tsv`

    fs.writeFileSync(sourceFile, content)
    console.log(`Exported ${messagesToTranslate.length} message(s).`)
  })
}

export { exportMessages }
