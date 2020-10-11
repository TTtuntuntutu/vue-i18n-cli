#!/usr/bin/env node

import * as commander from 'commander'
import * as ora from 'ora'
import { exportMessages } from './export'
import { extractAll } from './extract/extract'
import { importMessages } from './import'
import { findUnUsed } from './unused'

/**
 * 进度条加载
 * @param text
 * @param callback
 */
function spining(text, callback) {
  const spinner = ora(`${text}中...`).start()
  if (callback) {
    callback()
  }
  spinner.succeed(`${text}成功`)
}

commander
  .version('1.0.0')
  .option('--extract [scanPath] [ignorePaths...]', '提取指定文件夹下的中文')
  .option('--export [file] [lang]', '导出未翻译的文案')
  .option('--import [file] [lang]', '导入翻译文案')
  .option('--unused [replace]', '导出未使用的文案')
  .parse(process.argv)

if (commander.extract) {
  if (commander.extract === true) {
    extractAll()
  } else {
    const [scanPath, ...ignorePaths] = commander.extract
    extractAll(scanPath, ignorePaths)
  }
}

if (commander.export) {
  spining('导出未翻译文案', () => {
    if (commander.export === true && commander.args.length === 0) {
      exportMessages()
    } else if (commander.args) {
      exportMessages(commander.export, commander.args[0])
    }
  })
}

if (commander.import) {
  spining('导入翻译文案', () => {
    if (commander.import === true || commander.args.length === 0) {
      console.log('请按格式输入：--import [file] [lang]')
    } else if (commander.args) {
      importMessages(commander.import, commander.args[0])
    }
  })
}

if (commander.unused) {
  console.log(commander.unused)
  console.log(commander.args[0])

  spining('导出未使用的文案', () => {
    findUnUsed(commander.unused === true ? true : false)
  })
}
