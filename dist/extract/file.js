"use strict";
/**
 * @author Harden
 * @description 文件相关
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.prettierFile = exports.isFile = exports.isDirectory = exports.writeFile = exports.readFile = exports.getSpecifiedFiles = void 0;
const fs = require("fs");
const path = require("path");
const prettier = require("prettier");
/**
 * 获取文件夹下符合要求的所有文件
 * @function getSpecifiedFiles
 * @param  {string} fullPath 路径
 */
function getSpecifiedFiles(fullPath, ignoreFullPaths) {
    // 支持fullPath是文件url
    if (fs.statSync(fullPath).isFile() && !ignoreFullPaths.includes(fullPath)) {
        return [fullPath];
    }
    // 支持fullPath是文件夹url
    return fs.readdirSync(fullPath).reduce((files, file) => {
        const name = path.join(fullPath, file);
        if (ignoreFullPaths.includes(name))
            return files;
        const ifDirectory = isDirectory(name);
        const ifFile = isFile(name);
        if (ifDirectory) {
            return files.concat(getSpecifiedFiles(name, ignoreFullPaths));
        }
        if (ifFile) {
            return files.concat(name);
        }
        return files;
    }, []);
}
exports.getSpecifiedFiles = getSpecifiedFiles;
/**
 * 读取文件
 * @param fileName
 */
function readFile(fileName) {
    if (fs.existsSync(fileName)) {
        return fs.readFileSync(fileName, "utf-8");
    }
}
exports.readFile = readFile;
/**
 * 写文件
 * @param fileName
 */
function writeFile(filePath, file) {
    if (fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, file);
    }
}
exports.writeFile = writeFile;
/**
 * 判断是文件夹
 * @param fileName
 */
function isDirectory(fileName) {
    if (fs.existsSync(fileName)) {
        return fs.statSync(fileName).isDirectory();
    }
}
exports.isDirectory = isDirectory;
/**
 * 判断是否是文件
 * @param fileName
 */
function isFile(fileName) {
    if (fs.existsSync(fileName)) {
        return fs.statSync(fileName).isFile();
    }
}
exports.isFile = isFile;
/**
 * 使用 Prettier 格式化文件
 * @param fileContent
 */
function prettierFile(fileContent) {
    try {
        return prettier.format(fileContent, {
            parser: "json",
        });
    }
    catch (e) {
        console.error(`代码格式化报错！${e.toString()}\n代码为：${fileContent}`);
        return fileContent;
    }
}
exports.prettierFile = prettierFile;
//# sourceMappingURL=file.js.map