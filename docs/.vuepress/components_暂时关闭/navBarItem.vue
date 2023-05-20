<template>
  <!-- 
    /*
    * 组件 导航条
    * 参考
    * van-nav-bar https://vant-contrib.gitee.io/vant/v2/#/zh-CN/nav-bar
    *
    * 属性            说明              类型           可选择参数
    * slot           插槽名            string         left title right
    * type           当前导航条类型      string        icon 图标
    * ----------------当type为icon 同 van-icon ---------------
    * ----------------当type为其他 同 span ---------------
    * */
   -->
  <component
    :is="$attrs.type === 'icon' ? 'van-icon' : 'span'"
    v-bind="$attrs"
    v-on="$listeners"
  >
    <slot></slot>
  </component>
</template>

<script>
export default {
  name: "NavBarItem",
};
</script>

<style lang="scss" scoped></style>
