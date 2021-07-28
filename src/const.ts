// 中文的正则表达式
export const DOUBLE_BYTE_REGEX = /[^\x00-\xff]/g;
export const DOUBLE_BYTE_REGEX_GREEDY = /[^\x00-\xff]+/g;

/**
 * 配置数据
 */
export const I18N_GLOB = {
  zh: "./locale/zh/**/*.json",
  en: "./locale/en/**/*.json",
};
export const LAND_DIR = {
  zh: "./locale/zh",
  en: "./locale/en",
};
export const LAND_ROOT = "index";
// window[i18n_name]=i18n对象
export const I18N_NAME = "i18n";
// 词库导出
export const EXPORT_LANGS = ["en"];
export const DIST_DIR = "./export";
