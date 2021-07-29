<template>
  <section>
    <!-- 普通字符串，标记：["template", "string"] -->
    <p>东京奥运会</p>

    <!-- 属性值普通字符串，标记：["template", "attrString"] -->
    <p data-test="疫情下的2021" />

    <!-- 表达式内普通字符串，标记：["template", "exprString"] -->
    <p @data-expression1="hello('体育')" />
    <p>{{ '体育' + text }}</p>

    <!-- 表达式内含中文文案，标记：["template", "exprInterpolation"] -->
    <p :data-expression2="`金牌数：${num}`" />
    <p>{{ `金牌数：${num}` }}</p>
    <p>{{ `金牌数：${num + '个'}` }}</p>

    <!-- 表达式外包含中文文案，标记：["template", "replace"] -->
    <p>更高 {{ text2 }} 更快</p>

    <p v-if="goChina">东京欢迎您</p>
    <p v-else>嘿嘿嘿</p>

    <template v-slot:header>
      <p>下次巴黎见！</p>
    </template>

    <template v-slot:default>
      <p>中国队加油！</p>
    </template>
  </section>
</template>

<script>
export default {
  name: 'TextInTemplate',
  data() {
    return {
      text: '大国',
      text2: '更强',
      num: 10,
      goChina: true
    }
  },
  methods: {
    hello(v) {
      console.log(v)
    }
  }
}
</script>

<style lang="less"></style>
