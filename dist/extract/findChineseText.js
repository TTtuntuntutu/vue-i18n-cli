"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findChineseText = void 0;
/**
 * @author harden
 * @desc 利用 Ast 查找对应文件中的中文文案
 */
const ts = require("typescript");
const compilerVue = require("vue-template-compiler");
const const_1 = require("../const");
/**
 * 字符串去重，在处理脚本内的模版字符串时用到
 * @param matches
 */
function deduplicateStr(matches) {
    const repeatMatches = matches.filter((m) => m.ifRepeat);
    return repeatMatches.length
        ? matches.filter((m) => {
            const index = repeatMatches.findIndex((r) => m.text === r.text && m.range.start === r.range.start && m.range.end === r.range.end);
            return !~index;
        })
        : matches;
}
/**
 * 查找 Vue文件 中文
 * @param code
 */
function findTextInVue(code) {
    // const { ast: templateInVue } = compilerVue.compile(code.toString(), {
    //   outputSourceRange: true,
    // });
    // const textsInTemplate = findTextInVueTemp(templateInVue);
    const textsInTemplate = [];
    let textsInScript = [];
    const sfc = compilerVue.parseComponent(code.toString());
    if (sfc.script) {
        textsInScript = findTextInVueJS(sfc.script.content, sfc.script.start);
    }
    return [...textsInScript, ...textsInTemplate];
}
// 查找 Vue文件<template> 中文
function findTextInVueTemp(ast) {
    const arr = [];
    function emun(ast) {
        var _a;
        // 属性
        if ((_a = ast === null || ast === void 0 ? void 0 : ast.attrsList) === null || _a === void 0 ? void 0 : _a.length) {
            ast.attrsList.forEach((attr) => {
                const { name, value, start, end } = attr;
                if (!value.match(const_1.DOUBLE_BYTE_REGEX))
                    return;
                // case 属性值是字符串，换言之，属性不是指令 or 自定义指令
                if (!name.includes("v-") && !name.includes(":") && !name.startsWith("@")) {
                    arr.push({
                        text: value.trim(),
                        range: {
                            start,
                            end,
                        },
                        attrName: name,
                        type: ["template", "attrString"],
                    });
                }
                else {
                    const regx = /\'[^']*\'|\"[^"]*\"|\`[^\`]*\`/gm;
                    let result;
                    while ((result = regx.exec(value))) {
                        if (result && result[0].match(const_1.DOUBLE_BYTE_REGEX)) {
                            const text = result[0].slice(1, -1);
                            const range = {
                                start: end - value.length - 1 + result.index,
                                end: end - value.length - 1 + regx.lastIndex,
                            };
                            const ifExprInterpolation = result[0].startsWith("`");
                            if (ifExprInterpolation) {
                                let index = 0;
                                // case 属性表达式内模版字符串
                                arr.push({
                                    text: text.replace(/\${([^\}]+)\}/g, () => {
                                        return `{${index++}}`;
                                    }),
                                    rawText: text,
                                    range,
                                    type: ["template", "exprInterpolation"],
                                });
                            }
                            else {
                                // case 属性表达式内普通字符串
                                arr.push({
                                    text: text.trim(),
                                    range,
                                    type: ["template", "exprString"],
                                });
                            }
                        }
                    }
                }
            });
        }
        if (ast.expression) {
            const { start, end, text } = ast;
            const tokens = ast.tokens.filter((t) => {
                if (typeof t === "string") {
                    return t.trim();
                }
                else {
                    return true;
                }
            });
            //case 仅有一个表达式，即都在{{}}内
            if (tokens.length === 1) {
                const regx = /\'[^']*\'|\"[^"]*\"|\`[^\`]*\`/gm;
                let result;
                while ((result = regx.exec(text))) {
                    if (result && result[0].match(const_1.DOUBLE_BYTE_REGEX)) {
                        const text = result[0].slice(1, -1);
                        const range = {
                            start: start + result.index,
                            end: start + regx.lastIndex,
                        };
                        const ifExprInterpolation = result[0].startsWith("`");
                        if (ifExprInterpolation) {
                            let index = 0;
                            arr.push({
                                text: text.replace(/\${([^\}]+)\}/g, () => {
                                    return `{${index++}}`;
                                }),
                                rawText: text,
                                range,
                                type: ["template", "exprInterpolation"],
                            });
                        }
                        else {
                            arr.push({
                                text,
                                range,
                                type: ["template", "exprString"],
                            });
                        }
                    }
                }
            }
            else if (const_1.DOUBLE_BYTE_REGEX.test(text)) {
                const newText = text.replace(/{{([^{}]+)}}/gm, (match, p1) => `\${${p1}}`);
                arr.push({
                    text: `\`${newText}\``,
                    range: {
                        start,
                        end,
                    },
                    type: ["template", "replace"],
                    notNewKey: true,
                });
            }
        }
        else if (!ast.expression && ast.text) {
            // case 普通文本，保留整段文本
            ast.text.match(const_1.DOUBLE_BYTE_REGEX) &&
                arr.push({
                    text: ast.text.trim(),
                    range: { start: ast.start, end: ast.end },
                    type: ["template", "string"],
                });
        }
        else {
            // 遍历children
            ast.children &&
                ast.children.forEach((item) => {
                    emun(item);
                });
            // 遍历scopedSlots
            ast.scopedSlots &&
                Object.entries(ast.scopedSlots).forEach(([key, value]) => {
                    emun(value);
                });
            // 遍历ifConditions不会出现在children中的内容
            ast.ifConditions &&
                ast.ifConditions.forEach((c, i) => {
                    if (i !== 0)
                        emun(c.block);
                });
        }
    }
    emun(ast);
    return arr;
}
// 查找 Vue文件<script> 中文
function findTextInVueJS(code, startNum) {
    let matches = [];
    const ast = ts.createSourceFile("", code, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TSX);
    let ifInsideExport = false;
    function visit(node) {
        switch (node.kind) {
            case ts.SyntaxKind.ExportAssignment: {
                if (node.parent.kind === ts.SyntaxKind.SourceFile) {
                    ifInsideExport = true;
                }
                break;
            }
            case ts.SyntaxKind.StringLiteral: {
                /** 判断 Ts 中的字符串含有中文 */
                const { text } = node;
                if (text.match(const_1.DOUBLE_BYTE_REGEX)) {
                    const start = node.getStart();
                    const end = node.getEnd();
                    const range = { start: start + startNum, end: end + startNum };
                    const tag = ifInsideExport ? "script" : "javascript";
                    const ifInJsxAttribute = node.parent.kind === ts.SyntaxKind.JsxAttribute;
                    const ifInPropsDefault = ifInsideExport && code.slice(start - 10, start - 1).includes("default");
                    if (ifInPropsDefault) {
                        matches.push({
                            range,
                            text: text.trim(),
                            type: ["script", "props"],
                        });
                    }
                    else {
                        matches.push({
                            range,
                            text: text.trim(),
                            type: [tag, ifInJsxAttribute ? "jsx" : "string"],
                        });
                    }
                }
                break;
            }
            case ts.SyntaxKind.JsxElement: {
                const { children } = node;
                children.forEach((child) => {
                    if (child.kind === ts.SyntaxKind.JsxText) {
                        const text = child.getText();
                        console.log("ts.SyntaxKind.JsxText");
                        console.log(text);
                        if (text.match(const_1.DOUBLE_BYTE_REGEX)) {
                            const start = child.getStart();
                            const end = child.getEnd();
                            const range = { start: start + startNum, end: end + startNum };
                            const tag = ifInsideExport ? "script" : "javascript";
                            matches.push({
                                range,
                                text: text.trim(),
                                type: [tag, "jsx"],
                            });
                        }
                    }
                });
                break;
            }
            case ts.SyntaxKind.TemplateExpression: {
                const { pos, end } = node;
                const templateContent = code
                    .slice(pos, end)
                    .toString()
                    .replace(/\$\{[^\}]+\}/, "");
                if (templateContent.match(const_1.DOUBLE_BYTE_REGEX)) {
                    const start = node.getStart();
                    const end = node.getEnd();
                    const range = { start: start + startNum, end: end + startNum };
                    const text = code.slice(start, end);
                    const tag = ifInsideExport ? "script" : "javascript";
                    let index = 0;
                    matches.push({
                        text: text.slice(1, -1).replace(/\${([^\}]+)\}/g, () => {
                            return `{${index++}}`;
                        }),
                        rawText: text.slice(1, -1),
                        range,
                        type: [tag, "exprTemplate"],
                    });
                    //收集会重复出现的StringLiteral
                    let result;
                    const regx = /\'[^']*\'|\"[^"]*\"/gm;
                    while ((result = regx.exec(text))) {
                        if (result && result[0].match(const_1.DOUBLE_BYTE_REGEX))
                            matches.push({
                                text: result[0].slice(1, -1),
                                range: {
                                    start: range.start + result.index,
                                    end: range.start + regx.lastIndex,
                                },
                                ifRepeat: true,
                            });
                    }
                }
                break;
            }
            case ts.SyntaxKind.NoSubstitutionTemplateLiteral: {
                const { pos, end } = node;
                const templateContent = code.slice(pos, end);
                if (templateContent.match(const_1.DOUBLE_BYTE_REGEX)) {
                    const start = node.getStart();
                    const end = node.getEnd();
                    const range = { start: start + startNum, end: end + startNum };
                    const tag = ifInsideExport ? "script" : "javascript";
                    matches.push({
                        range,
                        text: code.slice(start + 1, end - 1).trim(),
                        type: [tag, "string"],
                    });
                }
            }
        }
        ts.forEachChild(node, visit);
    }
    ts.forEachChild(ast, visit);
    // 模版字符串中存在字符串时需去重
    matches = deduplicateStr(matches);
    return matches;
}
function findTextInJS(code) {
    let matches = [];
    const ast = ts.createSourceFile("", code, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TSX);
    function visit(node) {
        switch (node.kind) {
            case ts.SyntaxKind.StringLiteral: {
                /** 判断 Ts 中的字符串含有中文 */
                const { text } = node;
                if (text.match(const_1.DOUBLE_BYTE_REGEX)) {
                    const start = node.getStart();
                    const end = node.getEnd();
                    const range = { start, end };
                    const ifInJsxAttribute = node.parent.kind === ts.SyntaxKind.JsxAttribute;
                    const ifInPropsDefault = code.slice(start - 10, start - 1).includes("default");
                    if (ifInPropsDefault) {
                        matches.push({
                            range,
                            text: text.trim(),
                            type: ["javascript", "props"],
                        });
                    }
                    else {
                        matches.push({
                            range,
                            text: text.trim(),
                            type: ["javascript", ifInJsxAttribute ? "jsx" : "string"],
                        });
                    }
                }
                break;
            }
            case ts.SyntaxKind.JsxElement: {
                const { children } = node;
                children.forEach((child) => {
                    if (child.kind === ts.SyntaxKind.JsxText) {
                        const text = child.getText();
                        if (text.match(const_1.DOUBLE_BYTE_REGEX)) {
                            const start = child.getStart();
                            const end = child.getEnd();
                            const range = { start: start, end: end };
                            matches.push({
                                range,
                                text: text.trim(),
                                type: ["javascript", "jsx"],
                            });
                        }
                    }
                });
                break;
            }
            case ts.SyntaxKind.TemplateExpression: {
                const { pos, end } = node;
                const templateContent = code
                    .slice(pos, end)
                    .toString()
                    .replace(/\$\{[^\}]+\}/, "");
                if (templateContent.match(const_1.DOUBLE_BYTE_REGEX)) {
                    const start = node.getStart();
                    const end = node.getEnd();
                    const range = { start, end };
                    const text = code.slice(start, end);
                    let index = 0;
                    matches.push({
                        text: text.slice(1, -1).replace(/\${([^\}]+)\}/g, () => {
                            return `{${index++}}`;
                        }),
                        rawText: text.slice(1, -1),
                        range,
                        type: ["javascript", "exprTemplate"],
                    });
                    //收集会重复出现的StringLiteral
                    let result;
                    const regx = /\'[^']*\'|\"[^"]*\"/gm;
                    while ((result = regx.exec(text))) {
                        if (result && result[0].match(const_1.DOUBLE_BYTE_REGEX))
                            matches.push({
                                text: result[0].slice(1, -1),
                                range: {
                                    start: range.start + result.index,
                                    end: range.start + regx.lastIndex,
                                },
                                ifRepeat: true,
                            });
                    }
                }
                break;
            }
            case ts.SyntaxKind.NoSubstitutionTemplateLiteral: {
                const { pos, end } = node;
                const templateContent = code.slice(pos, end);
                if (templateContent.match(const_1.DOUBLE_BYTE_REGEX)) {
                    const start = node.getStart();
                    const end = node.getEnd();
                    const range = { start, end };
                    matches.push({
                        range,
                        text: code.slice(start, end).trim(),
                        type: ["javascript", "string"],
                    });
                }
            }
        }
        ts.forEachChild(node, visit);
    }
    ts.forEachChild(ast, visit);
    // 模版字符串中存在字符串时需去重
    matches = deduplicateStr(matches);
    return matches;
}
/**
 * 递归匹配代码的中文
 * @param code  代码字符串
 * @param fileName 文件名称
 */
function findChineseText(code, fileName) {
    if (fileName.endsWith(".vue")) {
        return findTextInVue(code);
    }
    if (fileName.endsWith(".js")) {
        return findTextInJS(code);
    }
}
exports.findChineseText = findChineseText;
//# sourceMappingURL=findChineseText.js.map