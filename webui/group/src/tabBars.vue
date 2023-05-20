<template>
  <!-- 
        /*
    * 组件 导航条
    * 参考
    * van-tabbar https://vant-contrib.gitee.io/vant/v2/#/zh-CN/tabbar
    *
    * 属性            说明              类型           可选择参数
    * ----------------同 van-tabbar ---------------
    * */
   -->
  <van-tabbar class="cq_tabbar" v-bind="$attrs" v-on="$listeners">
    <slot></slot>
  </van-tabbar>
</template>

<script>
export default {
  name: "TabBars",
};
</script>

<style lang="scss" scoped></style>
