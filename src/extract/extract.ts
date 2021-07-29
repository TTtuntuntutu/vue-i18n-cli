/**
 * @desc extract命令入口文件
 */
import * as _ from "lodash";
import * as path from "path";
import * as randomstring from "randomstring";
import { LAND_ROOT } from "../const";
import { findMatchKey, findMatchValue, textToPinyin } from "../utils";
import { getSpecifiedFiles, readFile } from "./file";
import { findChineseText, TextSnippet } from "./findChineseText";
import { getFlattenLangData } from "./getLangData";
import { replaceAndUpdate } from "./replace";

type TextsInFiles = { file: string; texts: TextSnippet[] }[];

/**
 * 扫描项目目标文件中文，以文件维度组织
 * @param scanPath 待扫描文件地址 or 文件夹地址
 * @param ignorePath  忽略的文件地址、文件夹地址集合
 * @return 文件维度组织的中文片段集合
 */
function findAllChineseText(scanPath: string, ignorePaths: string[]): TextsInFiles {
  const fullPath = path.resolve(process.cwd(), scanPath);
  const ignoreFullPaths = ignorePaths.map((p) => path.resolve(process.cwd(), p));

  // 拿到所有有效文件路径，现仅支持vue和js后缀
  const files = getSpecifiedFiles(fullPath, ignoreFullPaths).filter(
    (file) => file.endsWith(".vue") || file.endsWith("js")
  );

  return files.reduce((pre, file) => {
    const code = readFile(file);
    const texts = findChineseText(code, file);

    // 调整文案顺序，一个文件中文案从后往前替换，避免位置更新导致替换出错
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
function extractAll(scanPath = "./", ignorePaths: string[] = []): void {
  const allTargetStrs = findAllChineseText(scanPath, ignorePaths);

  if (allTargetStrs.length === 0) {
    console.log("没有发现可替换的文案！");
    return;
  }

  // 以文件维度去处理
  allTargetStrs.forEach((item) => {
    const currentFilename = item.file;
    const targetStrs = item.texts;

    // 当前已有 翻译数据
    const currLangObj = getFlattenLangData();

    // 缓存
    const virtualMemory = {};

    // key信息：取前4位中文转为拼音
    const translateTexts = targetStrs.reduce((prev, curr) => {
      // 避免翻译的字符里包含数字或者特殊字符等情况
      const reg = /[^a-zA-Z\x00-\xff]+/g;
      const findText = curr.text.match(reg);
      const transText = findText ? findText.join("").slice(0, 4) : "中文符号";
      return prev.concat(textToPinyin(transText));
    }, []);

    //确定key
    const replaceableStrs = targetStrs.reduce((prev, curr, i) => {
      if (curr.notNewKey) {
        return prev.concat({
          target: curr,
        });
      }

      if (!virtualMemory[curr.text]) {
        const key = findMatchKey(currLangObj, curr.text);
        if (key) {
          virtualMemory[curr.text] = key; //缓存
          return prev.concat({
            target: curr,
            key,
          });
        } else {
          //key生成的替补选手
          const uuidKey = `${randomstring.generate({
            length: 4,
            charset: "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM",
          })}`;

          const handleText = translateTexts[i] ? _.camelCase(translateTexts[i] as string) : uuidKey;
          const reg = /[a-zA-Z]+/;
          // 对于翻译后的英文再次过滤，只保留英文字符
          const purifyText = handleText
            .split("")
            .filter((letter) => reg.test(letter))
            .join("");
          const transText = purifyText || "zhongwen";
          let transKey = `${LAND_ROOT}.${transText}`;

          // 添加一位数字位，防止出现前四位相同但是整体文案不同的情况
          let occurTime = 1;
          while (
            findMatchValue(currLangObj, transKey) !== curr.text &&
            _.keys(currLangObj).includes(`${transKey}${occurTime >= 2 ? occurTime : ""}`)
          ) {
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
      } else {
        return prev.concat({
          target: curr,
          key: virtualMemory[curr.text],
        });
      }
    }, []);

    try {
      replaceableStrs.forEach((obj) => {
        replaceAndUpdate(currentFilename, obj.target, obj.key, false);
      });
    } catch (error) {
      console.log(`${currentFilename}替换失败，存在问题：${error}`);
    }
  });
}

export { extractAll };
