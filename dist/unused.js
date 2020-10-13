"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUnUsed = void 0;
/**
 * @author Harden
 * @description 查找未使用的 key
 */
const fs = require("fs");
const _ = require("lodash");
const path = require("path");
const const_1 = require("./const");
const file_1 = require("./extract/file");
const getLangData_1 = require("./extract/getLangData");
/**
 * 输出未使用keys
 * @param isDelete 是否自动删除不需要的翻译文案
 */
function findUnUsed(isDelete) {
    const allMessages = getLangData_1.getFlattenLangData();
    const allKeys = Object.keys(allMessages);
    const allUsedKeys = findUsedKeys('./src');
    const allUnUsedKeys = allKeys.filter((k) => !allUsedKeys.includes(k));
    console.log(allUnUsedKeys);
    if (isDelete) {
        deleteUnusedKeys(allUnUsedKeys);
    }
}
exports.findUnUsed = findUnUsed;
/**
 * 获取项目中使用keys
 * @param fileName 路径
 */
function findUsedKeys(fileName) {
    if (!fs.existsSync(fileName))
        return;
    const usedKeys = [];
    if (file_1.isFile(fileName)) {
        usedKeys.push(...check(fileName));
    }
    if (file_1.isDirectory(fileName)) {
        const files = fs.readdirSync(fileName).filter((file) => {
            return !file.startsWith('.') && !['node_modules', 'build', 'dist'].includes(file);
        });
        files.forEach(function (val) {
            const temp = path.join(fileName, val);
            usedKeys.push(...findUsedKeys(temp));
        });
    }
    return usedKeys;
}
/**
 * 删除未使用的keys
 * @param keys key集合
 */
function deleteUnusedKeys(keys) {
    keys.forEach((keyValue) => {
        const [fileName, ...fullKeyArrs] = keyValue.split('.');
        const fullKey = fullKeyArrs.join('.');
        for (const [, root] of Object.entries(const_1.LAND_DIR)) {
            const targetFilename = `${root}/${fileName}.json`;
            const mainContent = getLangData_1.getFileLangData(targetFilename);
            _.unset(mainContent, fullKey);
            fs.writeFileSync(targetFilename, file_1.prettierFile(`${JSON.stringify(mainContent)}`));
        }
    });
}
/**
 * 获取当前文件下keys集合
 * @param fileName 路径
 */
function check(fileName) {
    const minifyReg = /\s+|[\r\n]/gm;
    const keyReg = /(\$t\(|path=)('|")([a-zA-Z0-9.]+)/gm;
    // 压缩字符串代码
    const code = file_1.readFile(fileName).replace(minifyReg, '');
    const sum = [];
    let arr;
    while ((arr = keyReg.exec(code)) !== null) {
        // 捕获第3个括号，即使用key的名字
        sum.push(arr[3]);
    }
    return sum;
}
//# sourceMappingURL=unused.js.map