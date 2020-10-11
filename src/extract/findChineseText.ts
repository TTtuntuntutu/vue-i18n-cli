/**
 * @author harden
 * @desc 利用 Ast 查找对应文件中的中文文案
 */
import * as ts from 'typescript'
import * as compilerVue from 'vue-template-compiler'
import { DOUBLE_BYTE_REGEX } from '../const'

interface Fragment {
  text: string
  rawText?: string
  range: {
    start: number
    end: number
  }
  type: string[]
  attrName?: string
}

/**
 * 字符串去重，在处理脚本内的模版字符串时用到
 * @param matches
 */
function deduplicateStr(matches) {
  const repeatMatches = matches.filter((m) => m.ifRepeat)

  return repeatMatches.length
    ? matches.filter((m) => {
      const index = repeatMatches.findIndex(
        (r) =>
          m.text === r.text && m.range.start === r.range.start && m.range.end === r.range.end,
      )

      return !~index
    })
    : matches
}

/**
 * 查找 Vue 中文
 * @param code
 */
function findTextInVue(code: string) {
  const { ast: templateInVue } = compilerVue.compile(code.toString(), {
    outputSourceRange: true,
  })

  const textsInTemplate = findTextInVueTemp(templateInVue)

  let textsInScript = []
  const sfc = compilerVue.parseComponent(code.toString())
  if (sfc.script) {
    textsInScript = findTextInVueJS(sfc.script.content, sfc.script.start)
  }

  return [...textsInScript, ...textsInTemplate]
}

/**
 * 查找 Vue-template 中文
 * @param code
 */
function findTextInVueTemp(ast: compilerVue.ASTElement) {
  const arr = []

  function emun(ast) {
    // 属性
    if (ast?.attrsList?.length) {
      ast.attrsList.forEach((attr) => {
        const { name, value, start, end } = attr

        if (!value.match(DOUBLE_BYTE_REGEX)) return

        // case 普通属性字符串
        if (!name.includes(':') && !name.startsWith('@')) {
          arr.push({
            text: value.trim(),
            range: {
              start,
              end,
            },
            attrName: name,
            type: ['template', 'attrString'],
          })
        } else {
          const regx = /\'[^']*\'|\"[^"]*\"|\`[^\`]*\`/gm
          let result
          while ((result = regx.exec(value))) {
            if (result && result[0].match(DOUBLE_BYTE_REGEX)) {
              const text = result[0].slice(1, -1)
              const range = {
                start: end - value.length - 1 + result.index,
                end: end - value.length - 1 + regx.lastIndex,
              }
              const ifExprInterpolation = result[0].startsWith('`')

              if (ifExprInterpolation) {
                let index = 0
                // case 属性表达式内模版字符串
                arr.push({
                  text: text.replace(/\${([^\}]+)\}/g, () => {
                    return `{${index++}}`
                  }),
                  rawText: text,
                  range,
                  type: ['template', 'exprInterpolation'],
                })
              } else {
                // case 属性表达式内普通字符串
                arr.push({
                  text: text.trim(),
                  range,
                  type: ['template', 'exprString'],
                })
              }
            }
          }
        }
      })
    }

    if (ast.expression) {
      const { start, end, text } = ast

      const tokens = ast.tokens.filter((t) => {
        if (typeof t === 'string') {
          return t.trim()
        } else {
          return true
        }
      })

      //case 仅有一个表达式，即都在{{}}内
      if (tokens.length === 1) {
        const regx = /\'[^']*\'|\"[^"]*\"|\`[^\`]*\`/gm
        let result
        while ((result = regx.exec(text))) {
          if (result && result[0].match(DOUBLE_BYTE_REGEX)) {
            const text = result[0].slice(1, -1)
            const range = {
              start: start + result.index,
              end: start + regx.lastIndex,
            }
            const ifExprInterpolation = result[0].startsWith('`')

            if (ifExprInterpolation) {
              let index = 0
              arr.push({
                text: text.replace(/\${([^\}]+)\}/g, () => {
                  return `{${index++}}`
                }),
                rawText: text,
                range,
                type: ['template', 'exprInterpolation'],
              })
            } else {
              arr.push({
                text,
                range,
                type: ['template', 'exprString'],
              })
            }
          }
        }
      } else {
        const newText = text.replace(/{{([^{}]+)}}/gm, (match, p1) => `\${${p1}}`)
        arr.push({
          text: `\`${newText}\``,
          range: {
            start,
            end,
          },
          type: ['template', 'replace'],
          notNewKey: true,
        })
      }
    } else if (!ast.expression && ast.text) {
      ast.text.match(DOUBLE_BYTE_REGEX) &&
        // 普通文本
        arr.push({
          text: ast.text.trim(),
          range: { start: ast.start, end: ast.end },
          type: ['template', 'string'],
        })
    } else {
      // 遍历children
      ast.children &&
        ast.children.forEach((item) => {
          emun(item)
        })

      // 遍历scopedSlots
      ast.scopedSlots &&
        Object.entries(ast.scopedSlots).forEach(([key, value]) => {
          emun(value)
        })

      // 遍历ifConditions不会出现在children中的内容
      ast.ifConditions &&
        ast.ifConditions.forEach((c, i) => {
          if (i !== 0) emun(c.block)
        })
    }
  }
  emun(ast)

  return arr
}

