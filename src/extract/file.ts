/**
 * @author Harden
 * @description 文件相关
 */

import * as fs from 'fs'
import * as path from 'path'
import * as prettier from 'prettier'

/**
 * 获取文件夹下符合要求的所有文件
 * @function getSpecifiedFiles
 * @param  {string} fullPath 路径
 */
function getSpecifiedFiles(fullPath: string, ignoreFullPaths: string[]): string[] {
  //增加文件处理能力
  if (fs.statSync(fullPath).isFile() && !ignoreFullPaths.includes(fullPath)) {
    return [fullPath]
  }

  return fs.readdirSync(fullPath).reduce((files, file) => {
    const name = path.join(fullPath, file)
    if (ignoreFullPaths.includes(name)) return files

    const ifDirectory = isDirectory(name)
    const ifFile = isFile(name)

    if (ifDirectory) {
      return files.concat(getSpecifiedFiles(name, ignoreFullPaths))
    }

    if (ifFile) {
      return files.concat(name)
    }

    return files
  }, [])
}

/**
 * 读取文件
 * @param fileName
 */
function readFile(fileName: string): string {
  if (fs.existsSync(fileName)) {
    return fs.readFileSync(fileName, 'utf-8')
  }
}

/**
 * 写文件
 * @param fileName
 */
function writeFile(filePath: string, file: string): void {
  if (fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, file)
  }
}

/**
 * 判断是文件夹
 * @param fileName
 */
function isDirectory(fileName: string): boolean | undefined {
  if (fs.existsSync(fileName)) {
    return fs.statSync(fileName).isDirectory()
  }
}

/**
 * 判断是否是文件
 * @param fileName
 */
function isFile(fileName: string): boolean | undefined {
  if (fs.existsSync(fileName)) {
    return fs.statSync(fileName).isFile()
  }
}

/**
 * 使用 Prettier 格式化文件
 * @param fileContent
 */
function prettierFile(fileContent: string): string {
  try {
    return prettier.format(fileContent, {
      parser: 'json',
    })
  } catch (e) {
    console.error(`代码格式化报错！${e.toString()}\n代码为：${fileContent}`)
    return fileContent
  }
}

export { getSpecifiedFiles, readFile, writeFile, isDirectory, isFile, prettierFile }
