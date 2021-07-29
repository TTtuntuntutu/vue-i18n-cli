<template>
  <section>
    <!-- 属性没有处理 -->
    <p data-test="疫情下的2021" />
    <p @data-expression1="hello('体育')" />
    <p :data-expression2="`金牌数：${num}`" />

    <!-- 表达式仅支持模版字符串 -->
    <p>{{ '体育' + text }}</p>

    <!-- 这里不会处理“更高”、“更快” -->
    <p>更高 {{ `更${text2}` }} 更快</p>

    <!-- if逻辑不会处理 -->
    <p v-if="goChina">东京欢迎您</p>
    <p v-else>嘿嘿嘿</p>

    <!-- 具名slot不会处理 -->
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
  name: 'TextKiwiCannot',
  props: {
    name: {
      type: String,
      default: '中国乒乓球队' // props default值不会处理
    }
  },
  data() {
    return {
      run: '跑步',
      text2: '强',
      // jsx不会处理
      content: <span data-text="冲冲！">加油</span>
    }
  },
  computed: {
    haveToRun() {
      return `${this.run + '去阿!'}`
    }
  }
}
</script>

<style lang="less"></style>
