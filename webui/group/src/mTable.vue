<template>
  <!-- 
      参考：
      vxe-table  https://vxetable.cn/v3/#/table/api
      其他属性 同 vxe-table 的Props
      注意： 这个组件不能当作【根组件】 否则他无法根据父元素来自适应高度
    -->
  <vxe-table
    v-bind="modelProps"
    ref="vxeTable"
    :data="$attrs.data"
    v-on="$listeners"
    class="vxetable-style"
  >
    <!--  插槽 同 vxe-table 对应的插槽-->
    <template v-for="(value, key) in this.$slots">
      <template :slot="key">
        <slot :name="key"></slot>
      </template>
    </template>
  </vxe-table>
</template>

<script>
export default {
  name: "m-table",
  // 组件内部要使用的变量
  data() {
    return {
      // 组件相关属性
      modelProps: {},
    };
  },
  methods: {},
  // 数据初始化后 调用的方法
  created() {
    // 默认
    const defaultProps = {
      height: "auto",
      border: true,
      "show-overflow": true,
      "row-config": { isCurrent: true },
      "sort-config": { trigger: "cell" },
      // 指定大于指定列时自动启动横向虚拟滚动，如果为 0 则总是启用；如果需要关闭，可以设置 enabled 为 false
      "scroll-x": { gt: 5 },
      // 指定大于指定行时自动启动纵向虚拟滚动，如果为 0 则总是启用；如果需要关闭，可以设置 enabled 为 false（注：启用纵向虚拟滚动之后将不能支持动态行高）
      "scroll-y": { gt: 20 },
    };
    const noNeedProps = {
      columnConfig: undefined,
    };
    this.modelProps = Object.assign(
      defaultProps,
      this.modelProps,
      this.$attrs,
      noNeedProps
    );
  },
  // Dom加载完后 调用的方法
  mounted() {},
  // 组件销毁后 调用的方法
  beforeDestroy() {},
};
</script>

<style lang="scss" scoped></style>
