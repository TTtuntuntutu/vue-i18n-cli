"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUnScanned = void 0;
/**
 * @description 查找指定文件夹下，仍然存在中文的文件
 */
const file_1 = require("../extract/file");
const findChineseText_1 = require("../extract/findChineseText");
function findUnScanned(scanPath = "./src", ignorePaths = []) {
    const files = file_1.getSpecifiedFiles(scanPath, ignorePaths)
        .filter((file) => file.endsWith(".vue") || file.endsWith("js"))
        .filter(assertExistsChinese);
    console.log(files.length ? files : `${scanPath} 文件夹下没有待扫描文件`);
}
exports.findUnScanned = findUnScanned;
function assertExistsChinese(fileName) {
    const code = file_1.readFile(fileName);
    const texts = findChineseText_1.findChineseText(code, fileName);
    return texts.length > 0;
}
//# sourceMappingURL=unscanned.js.map