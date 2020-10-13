/**
 * @author Harden
 * @description 查找指定文件夹下，仍然存在中文的文件
 */
import { readFile, getSpecifiedFiles } from './extract/file'
import { findChineseText } from './extract/findChineseText'

function findUnScanned(scanPath = './src', ignorePaths: string[] = []): void {
  const files = getSpecifiedFiles(scanPath, ignorePaths)
    .filter((file) => file.endsWith('.vue') || file.endsWith('js'))
    .filter(assertExistsChinese)

  console.log(files.length ? files : `${scanPath} 文件夹下没有待扫描文件`)
}

function assertExistsChinese(fileName: string): boolean {
  const code = readFile(fileName)
  const texts = findChineseText(code, fileName)

  return texts.length > 0
}

export { findUnScanned }
