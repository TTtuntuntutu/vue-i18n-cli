"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIST_DIR = exports.EXPORT_LANGS = exports.I18N_NAME = exports.LAND_ROOT = exports.LAND_DIR = exports.I18N_GLOB = exports.langDisplayInTsv = exports.DOUBLE_BYTE_REGEX_GREEDY = exports.DOUBLE_BYTE_REGEX = void 0;
// 中文的正则表达式
exports.DOUBLE_BYTE_REGEX = /[^\x00-\xff]/g;
exports.DOUBLE_BYTE_REGEX_GREEDY = /[^\x00-\xff]+/g;
// 语种对应中文文案
exports.langDisplayInTsv = {
    zh: "中文",
    en: "英文",
};
/**
 * 配置数据
 */
exports.I18N_GLOB = {
    zh: "./locale/zh/**/*.json",
    en: "./locale/en/**/*.json",
};
exports.LAND_DIR = {
    zh: "./locale/zh",
    en: "./locale/en",
};
exports.LAND_ROOT = "index";
// window[i18n_name]=i18n对象
exports.I18N_NAME = "i18n";
// 词库导出
exports.EXPORT_LANGS = ["en"];
exports.DIST_DIR = "./export";
//# sourceMappingURL=index.js.map