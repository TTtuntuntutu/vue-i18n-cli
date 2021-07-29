/**
 * @description 导入翻译文件
 */
import { tsvParseRows } from "d3-dsv";
import { getFlattenLangData, getFileLangData } from "../extract/getLangData";
import * as fs from "fs";
import * as path from "path";
import * as _ from "lodash";
import { LAND_DIR } from "../config";
import { prettierFile } from "../extract/replace";

/**
 * 获取导入文件原始数据
 * @param file
 */
function getMessagesToImport(file: string) {
  const content = fs.readFileSync(file).toString();
  let index = 0;

  const messages = tsvParseRows(content, ([key, , translateValue]) => {
    // 第一行标题不处理
    if (index) {
      try {
        // value 的形式和 JSON 中的字符串值一致，其中的特殊字符是以转义形式存在的，
        // 如换行符 \n，在 value 中占两个字符，需要转成真正的换行符。
        translateValue = JSON.parse(`"${translateValue}"`);
      } catch (e) {
        throw new Error(`Illegal message: ${translateValue}`);
      }

      return [key, translateValue];
    } else {
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
    const errorMessage = "Duplicate messages detected: \n" + [...duplicateKeys].join("\n");
    console.error(errorMessage);
    process.exit(1);
  }
  return rst;
}

function generateNewLangFile(messages, obj = {}) {
  for (const [key, value] of Object.entries(messages)) {
    obj = _.set(obj, key, value);
  }

  return prettierFile(`${JSON.stringify(obj, null, 2)}`);
}

/**
 * 写入翻译文件
 * @param messages 翻译后的数据
 * @param file 写入位置，文件名
 * @param lang 翻译语种
 */
function writeMessagesToFile(messages: any, file: string, lang: string) {
  const dstFile = `${path.resolve(LAND_DIR[lang], file)}.json`;

  if (!fs.existsSync(dstFile)) {
    fs.writeFileSync(dstFile, prettierFile(generateNewLangFile(messages)));
  } else {
    const mainContent = getFileLangData(dstFile);
    const obj = mainContent;

    fs.writeFileSync(dstFile, prettierFile(generateNewLangFile(messages, obj)));
  }
}

function importMessages(file: string, lang = "en"): void {
  let messagesToImport = getMessagesToImport(file);
  const allMessages = getFlattenLangData();
  messagesToImport = _.pickBy(messagesToImport, (message, key) => allMessages.hasOwnProperty(key));
  const keysByFiles = _.groupBy(Object.keys(messagesToImport), (key) => key.split(".")[0]);

  const messagesByFiles = _.mapValues(keysByFiles, (keys) => {
    const value = {};
    keys.forEach((k) => {
      const [, ...r] = k.split(".");
      value[r.join(".")] = messagesToImport[k];
    });

    return value;
  });

  _.forEach(messagesByFiles, (messages, file) => {
    writeMessagesToFile(messages, file, lang);
  });
}

export { importMessages };
