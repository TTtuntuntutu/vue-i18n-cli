#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander = require("commander");
const ora = require("ora");
const export_1 = require("./export");
const extract_1 = require("./extract/extract");
const import_1 = require("./import");
const unused_1 = require("./unused");
const unscanned_1 = require("./unscanned");
/**
 * 进度条加载
 * @param text
 * @param callback
 */
function spining(text, callback) {
    const spinner = ora(`${text}中...`).start();
    if (callback) {
        callback();
    }
    spinner.succeed(`${text}成功`);
}
commander
    .version("1.0.0")
    .option("--extract [scanPath] [ignorePaths...]", "提取指定文件夹下的中文")
    .option("--export [file] [lang]", "导出未翻译的文案")
    .option("--import [file] [lang]", "导入翻译文案")
    .option("--unused [isDelete]", "查询未使用的文案，支持自动删除")
    .option("--unscanned [scanPath] [ignorePaths...]", "查询指定文件夹下，仍存在中文的文件")
    .parse(process.argv);
if (commander.extract) {
    if (commander.extract === true) {
        extract_1.extractAll();
    }
    else {
        const [scanPath, ...ignorePaths] = commander.extract;
        extract_1.extractAll(scanPath, ignorePaths);
    }
}
if (commander.export) {
    spining("导出未翻译文案", () => {
        if (commander.export === true && commander.args.length === 0) {
            export_1.exportMessages();
        }
        else if (commander.args) {
            export_1.exportMessages(commander.export, commander.args[0]);
        }
    });
}
if (commander.import) {
    spining("导入翻译文案", () => {
        if (commander.import === true || commander.args.length === 0) {
            console.log("请按格式输入：--import [file] [lang]");
        }
        else if (commander.args) {
            import_1.importMessages(commander.import, commander.args[0]);
        }
    });
}
if (commander.unused) {
    const isDelete = ["y", "Y", "yes", "Yes", "YES"].includes(commander.unused);
    spining("导出未使用的文案", () => {
        unused_1.findUnUsed(isDelete);
    });
}
if (commander.unscanned) {
    if (commander.extract === true) {
        unscanned_1.findUnScanned();
    }
    else {
        const [scanPath, ...ignorePaths] = commander.unscanned;
        unscanned_1.findUnScanned(scanPath, ignorePaths);
    }
}
//# sourceMappingURL=index.js.map