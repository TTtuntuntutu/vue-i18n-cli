## Mondo解决了什么问题

方案解决的问题：Vue2.x项目的多语言解决方案。基于 [vue-i18n](https://kazupon.github.io/vue-i18n/zh/introduction.html) ，命令行工具 mondo-cli 一键提取中文，自动生成key并且替换，一键导入导出翻译文件，查询不再使用文案，同时使用[vscode 插件 i18n Ally](https://marketplace.visualstudio.com/items?itemName=antfu.i18n-ally) 帮助查看、管理文案。



方案提供的能力：

- [x] 一键提取 Vue 2.x 项目中的中文，自动生成key替换
- [x] 导出指定语种的待翻译文件
- [x] 导入指定语种的翻译完成文件
- [x] 查询项目中已不使用文案，支持自动化删除
- [x] 查询是否还有未提取的中文文案，展示文件路径
- [x] 支持多语言，不仅限于中英文



方案目前存在的问题：

- [ ] 文案使用国际化 Key 代替后，文案搜索麻烦，需要由文案找到key，再定位具体位置
- [ ] 未自动化处理需要[组件插值](https://kazupon.github.io/vue-i18n/zh/guide/interpolation.html#%E5%9F%BA%E6%9C%AC%E7%94%A8%E6%B3%95)场景（可做，但场景不多）
- [ ] 代码中的中文提取存在个别边缘情况未考虑
- [ ] 翻译文件给到后，还要UI调整，这里有时间差



## 使用文档

### 安装

- npm包：vue-i18n（当前版本：`^8.17.5`）
- vscode插件：[i18n Ally](https://marketplace.visualstudio.com/items?itemName=antfu.i18n-ally)
- mondo-cli



### 翻译配置

i18n Ally配置添加，` .vscode/settings.json` ：

```json
{
  "i18n-ally.localesPaths": "locale",
  "i18n-ally.displayLanguage": "zh",
  "i18n-ally.namespace": true,
  "i18n-ally.keystyle": "nested"
}
```



根目录创建 `locale` 文件夹：

![locale](/img/locale.png)





创建`i18n.js`，为vue-i18n导入翻译数据，当前建立在`.src`下，基于webpack api `require`：

```javascript
import Vue from 'vue'
import VueI18n from 'vue-i18n'

Vue.use(VueI18n)

function loadLocaleMessages() {
  const locales = require.context('../locale', true, /[A-Za-z0-9-_,\s]+\.json$/i)
  const messages = {}
  locales.keys().forEach(key => {
    const file_matched = key.match(/([A-Za-z0-9-_]+)\./i)
    const lang_matched = key.match(/\.\/([A-Za-z0-9-_]+)\//i)

    if (file_matched && file_matched.length > 1 && lang_matched && lang_matched.length > 1) {
      const filename = file_matched[1]
      const lang = lang_matched[1]

      messages[lang] = messages[lang] ? { ...messages[lang], [filename]: locales(key) } : { [filename]: locales(key) }
    }
  })

  console.log(messages)
  return messages
}

const i18n = new VueI18n({
  locale: process.env.VUE_APP_I18N_LOCALE || 'zh',
  fallbackLocale: process.env.VUE_APP_I18N_FALLBACK_LOCALE || 'zh',
  messages: loadLocaleMessages()
})

window.i18n = new Vue({ i18n })

export default i18n
```

- 其中 `process.env.VUE_APP_I18N_LOCALE` 是配置的环境变量；



在 `./src/main.js` 导入 `i18n.js` ，导入位置放在其他需要i18n作用文件之前，比如：

```javascript
import Vue from 'vue'
import App from './App'
import i18n from './i18n'
import router from './router'
import store from './store'

new Vue({
  i18n,
  render: h => h(App),
}).$mount('#app')
```



### 切换语言能力

语言信息作为全局变量存储(Vuex or Storage皆可)，vue-i18n提供了[切换语言环境](https://kazupon.github.io/vue-i18n/zh/guide/locale.html)的api，但它不支持`vue#props#default`文案切换。我们在项目中使用了Vue Router api 重刷：`this.$router.go(0)`。



### mondo-cli

![mondo](/img/mondo.png)



说明

- `extract`/`unscanned`：

  - `scanPath` 要扫描的文件夹或者文件路径；
  - `ignorePaths` 忽略的扫描文件夹或者文件路径，支持多个；

- `export`/`import`：

  - `file`：导出文件名，格式为`.tsv`；
  - `lang`：导出语言语种，默认是`en`；

  



### 前提约定

#### vue#script顶格写

- 正确：

  ```javascript
  <script>
  export default {
    name:'App',
    data() {
      return {
        hello: '你好'
      }
    },
  }
  <script>
  ```

- 错误：

  ```javascript
  <script>
    export default {
      name:'App',
      data() {
        return {
          hello: '你好'
        }
      },
    }
  </script>
  ```




#### 避免"不合理"情况

1. javascript属性名存在中文

   ```javascript
   export const mainInfoLanguage = {
     tuya: {
       '杭州涂鸦信息技术有限公司': 'HANGZHOU TUYA INFORMATION TECHNOLOGY CO., LTD'
     }
   }
   ```

2. 模版字符串内不能嵌套模版字符串

  ​     


#### 未考虑情况

1. jsx仅考虑以下两种情况：

    ```jsx
    jsxData: (
      <el-form>
        <el-form-item label="人民币：">10元</el-form-item>
      </el-form>
    ) 
    ```

2. `v-if`、`v-else-if` 判断逻辑中存中文需要手动替换，或者将该逻辑放在vue script中，因为ast中拿不到`v-if`的位置：

   ```html
   <p v-if="greeting === '你好'">
     你好
   </p>
   ```

3. 未处理函数式组件 




