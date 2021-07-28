"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prettierFile = exports.generateNewLangFile = exports.replaceAndUpdate = void 0;
/**
 * @author Harden
 * @desc 更新文件
 */
const fs = require("fs-extra");
const _ = require("lodash");
const const_1 = require("../const");
const file_1 = require("./file");
Object.defineProperty(exports, "prettierFile", { enumerable: true, get: function () { return file_1.prettierFile; } });
const getLangData_1 = require("./getLangData");
var Situation;
(function (Situation) {
    Situation[Situation["ScriptString"] = 0] = "ScriptString";
    Situation[Situation["ScriptProps"] = 1] = "ScriptProps";
    Situation[Situation["ScriptJsx"] = 2] = "ScriptJsx";
    Situation[Situation["ScriptExprTemplate"] = 3] = "ScriptExprTemplate";
    Situation[Situation["JavaScriptString"] = 4] = "JavaScriptString";
    Situation[Situation["JavaScriptProps"] = 5] = "JavaScriptProps";
    Situation[Situation["JavaScriptJsx"] = 6] = "JavaScriptJsx";
    Situation[Situation["JavaScriptExprTemplate"] = 7] = "JavaScriptExprTemplate";
    Situation[Situation["TemplateString"] = 8] = "TemplateString";
    Situation[Situation["TemplateReplace"] = 9] = "TemplateReplace";
    Situation[Situation["TemplateExprString"] = 10] = "TemplateExprString";
    Situation[Situation["TemplateAttrString"] = 11] = "TemplateAttrString";
    Situation[Situation["TemplateExprInterpolation"] = 12] = "TemplateExprInterpolation";
})(Situation || (Situation = {}));
/**
 * 存在中文场景
 * @param types 中文场景标记
 */
function getSituationType(types) {
    if (types.includes("script")) {
        if (types.includes("string"))
            return Situation.ScriptString;
        if (types.includes("jsx"))
            return Situation.ScriptJsx;
        if (types.includes("props"))
            return Situation.ScriptProps;
        if (types.includes("exprTemplate"))
            return Situation.ScriptExprTemplate;
    }
    if (types.includes("javascript")) {
        if (types.includes("string"))
            return Situation.JavaScriptString;
        if (types.includes("jsx"))
            return Situation.JavaScriptJsx;
        if (types.includes("props"))
            return Situation.JavaScriptProps;
        if (types.includes("exprTemplate"))
            return Situation.JavaScriptExprTemplate;
    }
    if (types.includes("template")) {
        if (types.includes("string"))
            return Situation.TemplateString;
        if (types.includes("replace"))
            return Situation.TemplateReplace;
        if (types.includes("exprString"))
            return Situation.TemplateExprString;
        if (types.includes("attrString"))
            return Situation.TemplateAttrString;
        if (types.includes("exprInterpolation"))
            return Situation.TemplateExprInterpolation;
    }
}
function generateNewLangFile(key, value) {
    const obj = _.set({}, key, value);
    return file_1.prettierFile(`${JSON.stringify(obj, null, 2)}`);
}
exports.generateNewLangFile = generateNewLangFile;
/**
 * 更新文件
 * @param filePath 当前文件路径
 * @param arg  目标字符串对象
 * @param key  目标 key
 * @param validateDuplicate 是否校验文件中已经存在要写入的 key
 */
