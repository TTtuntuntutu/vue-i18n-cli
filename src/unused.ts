/**
 * @author Harden
 * @description 查找未使用的 key
 */
import * as fs from 'fs'
import * as _ from 'lodash'
import * as path from 'path'
import { LAND_DIR } from './const'
import { isDirectory, isFile, readFile, prettierFile } from './extract/file'
import { getFlattenLangData, getFileLangData } from './extract/getLangData'

/**
 * 输出未使用keys
 * @param isDelete 是否自动删除不需要的翻译文案
 */
function findUnUsed(isDelete: boolean): void {
  const allMessages = getFlattenLangData()
  const allKeys = Object.keys(allMessages)
  const allUsedKeys = findUsedKeys('./src')

  const allUnUsedKeys = allKeys.filter((k) => !allUsedKeys.includes(k))

  console.log(allUnUsedKeys)

  if (isDelete) {
    deleteUnusedKeys(allUnUsedKeys)
  }
}

/**
 * 获取项目中使用keys
 * @param fileName 路径
 */
function findUsedKeys(fileName): string[] {
  if (!fs.existsSync(fileName)) return
  const usedKeys = []

  if (isFile(fileName)) {
    usedKeys.push(...check(fileName))
  }

  if (isDirectory(fileName)) {
    const files = fs.readdirSync(fileName).filter((file) => {
      return !file.startsWith('.') && !['node_modules', 'build', 'dist'].includes(file)
    })

    files.forEach(function (val) {
      const temp = path.join(fileName, val)
      usedKeys.push(...findUsedKeys(temp))
    })
  }

  return usedKeys
}

/**
 * 删除未使用的keys
 * @param keys key集合
 */
function deleteUnusedKeys(keys: string[]) {
  keys.forEach((keyValue) => {
    const [fileName, ...fullKeyArrs] = keyValue.split('.')
    const fullKey = fullKeyArrs.join('.')

    for (const [, root] of Object.entries(LAND_DIR)) {
      const targetFilename = `${root}/${fileName}.json`
      const mainContent = getFileLangData(targetFilename)
      _.unset(mainContent, fullKey)

      fs.writeFileSync(targetFilename, prettierFile(`${JSON.stringify(mainContent)}`))
    }
  })
}

/**
 * 获取当前文件下keys集合
 * @param fileName 路径
 */
function check(fileName): string[] {
  const minifyReg = /\s+|[\r\n]/gm
  const keyReg = /(\$t\(|path=)('|")([a-zA-Z0-9.]+)/gm

  // 压缩字符串代码
  const code = readFile(fileName).replace(minifyReg, '')

  const sum = []
  let arr: string[] | null
  while ((arr = keyReg.exec(code)) !== null) {
    // 捕获第3个括号，即使用key的名字
    sum.push(arr[3])
  }

  return sum
}

export { findUnUsed }
