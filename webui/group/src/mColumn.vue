<template>
  <vxe-column v-bind="$attrs" v-on="$listeners">
    <!-- 
                    插槽 同 vxe-column 的插槽
                -->
    <template v-for="(value, key) in this.$slots">
      <template :slot="key" slot-scope="scope">
        <slot :name="key" :scope="scope"></slot>
      </template>
    </template>
  </vxe-column>
</template>

<script>
export default {
  name: "m-column",
  // 组件内部要使用的变量
  data() {
    return {};
  },
  methods: {},
  // 数据初始化后 调用的方法
  created() {},
  // Dom加载完后 调用的方法
  mounted() {},
  // 组件销毁后 调用的方法
  beforeDestroy() {},
};
</script>

<style lang="scss" scoped></style>
