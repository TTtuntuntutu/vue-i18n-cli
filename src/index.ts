#!/usr/bin/env node

import * as commander from "commander";
import * as ora from "ora";
import { exportMessages } from "./import-export/export";
import { extractAll } from "./extract/extract";
import { importMessages } from "./import-export/import";
import { findUnUsed } from "./de-redundancy/unused";
import { findUnScanned } from "./de-redundancy/unscanned";

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
  .option(
    "--extract [scanPath] [ignorePaths...]",
    "提取指定文件夹下的中文，自动生成key，写入文案json文件，替换原文件"
  )
  .option("--export [file] [lang]", "导出未翻译的文案")
  .option("--import [file] [lang]", "导入翻译文案")
  .option("--unused [isDelete]", "输出未使用的文案，支持自动删除")
  .option("--unscanned [scanPath] [ignorePaths...]", "输出指定文件夹下，仍存在中文的文件")
  .parse(process.argv);

if (commander.extract) {
  if (commander.extract === true) {
    extractAll();
  } else {
    const [scanPath, ...ignorePaths] = commander.extract;
    extractAll(scanPath, ignorePaths);
  }
}

if (commander.export) {
  spining("导出未翻译文案", () => {
    if (commander.export === true && commander.args.length === 0) {
      exportMessages();
    } else if (commander.args) {
      exportMessages(commander.export, commander.args[0]);
    }
  });
}

if (commander.import) {
  spining("导入翻译文案", () => {
    if (commander.import === true || commander.args.length === 0) {
      console.log("请按格式输入：--import [file] [lang]");
    } else if (commander.args) {
      importMessages(commander.import, commander.args[0]);
    }
  });
}

if (commander.unused) {
  const isDelete = ["y", "Y", "yes", "Yes", "YES"].includes(commander.unused);

  spining("导出未使用的文案", () => {
    findUnUsed(isDelete);
  });
}

if (commander.unscanned) {
  if (commander.unscanned === true) {
    findUnScanned();
  } else {
    const [scanPath, ...ignorePaths] = commander.unscanned;
    findUnScanned(scanPath, ignorePaths);
  }
}
