/* eslint-disable @typescript-eslint/no-var-requires */
import * as _ from "lodash";
import * as pinyin from "pinyin";

/**
 * 根据中文文案生成拼音作为key
 * @param text 中文文案
 */
function textToPinyin(text: string): string {
  if (text) {
    try {
      let value = pinyin(text, {
        style: pinyin.STYLE_NORMAL,
      });

      value = value.flat().join("");

      return value;
    } catch (error) {
      return "";
    }
  } else {
    return "";
  }
}

/**
 * 查找已有词库中文案对应的key
 * @param langObj 词库对象数据
 * @param text 文案
 */
function findMatchKey(langObj: Record<string, string>, text: string): string | null {
  for (const key in langObj) {
    if (langObj[key] === text) {
      return key;
    }
  }

  return null;
}

/**
 * 返回词库对应key的值
 * @param langObj 词库对象数据
 * @param key
 */
function findMatchValue(langObj: Record<string, string>, key: string): string {
  return langObj[key];
}

/**
 * 将对象拍平
 * @param obj 原始对象
 * @param prefix
 */
function flatten(obj, prefix = ""): Record<string, string> {
  const propName = prefix ? prefix + "." : "",
    ret = {};

  for (const attr in obj) {
    if (_.isArray(obj[attr])) {
      ret[attr] = obj[attr].join(",");
    } else if (typeof obj[attr] === "object") {
      _.extend(ret, flatten(obj[attr], propName + attr));
    } else {
      ret[propName + attr] = obj[attr];
    }
  }
  return ret;
}

/**
 * 深度优先遍历对象中的所有 string 属性，即文案
 */
function traverse(obj, cb) {
  function traverseInner(obj, cb, path) {
    _.forEach(obj, (val, key) => {
      if (typeof val === "string") {
        cb(val, [...path, key].join("."));
      } else if (typeof val === "object" && val !== null) {
        traverseInner(val, cb, [...path, key]);
      }
    });
  }

  traverseInner(obj, cb, []);
}

export { textToPinyin, findMatchKey, findMatchValue, flatten, traverse };
