"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileLangData = exports.getFlattenLangData = void 0;
/**
 * @author harden
 * @desc 获取语言文件：语言维度和文件维度
 */
const fs = require("fs");
const globby = require("globby");
const const_1 = require("../const");
const utils_1 = require("../utils");
/**
 * 获取文件对应语言的key集合
 */
function getFileLangData(fileName) {
    if (fs.existsSync(fileName)) {
        return getLangJson(fileName);
    }
    else {
        return {};
    }
}
exports.getFileLangData = getFileLangData;
/**
 * 获取文件 Json
 * @param fileName 文件名
 */
function getLangJson(fileName) {
    const obj = fs.readFileSync(fileName, { encoding: 'utf8' });
    let jsObj = {};
    try {
        jsObj = eval('(' + obj + ')');
    }
    catch (err) {
        console.log(obj);
        console.error(err);
    }
    return jsObj;
}
function getLangData(lang) {
    const paths = globby.sync(const_1.I18N_GLOB[lang]);
    const langObj = paths.reduce((prev, curr) => {
        const filename = curr
            .split('/')
            .pop()
            .replace(/\.json?$/, '');
        const fileContent = getLangJson(curr);
        const jsObj = fileContent;
        if (Object.keys(jsObj).length === 0) {
            console.log(`\`${curr}\` 解析失败，该文件包含的文案无法自动补全`);
        }
        return Object.assign(Object.assign({}, prev), { [filename]: jsObj });
    }, {});
    return langObj;
}
function getFlattenLangData(lang = 'zh') {
    const langObj = getLangData(lang);
    const finalLangObj = utils_1.flatten(langObj);
    return finalLangObj;
}
exports.getFlattenLangData = getFlattenLangData;
//# sourceMappingURL=getLangData.js.map