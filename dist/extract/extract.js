"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractAll = void 0;
/**
 * @author Harden
 */
const _ = require("lodash");
const path = require("path");
const randomstring = require("randomstring");
const utils_1 = require("../utils");
const file_1 = require("./file");
const findChineseText_1 = require("./findChineseText");
const getLangData_1 = require("./getLangData");
const replace_1 = require("./replace");
const const_1 = require("../const");
/**
 * 递归扫描项目中所有代码的中文
 * @param dir
 * @param ignorePath
 */
function findAllChineseText(scanPath, ignorePaths) {
    const fullPath = path.resolve(process.cwd(), scanPath);
    const ignoreFullPaths = ignorePaths.map((p) => path.resolve(process.cwd(), p));
    const files = file_1.getSpecifiedFiles(fullPath, ignoreFullPaths).filter((file) => file.endsWith('.vue') || file.endsWith('js'));
    return files.reduce((pre, file) => {
        const code = file_1.readFile(file);
        const texts = findChineseText_1.findChineseText(code, file);
        // 【关键】调整文案顺序，保证从后面的文案往前替换，避免位置更新导致替换出错
        const sortTexts = _.sortBy(texts, (obj) => -obj.range.start);
        if (texts.length > 0) {
            console.log(`${file} 发现中文文案`);
        }
        return texts.length > 0 ? pre.concat({ file, texts: sortTexts }) : pre;
    }, []);
}
/**
 * 递归扫描、替换项目中所有代码的中文
 * @param scanPath 待扫描路径
 * @param ignorePaths 忽略路径
 */
function extractAll(scanPath = './', ignorePaths = []) {
    const allTargetStrs = findAllChineseText(scanPath, ignorePaths);
    if (allTargetStrs.length === 0) {
        console.log('没有发现可替换的文案！');
        return;
    }
    // 以文件维度去处理
    allTargetStrs.forEach((item) => {
        const currentFilename = item.file;
        const targetStrs = item.texts;
        // 当前翻译信息
        const currLangObj = getLangData_1.getFlattenLangData();
        // 缓存
        const virtualMemory = {};
        // key信息：取前4位中文转为拼音
        const translateTexts = targetStrs.reduce((prev, curr) => {
            // 避免翻译的字符里包含数字或者特殊字符等情况
            const reg = /[^a-zA-Z\x00-\xff]+/g;
            const findText = curr.text.match(reg);
            const transText = findText ? findText.join('').slice(0, 4) : '中文符号';
            return prev.concat(utils_1.textToPinyin(transText));
        }, []);
        //确定key
        const replaceableStrs = targetStrs.reduce((prev, curr, i) => {
            if (curr.notNewKey) {
                return prev.concat({
                    target: curr,
                });
            }
            if (!virtualMemory[curr.text]) {
                const key = utils_1.findMatchKey(currLangObj, curr.text);
                if (key) {
                    virtualMemory[curr.text] = key; //缓存
                    return prev.concat({
                        target: curr,
                        key,
                    });
                }
                else {
                    //生成key
                    const uuidKey = `${randomstring.generate({
                        length: 4,
                        charset: 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM',
                    })}`;
                    const handleText = translateTexts[i] ? _.camelCase(translateTexts[i]) : uuidKey;
                    const reg = /[a-zA-Z]+/;
                    // 对于翻译后的英文再次过滤，只保留英文字符
                    const purifyText = handleText
                        .split('')
                        .filter((letter) => reg.test(letter))
                        .join('');
                    const transText = purifyText || 'zhongwen';
                    let transKey = `${const_1.LAND_ROOT}.${transText}`;
                    // 防止出现前四位相同但是整体文案不同的情况
                    let occurTime = 1;
                    while (utils_1.findMatchValue(currLangObj, transKey) !== curr.text &&
                        _.keys(currLangObj).includes(`${transKey}${occurTime >= 2 ? occurTime : ''}`)) {
                        occurTime++;
                    }
                    if (occurTime >= 2) {
                        transKey = `${transKey}${occurTime}`;
                    }
                    //缓存&记录
                    virtualMemory[curr.text] = transKey;
                    currLangObj[transKey] = curr.text;
                    return prev.concat({
                        target: curr,
                        key: transKey,
                    });
                }
            }
            else {
                return prev.concat({
                    target: curr,
                    key: virtualMemory[curr.text],
                });
            }
        }, []);
        //替换
        // replaceableStrs.reduce((prev, obj) => {
        //   return prev.then(() => {
        //     return replaceAndUpdate(currentFilename, obj.target, obj.key, false)
        //   })
        // }, Promise.resolve())
        try {
            replaceableStrs.forEach((obj) => {
                replace_1.replaceAndUpdate(currentFilename, obj.target, obj.key, false);
            });
        }
        catch (error) {
            console.log(`${currentFilename}替换失败，存在问题：${error}`);
        }
    });
}
exports.extractAll = extractAll;
//# sourceMappingURL=extract.js.map