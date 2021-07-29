"use strict";
/**
 * @description 导出待翻译文件
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportMessages = void 0;
const d3_dsv_1 = require("d3-dsv");
const fs = require("fs");
const config_1 = require("../config");
const getLangData_1 = require("../extract/getLangData");
/**
 *
 * @param file 导出翻译文件路径
 * @param lang 指定翻译语种
 */
function exportMessages(file, lang) {
    const langs = lang ? [lang] : config_1.EXPORT_LANGS;
    const allMessages = getLangData_1.getFlattenLangData();
    langs.map((lang) => {
        const existingTranslations = getLangData_1.getFlattenLangData(lang);
        const messagesToTranslate = Object.keys(allMessages)
            .filter((key) => !existingTranslations.hasOwnProperty(key))
            .map((key) => {
            let message = allMessages[key];
            message = JSON.stringify(message).slice(1, -1);
            return [key, message, ""];
        });
        if (messagesToTranslate.length === 0) {
            console.log(`All the messages in ${lang} have been translated.`);
            return;
        }
        messagesToTranslate.unshift(["key", "中文", config_1.langDisplayInTsv[lang]]);
        const content = d3_dsv_1.tsvFormatRows(messagesToTranslate);
        const sourceFile = file || `${lang}.tsv`;
        fs.writeFileSync(sourceFile, content);
        console.log(`Exported ${messagesToTranslate.length} message(s).`);
    });
}
exports.exportMessages = exportMessages;
//# sourceMappingURL=export.js.map