<template>
  <!-- 
        /*
    * 组件 导航条
    * 参考
    * van-tabbar https://vant-contrib.gitee.io/vant/v2/#/zh-CN/tabbar
    *
    * 属性            说明              类型           可选择参数
    * type           当前显示类型        string        button 按钮
    * color          按钮颜色           string        -
    * labelStyle     文本样式           string        -
    * ----------------同 van-tabbar-item ---------------
    * */
   -->
  <van-tabbar-item v-bind="$attrs" v-on="$listeners">
    <template v-if="$attrs.type === 'button'">
      <van-button :color="$attrs.color" block="block">
        <span :style="$attrs.labelStyle">
          <slot></slot>
        </span>
      </van-button>
    </template>
    <template v-else>
      <slot></slot>
    </template>
  </van-tabbar-item>
</template>

<script>
export default {
  name: 'TabBarsItem',
};
</script>

<style lang="scss" scoped></style>
