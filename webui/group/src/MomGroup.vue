<template>
  <p class="labelTitle" :name="name">
    {{ name }}<span v-if="tips" class="tips">({{ tips }})</span>
  </p>
</template>
<script>
export default {
  name: 'MomGroup',
  /**
   * ctj-group属性参数
   * @property {string} [name] 分组名称
   * @property {string} [tips] 补充说明，默认值空
   */
  props: {
    // 分组名称
    name: {
      type: String,
      default: '分组名称',
    },
    // 补充信息
    tips: {
      type: String,
      default: '',
    },
  },
  data() {
    return {}
  },
  mounted() {
    console.log('asdasda')
  },
}
</script>
<style lang="css" scoped>
.labelTitle {
  font-weight: bolder;
  font-size: 16px;
  border-left: 4px solid #1890ff;
  padding-left: 4px;
}
.tips {
  font-size: 12px;
  color: #606266;
  font-weight: 400;
  padding-left: 4px;
}
</style>
