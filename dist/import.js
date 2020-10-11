"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importMessages = void 0;
/**
 * @author Harden
 * @description 导入翻译文件
 */
const d3_dsv_1 = require("d3-dsv");
const getLangData_1 = require("./extract/getLangData");
const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const const_1 = require("./const");
const replace_1 = require("./extract/replace");
/**
 * 获取导入文件原始数据
 * @param file
 */
function getMessagesToImport(file) {
    const content = fs.readFileSync(file).toString();
    let index = 0;
    const messages = d3_dsv_1.tsvParseRows(content, ([key, , translateValue]) => {
        // 第一行标题不处理
        if (index) {
            try {
                // value 的形式和 JSON 中的字符串值一致，其中的特殊字符是以转义形式存在的，
                // 如换行符 \n，在 value 中占两个字符，需要转成真正的换行符。
                translateValue = JSON.parse(`"${translateValue}"`);
            }
            catch (e) {
                throw new Error(`Illegal message: ${translateValue}`);
            }
            return [key, translateValue];
        }
        else {
            index++;
        }
    });
    const rst = {};
    const duplicateKeys = new Set();
    messages.forEach(([key, value]) => {
        if (rst.hasOwnProperty(key)) {
            duplicateKeys.add(key);
        }
        rst[key] = value;
    });
    if (duplicateKeys.size > 0) {
        const errorMessage = 'Duplicate messages detected: \n' + [...duplicateKeys].join('\n');
        console.error(errorMessage);
        process.exit(1);
    }
    return rst;
}
function generateNewLangFile(messages, obj = {}) {
    for (const [key, value] of Object.entries(messages)) {
        obj = _.set(obj, key, value);
    }
    return replace_1.prettierFile(`${JSON.stringify(obj, null, 2)}`);
}
/**
 * 写入翻译文件
 * @param messages 翻译后的数据
 * @param file 写入位置，文件名
 * @param lang 翻译语种
 */
function writeMessagesToFile(messages, file, lang) {
    const dstFile = `${path.resolve(const_1.LAND_DIR[lang], file)}.json`;
    if (!fs.existsSync(dstFile)) {
        fs.writeFileSync(dstFile, replace_1.prettierFile(generateNewLangFile(messages)));
    }
    else {
        const mainContent = getLangData_1.getFileLangData(dstFile);
        const obj = mainContent;
        fs.writeFileSync(dstFile, replace_1.prettierFile(generateNewLangFile(messages, obj)));
    }
}
function importMessages(file, lang) {
    let messagesToImport = getMessagesToImport(file);
    const allMessages = getLangData_1.getFlattenLangData();
    messagesToImport = _.pickBy(messagesToImport, (message, key) => allMessages.hasOwnProperty(key));
    const keysByFiles = _.groupBy(Object.keys(messagesToImport), (key) => key.split('.')[0]);
    const messagesByFiles = _.mapValues(keysByFiles, (keys) => {
        const value = {};
        keys.forEach((k) => {
            const [, ...r] = k.split('.');
            value[r.join('.')] = messagesToImport[k];
        });
        return value;
    });
    _.forEach(messagesByFiles, (messages, file) => {
        writeMessagesToFile(messages, file, lang);
    });
}
exports.importMessages = importMessages;
//# sourceMappingURL=import.js.map