/**
 * 查找 Vue-script 中文
 * @param code
 */
function findTextInVueJS(code: string, startNum: number) {
  let matches = []
  const ast = ts.createSourceFile('', code, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TSX)
  let ifInsideExport = false

  function visit(node: ts.Node) {
    switch (node.kind) {
      case ts.SyntaxKind.ExportAssignment: {
        if (node.parent.kind === ts.SyntaxKind.SourceFile) {
          ifInsideExport = true
        }
        break
      }
      case ts.SyntaxKind.StringLiteral: {
        /** 判断 Ts 中的字符串含有中文 */
        const { text } = node as ts.StringLiteral
        if (text.match(DOUBLE_BYTE_REGEX)) {
          const start = node.getStart()
          const end = node.getEnd()
          const range = { start: start + startNum, end: end + startNum }
          const tag = ifInsideExport ? 'script' : 'javascript'
          const ifInJsxAttribute = node.parent.kind === ts.SyntaxKind.JsxAttribute
          const ifInPropsDefault =
            ifInsideExport && code.slice(start - 10, start - 1).includes('default')

          if (ifInPropsDefault) {
            matches.push({
              range,
              text: text.trim(),
              type: ['script', 'props'], //props内字符串做特殊处理
            })
          } else {
            matches.push({
              range,
              text: text.trim(),
              type: [tag, ifInJsxAttribute ? 'jsx' : 'string'], //普通字符串、jsx属性字符串
            })
          }
        }
        break
      }
      case ts.SyntaxKind.JsxElement: {
        const { children } = node as ts.JsxElement

        children.forEach((child) => {
          if (child.kind === ts.SyntaxKind.JsxText) {
            const text = child.getText()

            if (text.match(DOUBLE_BYTE_REGEX)) {
              const start = child.getStart()
              const end = child.getEnd()
              const range = { start: start + startNum, end: end + startNum }
              const tag = ifInsideExport ? 'script' : 'javascript'

              matches.push({
                range,
                text: text.trim(),
                type: [tag, 'jsx'],
              })
            }
          }
        })
        break
      }
      case ts.SyntaxKind.TemplateExpression: {
        const { pos, end } = node
        const templateContent = code
          .slice(pos, end)
          .toString()
          .replace(/\$\{[^\}]+\}/, '')

        if (templateContent.match(DOUBLE_BYTE_REGEX)) {
          const start = node.getStart()
          const end = node.getEnd()
          const range = { start: start + startNum, end: end + startNum }
          const text = code.slice(start, end)
          const tag = ifInsideExport ? 'script' : 'javascript'
          let index = 0

          matches.push({
            text: text.slice(1, -1).replace(/\${([^\}]+)\}/g, () => {
              return `{${index++}}`
            }),
            rawText: text.slice(1, -1),
            range,
            type: [tag, 'exprTemplate'],
          })

          //收集会重复出现的StringLiteral
          let result
          const regx = /\'[^']*\'|\"[^"]*\"/gm
          while ((result = regx.exec(text))) {
            if (result && result[0].match(DOUBLE_BYTE_REGEX))
              matches.push({
                text: result[0].slice(1, -1),
                range: {
                  start: range.start + result.index,
                  end: range.start + regx.lastIndex,
                },
                ifRepeat: true,
              })
          }
        }
        break
      }
      case ts.SyntaxKind.NoSubstitutionTemplateLiteral: {
        const { pos, end } = node
        const templateContent = code.slice(pos, end)

        if (templateContent.match(DOUBLE_BYTE_REGEX)) {
          const start = node.getStart()
          const end = node.getEnd()
          const range = { start: start + startNum, end: end + startNum }
          const tag = ifInsideExport ? 'script' : 'javascript'

          matches.push({
            range,
            text: code.slice(start + 1, end - 1).trim(), //考虑`和`
            type: [tag, 'string'],
          })
        }
      }
    }

    ts.forEachChild(node, visit)
  }
  ts.forEachChild(ast, visit)

  // 模版字符串中存在字符串时需去重
  matches = deduplicateStr(matches)
  return matches
}