function replaceAndUpdate(filePath, arg, key, validateDuplicate) {
    const code = file_1.readFile(filePath);
    let newCode;
    const { text, rawText, range: { start, end }, type: types, attrName, } = arg;
    switch (getSituationType(types)) {
        case Situation.ScriptString:
            newCode = `${code.slice(0, start)}this.$t('${key}')${code.slice(end)}`;
            break;
        case Situation.ScriptProps:
            newCode = `${code.slice(0, start)}function(){return this.$t('${key}')}${code.slice(end)}`;
            break;
        case Situation.ScriptJsx:
            newCode = `${code.slice(0, start)}{this.$t('${key}')}${code.slice(end)}`;
            break;
        case Situation.ScriptExprTemplate: {
            const varInStrs = rawText.match(/(\$\{[^\}]+?\})/g).map((i) => i.slice(2, -1));
            newCode = `${code.slice(0, start)}this.$t('${key}',[${varInStrs.join(",")}])${code.slice(end)}`;
            console.log(`${filePath} may need scan again!`);
            break;
        }
        case Situation.JavaScriptString:
            newCode = `${code.slice(0, start)}window.${const_1.I18N_NAME}.$t('${key}')${code.slice(end)}`;
            break;
        case Situation.JavaScriptJsx:
            newCode = `${code.slice(0, start)}{window.${const_1.I18N_NAME}.$t('${key}')}${code.slice(end)}`;
            break;
        case Situation.JavaScriptExprTemplate: {
            const varInStrs = rawText.match(/(\$\{[^\}]+?\})/g).map((i) => i.slice(2, -1));
            newCode = `${code.slice(0, start)}window.${const_1.I18N_NAME}.$t('${key}',[${varInStrs.join(",")}])${code.slice(end)}`;
            console.log(`${filePath} may need scan again!`);
            break;
        }
        case Situation.TemplateString:
            newCode = `${code.slice(0, start)}{{$t('${key}')}}${code.slice(end)}`;
            break;
        case Situation.TemplateReplace:
            newCode = `${code.slice(0, start)}{{${text}}}${code.slice(end)}`;
            console.log(`${filePath} may need scan again!`);
            break;
        case Situation.TemplateAttrString:
            newCode = `${code.slice(0, start)}:${attrName}="$t('${key}')"${code.slice(end)}`;
            break;
        case Situation.TemplateExprString:
            newCode = `${code.slice(0, start)}$t('${key}')${code.slice(end)}`;
            break;
        case Situation.TemplateExprInterpolation: {
            const varInStrs = rawText.match(/(\$\{[^\}]+?\})/g).map((i) => i.slice(2, -1));
            newCode = `${code.slice(0, start)}$t('${key}',[${varInStrs.join(",")}])${code.slice(end)}`;
            console.log(`${filePath} may need scan again!`);
            break;
        }
        default:
            break;
    }
    try {
        // 首先更新语言文件
        updateLangFiles(key, text, validateDuplicate);
        // 若更新成功再替换代码
        // return writeFile(filePath, newCode)
        file_1.writeFile(filePath, newCode);
    }
    catch (e) {
        // return Promise.reject(e.message)
        throw new Error(e.message);
    }
}
exports.replaceAndUpdate = replaceAndUpdate;
/**
 * 更新翻译文件
 */
function updateLangFiles(keyValue, text, validateDuplicate) {
    if (!keyValue) {
        return;
    }
    const [fileName, ...fullKeyArrs] = keyValue.split(".");
    const fullKey = fullKeyArrs.join(".");
    const targetFilename = `${const_1.LAND_DIR["zh"]}/${fileName}.json`;
    if (!fs.existsSync(targetFilename)) {
        fs.writeFileSync(targetFilename, generateNewLangFile(fullKey, text.trim()));
        console.log(`成功新建语言文件 ${targetFilename}`);
    }
    else {
        const mainContent = getLangData_1.getFileLangData(targetFilename);
        const obj = mainContent;
        if (Object.keys(mainContent).length === 0) {
            console.log(`${targetFilename}.json 解析失败，该文件包含的文案无法自动补全`);
        }
        if (validateDuplicate && _.get(mainContent, fullKey) !== undefined) {
            console.log(`${targetFilename}.json 中已存在 key 为 \`${fullKey}\` 的翻译，请重新命名变量`);
            throw new Error("duplicate");
        }
        // \n 会被自动转义成 \\n，这里转回来
        text = text.replace(/\\n/gm, "\n");
        _.set(obj, fullKey, text.trim());
        fs.writeFileSync(targetFilename, file_1.prettierFile(`${JSON.stringify(mainContent)}`));
    }
}
//# sourceMappingURL=replace.js.map