<template>
  <section></section>
</template>

<script>
export default {
  name: 'TextInScript',
  props: {
    name: {
      type: String,
      default: '中国乒乓球队' // 标记：["script", "props"]
    }
  },
  data() {
    return {
      // 标记：["script", "string"]
      run: '跑步',
      swim: `游泳`,
      // 标记：["script", "jsx"]
      content: <span data-text="冲冲！">加油</span>
    }
  },
  computed: {
    inviteToRun() {
      // 标记：["script", "exprTemplate"]
      return `${this.run}，去不？`
    },
    haveToRun() {
      return `${this.run + '去阿!'}`
    }
  }
}
</script>

<style lang="less"></style>
