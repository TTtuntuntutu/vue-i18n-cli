[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

i18n(Internationalization)，即国际化，在现在业务开发中是很常见的需求。一般在选择对应前端开发框架的i18n库（比如[vue i18n](https://kazupon.github.io/vue-i18n/)、[react-i18next](https://github.com/i18next/react-i18next)）、编辑器插件的辅助（比如[vscode 插件 i18n Ally](https://marketplace.visualstudio.com/items?itemName=antfu.i18n-ally)）后，就可以上手开发了。然而这个过程并不轻松，在代码文件找文案、为文案生成key标识、写入翻译文件、替换源代码、和业务开发流程的分割等，都导致这是一件非常头疼的事情。



参考 [alibaba/kiwi/kiwi-cli](https://github.com/alibaba/kiwi/tree/master/kiwi-cli)，深挖vue2.x项目场景的落地，开发了Node命令行工具vue-i18n-extract，由它来负责上述的繁琐过程。优点在于场景覆盖全，经过实际生产项目检验。

注意，vue-i18n-extract基于项目原始文案是中文文案。




## 功能

自动化提取：

- [x] 一键提取 Vue 2.x 项目中的中文，自动生成key，写入翻译json文件，在源代码替换；

导入导出：

- [x] 导出指定语种的待翻译文件，格式为`.tsv`；
- [x] 导入指定语种的翻译完成文件，格式为`.tsv`；

本地文案管理：

- [x] 输出项目中已不使用文案，支持自动化删除；
- [x] 输出存在未提取的中文文案的文件路径；

其他：

- [x] 支持多语言，不仅限于中英文；



使用上存在的问题：

- [ ] 使用key替换源代码中的中文文案后，搜索中文文案所在位置麻烦，需要先通过文案找到key，再通过key定位具体位置；



## 使用说明

参见：[这里！](https://github.com/TTtuntuntutu/Mondo-cli/wiki/%E4%BD%BF%E7%94%A8%E6%96%87%E6%A1%A3)