function findTextInJS(code: string) {
  let matches = []
  const ast = ts.createSourceFile('', code, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TSX)

  function visit(node: ts.Node) {
    switch (node.kind) {
      case ts.SyntaxKind.StringLiteral: {
        /** 判断 Ts 中的字符串含有中文 */
        const { text } = node as ts.StringLiteral
        if (text.match(DOUBLE_BYTE_REGEX)) {
          const start = node.getStart()
          const end = node.getEnd()
          const range = { start, end }
          const ifInJsxAttribute = node.parent.kind === ts.SyntaxKind.JsxAttribute
          const ifInPropsDefault = code.slice(start - 10, start - 1).includes('default')

          if (ifInPropsDefault) {
            matches.push({
              range,
              text: text.trim(),
              type: ['javascript', 'props'], //props内字符串做特殊处理
            })
          } else {
            matches.push({
              range,
              text: text.trim(),
              type: ['javascript', ifInJsxAttribute ? 'jsx' : 'string'],
            })
          }
        }
        break
      }
      case ts.SyntaxKind.JsxElement: {
        const { children } = node as ts.JsxElement

        children.forEach((child) => {
          if (child.kind === ts.SyntaxKind.JsxText) {
            const text = child.getText()

            if (text.match(DOUBLE_BYTE_REGEX)) {
              const start = child.getStart()
              const end = child.getEnd()
              const range = { start: start, end: end }

              matches.push({
                range,
                text: text.trim(),
                type: ['javascript', 'jsx'],
              })
            }
          }
        })
        break
      }
      case ts.SyntaxKind.TemplateExpression: {
        const { pos, end } = node
        const templateContent = code
          .slice(pos, end)
          .toString()
          .replace(/\$\{[^\}]+\}/, '')

        if (templateContent.match(DOUBLE_BYTE_REGEX)) {
          const start = node.getStart()
          const end = node.getEnd()
          const range = { start, end }
          const text = code.slice(start, end)

          let index = 0
          matches.push({
            text: text.slice(1, -1).replace(/\${([^\}]+)\}/g, () => {
              return `{${index++}}`
            }),
            rawText: text.slice(1, -1),
            range,
            type: ['javascript', 'exprTemplate'],
          })

          //收集会重复出现的StringLiteral
          let result
          const regx = /\'[^']*\'|\"[^"]*\"/gm
          while ((result = regx.exec(text))) {
            if (result && result[0].match(DOUBLE_BYTE_REGEX))
              matches.push({
                text: result[0].slice(1, -1),
                range: {
                  start: range.start + result.index,
                  end: range.start + regx.lastIndex,
                },
                ifRepeat: true,
              })
          }
        }

        break
      }
      case ts.SyntaxKind.NoSubstitutionTemplateLiteral: {
        const { pos, end } = node
        const templateContent = code.slice(pos, end)

        if (templateContent.match(DOUBLE_BYTE_REGEX)) {
          const start = node.getStart()
          const end = node.getEnd()
          const range = { start, end }
          matches.push({
            range,
            text: code.slice(start, end).trim(),
            type: ['javascript', 'string'],
          })
        }
      }
    }

    ts.forEachChild(node, visit)
  }
  ts.forEachChild(ast, visit)

  // 模版字符串中存在字符串时需去重
  matches = deduplicateStr(matches)
  return matches
}

/**
 * 递归匹配代码的中文
 * @param code
 * @param file
 */
function findChineseText(code: string, fileName: string): Fragment[] {
  if (fileName.endsWith('.vue')) {
    return findTextInVue(code)
  }

  if (fileName.endsWith('.js')) {
    return findTextInJS(code)
  }
}

export { findChineseText }
