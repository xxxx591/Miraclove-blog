
<template>
  <!-- 
    /*
      * 组件 导航条
      * 参考
      * van-nav-bar https://vant-contrib.gitee.io/vant/v2/#/zh-CN/nav-bar
      *
      * 属性            说明              类型
      * 同 van-nav-bar  同 van-nav-bar    同 van-nav-bar
    * */
   -->
  <van-nav-bar class="cq_navbar" v-bind="$attrs" v-on="$listeners">
    <template #left>
      <slot name="left"></slot>
    </template>
    <template #title>
      <slot name="title"></slot>
    </template>
    <template #right>
      <slot name="right"></slot>
    </template>
  </van-nav-bar>
</template>

<script>
 
export default {
  name: "NavBar",

};
</script>

<style lang="scss" scoped></style>
